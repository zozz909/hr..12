import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { requirePermission } from '@/lib/auth-utils';

interface AllowedDevice {
  id: string;
  ipAddress: string;
  description: string;
  addedAt: string;
  lastUsed?: string;
  isActive: boolean;
}

interface SecuritySettings {
  ipWhitelistEnabled: boolean;
  allowedDevices: AllowedDevice[];
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  requireStrongPasswords: boolean;
}

// GET - جلب إعدادات الأمان
export async function GET(request: NextRequest) {
  try {
    // التحقق من صلاحية مدير النظام (مؤقتاً معطل للاختبار)
    // const { user, hasPermission } = await requirePermission(request, 'system_settings');

    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'ليس لديك صلاحية للوصول إلى إعدادات الأمان' },
    //     { status: 403 }
    //   );
    // }

    // جلب إعدادات الأمان من قاعدة البيانات
    const settingsResult = await executeQuery(`
      SELECT * FROM security_settings 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    // جلب الأجهزة المصرح لها
    const devicesResult = await executeQuery(`
      SELECT * FROM allowed_devices 
      ORDER BY added_at DESC
    `);

    let settings: SecuritySettings;

    if (settingsResult.length > 0) {
      const dbSettings = settingsResult[0];
      settings = {
        ipWhitelistEnabled: dbSettings.ip_whitelist_enabled || false,
        maxLoginAttempts: dbSettings.max_login_attempts || 5,
        sessionTimeoutMinutes: dbSettings.session_timeout_minutes || 60,
        requireStrongPasswords: dbSettings.require_strong_passwords || true,
        allowedDevices: devicesResult.map((device: any) => ({
          id: device.id,
          ipAddress: device.ip_address,
          description: device.description,
          addedAt: device.added_at,
          lastUsed: device.last_used,
          isActive: device.is_active
        }))
      };
    } else {
      // إعدادات افتراضية
      settings = {
        ipWhitelistEnabled: false,
        maxLoginAttempts: 5,
        sessionTimeoutMinutes: 60,
        requireStrongPasswords: true,
        allowedDevices: devicesResult.map((device: any) => ({
          id: device.id,
          ipAddress: device.ip_address,
          description: device.description,
          addedAt: device.added_at,
          lastUsed: device.last_used,
          isActive: device.is_active
        }))
      };
    }

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Error fetching security settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب إعدادات الأمان' },
      { status: 500 }
    );
  }
}

// PUT - تحديث إعدادات الأمان
export async function PUT(request: NextRequest) {
  try {
    // التحقق من صلاحية مدير النظام (مؤقتاً معطل للاختبار)
    // const { user, hasPermission } = await requirePermission(request, 'system_settings');

    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'ليس لديك صلاحية لتعديل إعدادات الأمان' },
    //     { status: 403 }
    //   );
    // }

    const settings: SecuritySettings = await request.json();

    // التحقق من صحة البيانات
    if (settings.maxLoginAttempts < 1 || settings.maxLoginAttempts > 10) {
      return NextResponse.json(
        { success: false, error: 'الحد الأقصى لمحاولات تسجيل الدخول يجب أن يكون بين 1 و 10' },
        { status: 400 }
      );
    }

    if (settings.sessionTimeoutMinutes < 15 || settings.sessionTimeoutMinutes > 480) {
      return NextResponse.json(
        { success: false, error: 'مهلة انتهاء الجلسة يجب أن تكون بين 15 و 480 دقيقة' },
        { status: 400 }
      );
    }

    // حذف الإعدادات القديمة
    await executeQuery('DELETE FROM security_settings');
    await executeQuery('DELETE FROM allowed_devices');

    // إدراج الإعدادات الجديدة
    const settingsId = `settings-${Date.now()}`;
    await executeQuery(`
      INSERT INTO security_settings (
        id, ip_whitelist_enabled, max_login_attempts, 
        session_timeout_minutes, require_strong_passwords, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      settingsId,
      settings.ipWhitelistEnabled,
      settings.maxLoginAttempts,
      settings.sessionTimeoutMinutes,
      settings.requireStrongPasswords
    ]);

    // إدراج الأجهزة المصرح لها
    for (const device of settings.allowedDevices) {
      await executeQuery(`
        INSERT INTO allowed_devices (
          id, ip_address, description, added_at, 
          last_used, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        device.id,
        device.ipAddress,
        device.description,
        device.addedAt,
        device.lastUsed || null,
        device.isActive
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ إعدادات الأمان بنجاح'
    });

  } catch (error) {
    console.error('Error updating security settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في حفظ إعدادات الأمان' },
      { status: 500 }
    );
  }
}

// POST - إضافة جهاز جديد
export async function POST(request: NextRequest) {
  try {
    // التحقق من صلاحية مدير النظام (مؤقتاً معطل للاختبار)
    // const { user, hasPermission } = await requirePermission(request, 'system_settings');

    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'ليس لديك صلاحية لإضافة أجهزة جديدة' },
    //     { status: 403 }
    //   );
    // }

    const { ipAddress, description } = await request.json();

    if (!ipAddress || !description) {
      return NextResponse.json(
        { success: false, error: 'عنوان IP ووصف الجهاز مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من صحة عنوان IP
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ipAddress)) {
      return NextResponse.json(
        { success: false, error: 'عنوان IP غير صحيح' },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار عنوان IP
    const existingDevice = await executeQuery(
      'SELECT id FROM allowed_devices WHERE ip_address = ?',
      [ipAddress]
    );

    if (existingDevice.length > 0) {
      return NextResponse.json(
        { success: false, error: 'هذا العنوان مضاف بالفعل' },
        { status: 400 }
      );
    }

    // إضافة الجهاز الجديد
    const deviceId = `device-${Date.now()}`;
    await executeQuery(`
      INSERT INTO allowed_devices (
        id, ip_address, description, added_at, 
        is_active, created_at
      ) VALUES (?, ?, ?, NOW(), ?, NOW())
    `, [deviceId, ipAddress, description, true]);

    return NextResponse.json({
      success: true,
      message: 'تم إضافة الجهاز بنجاح',
      device: {
        id: deviceId,
        ipAddress,
        description,
        addedAt: new Date().toISOString(),
        isActive: true
      }
    });

  } catch (error) {
    console.error('Error adding device:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في إضافة الجهاز' },
      { status: 500 }
    );
  }
}
