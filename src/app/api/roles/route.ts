import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_ROLES, RoleManager, Role } from '@/lib/permissions/roles';
import { requirePermission, unauthorizedResponse, unauthenticatedResponse } from '@/lib/auth-utils';

// GET - جلب جميع الأدوار
export async function GET(request: NextRequest) {
  try {
    // التحقق من صلاحية عرض الأدوار
    const { user, hasPermission } = await requirePermission(request, 'system.users.view');

    if (!user) {
      return unauthenticatedResponse();
    }

    if (!hasPermission) {
      return unauthorizedResponse('ليس لديك صلاحية لعرض الأدوار');
    }

    const roles = RoleManager.getAllRoles();
    const stats = RoleManager.getRoleStats();

    return NextResponse.json({
      success: true,
      roles,
      stats
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب الأدوار' },
      { status: 500 }
    );
  }
}

// POST - إنشاء دور جديد
export async function POST(request: NextRequest) {
  try {
    // التحقق من صلاحية إدارة الأدوار
    const { user, hasPermission } = await requirePermission(request, 'system.roles.manage');

    if (!user) {
      return unauthenticatedResponse();
    }

    if (!hasPermission) {
      return unauthorizedResponse('ليس لديك صلاحية لإنشاء الأدوار');
    }

    const { name, description, permissions, level = 'basic' } = await request.json();

    if (!name || !description || !permissions) {
      return NextResponse.json(
        { success: false, error: 'جميع البيانات مطلوبة (الاسم، الوصف، الصلاحيات)' },
        { status: 400 }
      );
    }

    // التحقق من صحة البيانات
    const validation = RoleManager.validateRole({
      name,
      description,
      permissions,
      level,
      isSystem: false,
      isActive: true
    });

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'بيانات الدور غير صحيحة',
        details: validation.errors
      }, { status: 400 });
    }

    // إنشاء الدور الجديد
    const newRole = RoleManager.createRole({
      name,
      description,
      permissions,
      level,
      isSystem: false,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      role: newRole,
      validation,
      message: 'تم إنشاء الدور بنجاح'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في إنشاء الدور' },
      { status: 500 }
    );
  }
}

// PUT - تحديث دور
export async function PUT(request: NextRequest) {
  try {
    // التحقق من صلاحية إدارة الأدوار
    const { user, hasPermission } = await requirePermission(request, 'system.roles.manage');

    if (!user) {
      return unauthenticatedResponse();
    }

    if (!hasPermission) {
      return unauthorizedResponse('ليس لديك صلاحية لتعديل الأدوار');
    }

    const { id, name, description, permissions, level, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الدور مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من صحة البيانات الجديدة
    const validation = RoleManager.validateRole({
      name,
      description,
      permissions,
      level,
      isActive
    });

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'بيانات الدور غير صحيحة',
        details: validation.errors
      }, { status: 400 });
    }

    // تحديث الدور
    const updatedRole = RoleManager.updateRole(id, {
      name,
      description,
      permissions,
      level,
      isActive
    });

    if (!updatedRole) {
      return NextResponse.json(
        { success: false, error: 'الدور غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      role: updatedRole,
      validation,
      message: 'تم تحديث الدور بنجاح'
    });

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'خطأ في تحديث الدور' },
      { status: 500 }
    );
  }
}

// DELETE - حذف دور
export async function DELETE(request: NextRequest) {
  try {
    // التحقق من صلاحية إدارة الأدوار
    const { user, hasPermission } = await requirePermission(request, 'system.roles.manage');

    if (!user) {
      return unauthenticatedResponse();
    }

    if (!hasPermission) {
      return unauthorizedResponse('ليس لديك صلاحية لحذف الأدوار');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الدور مطلوب' },
        { status: 400 }
      );
    }

    // حذف الدور
    const deleted = RoleManager.deleteRole(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'الدور غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف الدور بنجاح'
    });

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'خطأ في حذف الدور' },
      { status: 500 }
    );
  }
}
