import { executeQuery } from '../db';

export interface SecuritySettings {
  id: string;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  passwordExpiryDays: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
  twoFactorRequired: boolean;
  allowPasswordReuse: boolean;
  passwordHistoryCount: number;
  ipWhitelistEnabled: boolean;
  allowedIpAddresses: string[];
  auditLogRetentionDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSecuritySettingsData {
  passwordMinLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireLowercase?: boolean;
  passwordRequireNumbers?: boolean;
  passwordRequireSymbols?: boolean;
  passwordExpiryDays?: number;
  maxLoginAttempts?: number;
  lockoutDurationMinutes?: number;
  sessionTimeoutMinutes?: number;
  twoFactorRequired?: boolean;
  allowPasswordReuse?: boolean;
  passwordHistoryCount?: number;
  ipWhitelistEnabled?: boolean;
  allowedIpAddresses?: string[];
  auditLogRetentionDays?: number;
}

export class SecuritySettingsModel {
  // الحصول على إعدادات الأمان الحالية
  static async getCurrent(): Promise<SecuritySettings | null> {
    try {
      const results = await executeQuery(`
        SELECT * FROM security_settings 
        ORDER BY created_at DESC 
        LIMIT 1
      `);

      if (!results || results.length === 0) {
        // إرجاع الإعدادات الافتراضية إذا لم توجد
        return this.getDefaultSettings();
      }

      const settings = results[0];
      return {
        id: settings.id,
        passwordMinLength: settings.password_min_length,
        passwordRequireUppercase: settings.password_require_uppercase,
        passwordRequireLowercase: settings.password_require_lowercase,
        passwordRequireNumbers: settings.password_require_numbers,
        passwordRequireSymbols: settings.password_require_symbols,
        passwordExpiryDays: settings.password_expiry_days,
        maxLoginAttempts: settings.max_login_attempts,
        lockoutDurationMinutes: settings.lockout_duration_minutes,
        sessionTimeoutMinutes: settings.session_timeout_minutes,
        twoFactorRequired: settings.two_factor_required,
        allowPasswordReuse: settings.allow_password_reuse,
        passwordHistoryCount: settings.password_history_count,
        ipWhitelistEnabled: settings.ip_whitelist_enabled,
        allowedIpAddresses: settings.allowed_ip_addresses ? JSON.parse(settings.allowed_ip_addresses) : [],
        auditLogRetentionDays: settings.audit_log_retention_days,
        createdAt: settings.created_at,
        updatedAt: settings.updated_at
      };
    } catch (error) {
      console.error('Error fetching security settings:', error);
      return this.getDefaultSettings();
    }
  }

  // الحصول على الإعدادات الافتراضية
  static getDefaultSettings(): SecuritySettings {
    return {
      id: 'default',
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: false,
      passwordExpiryDays: 90,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      sessionTimeoutMinutes: 60,
      twoFactorRequired: false,
      allowPasswordReuse: false,
      passwordHistoryCount: 5,
      ipWhitelistEnabled: false,
      allowedIpAddresses: [],
      auditLogRetentionDays: 365,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // تحديث إعدادات الأمان
  static async update(data: CreateSecuritySettingsData): Promise<SecuritySettings> {
    try {
      const id = `security-${Date.now()}`;
      
      await executeQuery(`
        INSERT INTO security_settings (
          id, password_min_length, password_require_uppercase, password_require_lowercase,
          password_require_numbers, password_require_symbols, password_expiry_days,
          max_login_attempts, lockout_duration_minutes, session_timeout_minutes,
          two_factor_required, allow_password_reuse, password_history_count,
          ip_whitelist_enabled, allowed_ip_addresses, audit_log_retention_days,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        id,
        data.passwordMinLength || 8,
        data.passwordRequireUppercase || false,
        data.passwordRequireLowercase || false,
        data.passwordRequireNumbers || false,
        data.passwordRequireSymbols || false,
        data.passwordExpiryDays || 90,
        data.maxLoginAttempts || 5,
        data.lockoutDurationMinutes || 15,
        data.sessionTimeoutMinutes || 60,
        data.twoFactorRequired || false,
        data.allowPasswordReuse || false,
        data.passwordHistoryCount || 5,
        data.ipWhitelistEnabled || false,
        JSON.stringify(data.allowedIpAddresses || []),
        data.auditLogRetentionDays || 365
      ]);

      return await this.getCurrent() || this.getDefaultSettings();
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw new Error('فشل في تحديث إعدادات الأمان');
    }
  }

  // التحقق من قوة كلمة المرور
  static validatePassword(password: string, settings?: SecuritySettings): { isValid: boolean; errors: string[] } {
    const currentSettings = settings || this.getDefaultSettings();
    const errors: string[] = [];

    if (password.length < currentSettings.passwordMinLength) {
      errors.push(`كلمة المرور يجب أن تكون ${currentSettings.passwordMinLength} أحرف على الأقل`);
    }

    if (currentSettings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
    }

    if (currentSettings.passwordRequireLowercase && !/[a-z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
    }

    if (currentSettings.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
    }

    if (currentSettings.passwordRequireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
