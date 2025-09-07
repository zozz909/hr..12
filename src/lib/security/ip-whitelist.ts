import { executeQuery } from '@/lib/db';

export interface AllowedDevice {
  id: string;
  ipAddress: string;
  description: string;
  addedAt: string;
  lastUsed?: string;
  isActive: boolean;
}

export interface SecuritySettings {
  ipWhitelistEnabled: boolean;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  requireStrongPasswords: boolean;
}

export class IPWhitelistManager {
  private static cache: {
    settings?: SecuritySettings;
    devices?: AllowedDevice[];
    lastUpdate?: number;
  } = {};

  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * جلب إعدادات الأمان من قاعدة البيانات مع التخزين المؤقت
   */
  static async getSecuritySettings(): Promise<SecuritySettings> {
    const now = Date.now();
    
    // استخدام التخزين المؤقت إذا كان متاحاً وحديثاً
    if (
      this.cache.settings && 
      this.cache.lastUpdate && 
      (now - this.cache.lastUpdate) < this.CACHE_DURATION
    ) {
      return this.cache.settings;
    }

    try {
      const result = await executeQuery(`
        SELECT * FROM security_settings 
        ORDER BY created_at DESC 
        LIMIT 1
      `);

      let settings: SecuritySettings;

      if (result.length > 0) {
        const dbSettings = result[0];
        settings = {
          ipWhitelistEnabled: dbSettings.ip_whitelist_enabled || false,
          maxLoginAttempts: dbSettings.max_login_attempts || 5,
          sessionTimeoutMinutes: dbSettings.session_timeout_minutes || 60,
          requireStrongPasswords: dbSettings.require_strong_passwords || true
        };
      } else {
        // إعدادات افتراضية
        settings = {
          ipWhitelistEnabled: false,
          maxLoginAttempts: 5,
          sessionTimeoutMinutes: 60,
          requireStrongPasswords: true
        };
      }

      // تحديث التخزين المؤقت
      this.cache.settings = settings;
      this.cache.lastUpdate = now;

      return settings;
    } catch (error) {
      console.error('Error fetching security settings:', error);
      
      // إرجاع إعدادات افتراضية في حالة الخطأ
      return {
        ipWhitelistEnabled: false,
        maxLoginAttempts: 5,
        sessionTimeoutMinutes: 60,
        requireStrongPasswords: true
      };
    }
  }

  /**
   * جلب قائمة الأجهزة المصرح لها
   */
  static async getAllowedDevices(): Promise<AllowedDevice[]> {
    const now = Date.now();
    
    // استخدام التخزين المؤقت إذا كان متاحاً وحديثاً
    if (
      this.cache.devices && 
      this.cache.lastUpdate && 
      (now - this.cache.lastUpdate) < this.CACHE_DURATION
    ) {
      return this.cache.devices;
    }

    try {
      const result = await executeQuery(`
        SELECT * FROM allowed_devices 
        WHERE is_active = TRUE
        ORDER BY added_at DESC
      `);

      const devices: AllowedDevice[] = result.map((device: any) => ({
        id: device.id,
        ipAddress: device.ip_address,
        description: device.description,
        addedAt: device.added_at,
        lastUsed: device.last_used,
        isActive: device.is_active
      }));

      // تحديث التخزين المؤقت
      this.cache.devices = devices;
      this.cache.lastUpdate = now;

      return devices;
    } catch (error) {
      console.error('Error fetching allowed devices:', error);
      return [];
    }
  }

  /**
   * التحقق من السماح لعنوان IP بالوصول
   */
  static async isIPAllowed(clientIP: string): Promise<boolean> {
    try {
      const settings = await this.getSecuritySettings();
      
      // إذا لم تكن قائمة الأجهزة المصرح لها مفعلة، السماح لجميع العناوين
      if (!settings.ipWhitelistEnabled) {
        return true;
      }

      // السماح للعناوين المحلية دائماً
      if (this.isLocalIP(clientIP)) {
        return true;
      }

      const allowedDevices = await this.getAllowedDevices();
      
      // التحقق من وجود عنوان IP في القائمة
      const isAllowed = allowedDevices.some(device => 
        device.isActive && device.ipAddress === clientIP
      );

      // تسجيل آخر استخدام إذا كان العنوان مسموحاً
      if (isAllowed) {
        await this.updateLastUsed(clientIP);
      }

      return isAllowed;
    } catch (error) {
      console.error('Error checking IP allowlist:', error);
      // في حالة الخطأ، السماح بالوصول لتجنب قفل النظام
      return true;
    }
  }

  /**
   * تحديث آخر استخدام لجهاز
   */
  static async updateLastUsed(ipAddress: string): Promise<void> {
    try {
      await executeQuery(`
        UPDATE allowed_devices 
        SET last_used = NOW() 
        WHERE ip_address = ? AND is_active = TRUE
      `, [ipAddress]);
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  }

  /**
   * تسجيل محاولة تسجيل دخول
   */
  static async logLoginAttempt(
    ipAddress: string, 
    userEmail: string | null, 
    success: boolean, 
    failureReason?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await executeQuery(`
        INSERT INTO login_attempts (
          id, ip_address, user_email, success, 
          failure_reason, user_agent, attempted_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        attemptId,
        ipAddress,
        userEmail,
        success,
        failureReason || null,
        userAgent || null
      ]);
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  }

  /**
   * تسجيل حدث أمني
   */
  static async logSecurityEvent(
    eventType: string,
    userId: string | null,
    ipAddress: string | null,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    metadata?: any
  ): Promise<void> {
    try {
      const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await executeQuery(`
        INSERT INTO security_audit_log (
          id, event_type, user_id, ip_address, 
          description, metadata, severity, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        eventId,
        eventType,
        userId,
        ipAddress,
        description,
        metadata ? JSON.stringify(metadata) : null,
        severity
      ]);
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * التحقق من كون عنوان IP محلي
   */
  private static isLocalIP(ip: string): boolean {
    const localPatterns = [
      /^127\./,           // localhost
      /^192\.168\./,      // private network
      /^10\./,            // private network
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // private network
      /^::1$/,            // IPv6 localhost
      /^fe80:/,           // IPv6 link-local
    ];

    return localPatterns.some(pattern => pattern.test(ip));
  }

  /**
   * مسح التخزين المؤقت
   */
  static clearCache(): void {
    this.cache = {};
  }

  /**
   * جلب إحصائيات الأمان
   */
  static async getSecurityStats(): Promise<any> {
    try {
      const result = await executeQuery('SELECT * FROM security_stats');
      return result[0] || {};
    } catch (error) {
      console.error('Error fetching security stats:', error);
      return {};
    }
  }
}
