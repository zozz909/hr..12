import { NextRequest, NextResponse } from 'next/server';
import { AVAILABLE_PERMISSIONS, PERMISSION_CATEGORIES, SimplePermissionChecker } from '@/lib/permissions/simple-system';
import { requirePermission, unauthorizedResponse, unauthenticatedResponse } from '@/lib/auth-utils';

// GET - جلب جميع الصلاحيات (مبسط)
export async function GET(request: NextRequest) {
  try {
    // التحقق من صلاحية عرض المستخدمين (للوصول لإدارة الصلاحيات)
    const { user, hasPermission } = await requirePermission(request, 'users_view');

    if (!user) {
      return unauthenticatedResponse();
    }

    if (!hasPermission) {
      return unauthorizedResponse('ليس لديك صلاحية لعرض الصلاحيات');
    }

    // تنظيم الصلاحيات حسب الفئات
    const categorizedPermissions: Record<string, any[]> = {};

    Object.keys(PERMISSION_CATEGORIES).forEach(categoryId => {
      categorizedPermissions[categoryId] = SimplePermissionChecker.getPermissionsByCategory(categoryId);
    });

    // إحصائيات مبسطة
    const highRiskPermissions = SimplePermissionChecker.getHighRiskPermissions();
    const lowRiskPermissions = AVAILABLE_PERMISSIONS.filter(p => !p.isHigh);

    return NextResponse.json({
      success: true,
      permissions: AVAILABLE_PERMISSIONS,
      categories: PERMISSION_CATEGORIES,
      categorizedPermissions,
      stats: {
        totalPermissions: AVAILABLE_PERMISSIONS.length,
        highRiskPermissions: highRiskPermissions.length,
        lowRiskPermissions: lowRiskPermissions.length,
        categoriesCount: Object.keys(PERMISSION_CATEGORIES).length
      },
      userRole: user.role,
      userPermissions: user.permissions
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب الصلاحيات' },
      { status: 500 }
    );
  }
}

// POST - التحقق من صحة مجموعة صلاحيات (مبسط)
export async function POST(request: NextRequest) {
  try {
    // التحقق من صلاحية إدارة المستخدمين
    const { user, hasPermission } = await requirePermission(request, 'users_edit');

    if (!user) {
      return unauthenticatedResponse();
    }

    if (!hasPermission) {
      return unauthorizedResponse('ليس لديك صلاحية لإدارة الصلاحيات');
    }

    const { permissions, targetRole } = await request.json();

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: 'قائمة الصلاحيات مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من صحة الصلاحيات
    const validation = SimplePermissionChecker.validatePermissions(permissions);

    // فلترة الصلاحيات المسموحة للدور
    let allowedPermissions = permissions;
    if (targetRole) {
      allowedPermissions = SimplePermissionChecker.filterAllowedPermissions(
        targetRole as 'admin' | 'employee',
        permissions
      );
    }

    return NextResponse.json({
      success: true,
      validation: {
        validPermissions: validation.valid,
        invalidPermissions: validation.invalid,
        highRiskPermissions: validation.highRisk,
        isValid: validation.invalid.length === 0
      },
      allowedPermissions,
      filteredOut: permissions.filter(p => !allowedPermissions.includes(p)),
      defaultPermissions: targetRole ?
        SimplePermissionChecker.getDefaultPermissions(targetRole as 'admin' | 'employee') :
        []
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في معالجة الطلب' },
      { status: 500 }
    );
  }
}
