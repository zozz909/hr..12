import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export async function GET(request: NextRequest) {
  try {
    // الحصول على التوكن من الهيدر أو الكوكيز
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'لا يوجد توكن مصادقة' },
        { status: 401 }
      );
    }

    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // إرجاع بيانات المستخدم
    return NextResponse.json({
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions
      },
      message: 'التوكن صالح'
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { success: false, error: 'توكن غير صالح' },
        { status: 401 }
      );
    }

    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية التوكن' },
        { status: 401 }
      );
    }

    console.error('خطأ في التحقق من التوكن:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
