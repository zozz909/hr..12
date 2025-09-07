import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export async function POST(request: NextRequest) {
  try {
    // الحصول على التوكن من الكوكيز أو الهيدر
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (token) {
      try {
        // فك تشفير التوكن للحصول على بيانات المستخدم
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        // تسجيل عملية تسجيل الخروج في سجل المراجعة
        await fetch(`${request.nextUrl.origin}/api/audit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: decoded.email || 'مستخدم غير معروف',
            userId: decoded.userId || 'unknown',
            action: 'logout',
            resource: 'system',
            details: 'تسجيل خروج ناجح',
            status: 'success'
          }),
        });
      } catch (error) {
        // التوكن غير صالح، لكن سنكمل عملية تسجيل الخروج
        console.log('توكن غير صالح أثناء تسجيل الخروج');
      }
    }

    // إنشاء استجابة تسجيل الخروج
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });

    // حذف كوكي التوكن
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // حذف فوري
    });

    return response;

  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    
    // حتى في حالة الخطأ، نقوم بحذف الكوكي
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج'
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;
  }
}
