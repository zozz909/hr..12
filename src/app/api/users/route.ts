import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, CreateUserData, UpdateUserData } from '@/lib/models/User';
import { requirePermission, unauthorizedResponse, unauthenticatedResponse } from '@/lib/auth-utils';

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

// GET - جلب جميع المستخدمين
export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة والصلاحية
    const { user: currentUser, hasPermission } = await requirePermission(request, 'users_view');

    if (!currentUser) {
      return unauthenticatedResponse();
    }

    if (!hasPermission) {
      return unauthorizedResponse('ليس لديك صلاحية لعرض المستخدمين');
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    let users;

    if (search) {
      users = await UserModel.search(search, role || undefined, status || undefined);
    } else {
      users = await UserModel.getAll();

      // تطبيق فلاتر إضافية إذا لزم الأمر
      if (role) {
        users = users.filter(user => user.role === role);
      }
      if (status) {
        users = users.filter(user => user.status === status);
      }
    }

    // إزالة البيانات الحساسة من الاستجابة
    const safeUsers = users.map(({ password, email_verification_token, reset_password_token, two_factor_secret, ...user }) => user);

    return NextResponse.json({
      success: true,
      users: safeUsers
    });
  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب المستخدمين' },
      { status: 500 }
    );
  }
}

// POST - إنشاء مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة والصلاحية
    const { user: currentUser, hasPermission } = await requirePermission(request, 'users_add');

    if (!currentUser) {
      return unauthenticatedResponse();
    }

    if (!hasPermission) {
      return unauthorizedResponse('ليس لديك صلاحية لإنشاء المستخدمين');
    }

    const { name, email, password, role, permissions, phone } = await request.json();

    // التحقق من البيانات المطلوبة
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود البريد الإلكتروني مسبقاً
    const emailExists = await UserModel.emailExists(email);
    if (emailExists) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني موجود مسبقاً' },
        { status: 400 }
      );
    }

    // إنشاء المستخدم الجديد
    const userData: CreateUserData = {
      name,
      email,
      password,
      role,
      permissions,
      phone,
      created_by: currentUser.userId
    };

    const newUser = await UserModel.create(userData);

    // إرجاع المستخدم بدون البيانات الحساسة
    const { password: _, email_verification_token, reset_password_token, two_factor_secret, ...safeUser } = newUser;

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: 'تم إنشاء المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في إنشاء المستخدم' },
      { status: 500 }
    );
  }
}

// PUT - تحديث مستخدم
export async function PUT(request: NextRequest) {
  try {
    // التحقق من المصادقة والصلاحية
    const { user: currentUser, hasPermission } = await requirePermission(request, 'users_edit');

    if (!currentUser) {
      return unauthenticatedResponse();
    }

    if (!hasPermission) {
      return unauthorizedResponse('ليس لديك صلاحية لتعديل المستخدمين');
    }

    const { id, name, email, role, permissions, status, phone, avatar_url } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم
    const existingUser = await UserModel.getById(id);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من عدم وجود البريد الإلكتروني مع مستخدم آخر
    if (email && await UserModel.emailExists(email, id)) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني موجود مع مستخدم آخر' },
        { status: 400 }
      );
    }

    // تحديث بيانات المستخدم
    const updateData: UpdateUserData = {
      name,
      email,
      role,
      permissions,
      status,
      phone,
      avatar_url,
      updated_by: currentUser.userId
    };

    const updatedUser = await UserModel.update(id, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'فشل في تحديث المستخدم' },
        { status: 500 }
      );
    }

    // إرجاع المستخدم بدون البيانات الحساسة
    const { password, email_verification_token, reset_password_token, two_factor_secret, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: 'تم تحديث المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في تحديث المستخدم' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مستخدم
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من المصادقة والصلاحية
    const { user: currentUser, hasPermission } = await requirePermission(request, 'users_delete');

    if (!currentUser) {
      return unauthenticatedResponse();
    }

    if (!hasPermission) {
      return unauthorizedResponse('ليس لديك صلاحية لحذف المستخدمين');
    }

    // التحقق من وجود المستخدم المراد حذفه
    const targetUser = await UserModel.getById(id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // منع حذف نفس المستخدم
    if (id === currentUser.userId) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 403 }
      );
    }

    // منع حذف المدير الوحيد
    if (targetUser.role === 'admin') {
      const adminCount = await UserModel.countByRole('admin');
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'لا يمكن حذف المدير الوحيد في النظام' },
          { status: 403 }
        );
      }
    }

    // حذف المستخدم (مع التحقق من الحماية)
    try {
      const deleted = await UserModel.delete(id);

      if (!deleted) {
        return NextResponse.json(
          { success: false, error: 'فشل في حذف المستخدم' },
          { status: 500 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في حذف المستخدم' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في حذف المستخدم' },
      { status: 500 }
    );
  }
}

// دالة مساعدة للحصول على صلاحيات الدور
function getRolePermissions(role: string): string[] {
  switch (role) {
    case 'admin':
      return [
        'view_employees', 'edit_employees', 'delete_employees',
        'view_payroll', 'edit_payroll', 'view_reports', 'generate_reports',
        'manage_users', 'system_settings'
      ];
    case 'hr_manager':
      return [
        'view_employees', 'edit_employees', 'view_payroll', 
        'edit_payroll', 'view_reports', 'generate_reports'
      ];
    case 'employee':
      return ['view_employees', 'view_reports'];
    case 'viewer':
      return ['view_employees', 'view_reports'];
    default:
      return [];
  }
}
