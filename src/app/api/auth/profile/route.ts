import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// محاكاة قاعدة البيانات
const users = [
  {
    id: '1',
    name: 'أحمد محمد',
    email: 'admin@company.com',
    role: 'admin',
    status: 'active',
    permissions: [
      'view_employees', 'edit_employees', 'delete_employees',
      'view_payroll', 'edit_payroll', 'calculate_payroll',
      'view_reports', 'generate_reports', 'export_reports',
      'manage_users', 'system_settings'
    ],
    lastLogin: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'فاطمة علي',
    email: 'hr@company.com',
    role: 'hr_manager',
    status: 'active',
    permissions: [
      'view_employees', 'edit_employees', 'view_payroll', 'edit_payroll',
      'calculate_payroll', 'view_reports', 'generate_reports'
    ],
    lastLogin: '2024-01-14T14:20:00Z'
  }
];

// GET - جلب معلومات الملف الشخصي
export async function GET(request: NextRequest) {
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
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في التحقق من الهوية' },
      { status: 401 }
    );
  }
}

// PUT - تحديث معلومات الملف الشخصي
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
    const { name, email } = await request.json();

    // التحقق من البيانات
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'الاسم والبريد الإلكتروني مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من تفرد البريد الإلكتروني
    const existingUser = users.find(u => u.email === email && u.id !== decoded.userId);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // تحديث بيانات المستخدم
    const userIndex = users.findIndex(u => u.id === decoded.userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    users[userIndex] = {
      ...users[userIndex],
      name,
      email
    };

    // تسجيل العملية في سجل المراجعة
    await fetch(`${request.nextUrl.origin}/api/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: name,
        userId: decoded.userId,
        action: 'update',
        resource: 'profile',
        resourceId: decoded.userId,
        details: 'تحديث الملف الشخصي',
        status: 'success'
      }),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: users[userIndex].id,
        name: users[userIndex].name,
        email: users[userIndex].email,
        role: users[userIndex].role,
        status: users[userIndex].status,
        permissions: users[userIndex].permissions,
        lastLogin: users[userIndex].lastLogin
      },
      message: 'تم تحديث الملف الشخصي بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
