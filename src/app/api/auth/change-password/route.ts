import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel } from '@/lib/models/User';
import { SecuritySettingsModel } from '@/lib/models/SecuritySettings';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// التحقق من صحة التوكن واستخراج معرف المستخدم
async function verifyToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.userId;
  } catch {
    return null;
  }
}

// التحقق من قوة كلمة المرور
async function validatePassword(password: string): Promise<{ valid: boolean; message?: string }> {
  try {
    const settings = await SecuritySettingsModel.getCurrent();

    if (!settings) {
      return { valid: true };
    }

    if (password.length < settings.passwordMinLength) {
      return { valid: false, message: `كلمة المرور يجب أن تكون ${settings.passwordMinLength} أحرف على الأقل` };
    }

    if (settings.passwordRequireNumbers && !/\d/.test(password)) {
      return { valid: false, message: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' };
    }

    if (settings.passwordRequireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل' };
    }

    if (settings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل' };
    }

    if (settings.passwordRequireLowercase && !/[a-z]/.test(password)) {
      return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل' };
    }

    return { valid: true };
  } catch (error) {
    console.error('خطأ في التحقق من كلمة المرور:', error);
    return { valid: false, message: 'خطأ في التحقق من كلمة المرور' };
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { currentPassword, newPassword, confirmPassword } = await request.json();

    // التحقق من البيانات المطلوبة
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من تطابق كلمة المرور الجديدة
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور الجديدة غير متطابقة' },
        { status: 400 }
      );
    }

    // التحقق من قوة كلمة المرور الجديدة
    const passwordValidation = await validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.message },
        { status: 400 }
      );
    }

    // البحث عن المستخدم في قاعدة البيانات
    const user = await UserModel.getById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من كلمة المرور الحالية
    const isCurrentPasswordValid = await UserModel.verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور الحالية غير صحيحة' },
        { status: 400 }
      );
    }

    // تحديث كلمة المرور في قاعدة البيانات
    const updated = await UserModel.updatePassword(decoded.userId, newPassword);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'فشل في تحديث كلمة المرور' },
        { status: 500 }
      );
    }

    // تسجيل العملية في سجل المراجعة
    await fetch(`${request.nextUrl.origin}/api/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: user.name,
        userId: user.id,
        action: 'update',
        resource: 'password',
        resourceId: user.id,
        details: 'تغيير كلمة المرور',
        status: 'success'
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
