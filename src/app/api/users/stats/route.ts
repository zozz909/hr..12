import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserModel } from '@/lib/models/User';

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

// GET - جلب إحصائيات المستخدمين
export async function GET(request: NextRequest) {
  try {
    // التحقق من صحة التوكن
    const userId = await verifyToken(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    // جلب إحصائيات المستخدمين
    const stats = await UserModel.getStats();

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات المستخدمين:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب إحصائيات المستخدمين' },
      { status: 500 }
    );
  }
}
