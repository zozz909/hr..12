import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '@/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    // التحقق من البيانات المطلوبة
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // البحث عن المستخدم في قاعدة البيانات
    const user = await UserModel.getByEmail(email.toLowerCase());

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني غير مسجل' },
        { status: 401 }
      );
    }

    // التحقق من حالة الحساب
    if (user.status === 'inactive') {
      return NextResponse.json(
        { success: false, error: 'الحساب غير مفعل. تواصل مع مدير النظام' },
        { status: 401 }
      );
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { success: false, error: 'الحساب محظور. تواصل مع مدير النظام' },
        { status: 401 }
      );
    }

    // التحقق من حظر الحساب
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.locked_until).getTime() - new Date().getTime()) / 1000);
      return NextResponse.json(
        { success: false, error: `الحساب محظور لمدة ${Math.ceil(remainingTime / 60)} دقيقة` },
        { status: 423 }
      );
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await UserModel.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      // زيادة عدد المحاولات الفاشلة
      const attempts = (user.login_attempts || 0) + 1;
      const maxAttempts = 5; // حد ثابت للمحاولات

      if (attempts >= maxAttempts) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 دقيقة
        await UserModel.updateLoginAttempts(email, attempts, lockUntil);

        return NextResponse.json(
          { success: false, error: 'تم حظر الحساب بسبب المحاولات المتكررة' },
          { status: 423 }
        );
      }

      await UserModel.updateLoginAttempts(email, attempts);

      return NextResponse.json(
        { success: false, error: `كلمة المرور غير صحيحة. المحاولات المتبقية: ${maxAttempts - attempts}` },
        { status: 401 }
      );
    }

    // تحديث آخر تسجيل دخول وإعادة تعيين المحاولات الفاشلة
    await UserModel.updateLastLogin(user.id);

    // إنشاء JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '24h' }
    );

    // إرجاع بيانات المستخدم بدون كلمة المرور والبيانات الحساسة
    const { password: _, login_attempts, locked_until, email_verification_token, reset_password_token, two_factor_secret, ...safeUser } = user;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      token,
      message: 'تم تسجيل الدخول بنجاح'
    });

    // تعيين cookie للتوكن
    const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 يوم أو 24 ساعة

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge
    });

    return response;

  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
