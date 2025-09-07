import { NextRequest, NextResponse } from 'next/server';
import { PermissionValidator } from '@/lib/permissions/validator';
import { requirePermission, unauthorizedResponse, unauthenticatedResponse } from '@/lib/auth-utils';

// POST - التحقق من صحة مجموعة صلاحيات
export async function POST(request: NextRequest) {
  try {
    // التحقق من صلاحية إدارة الأدوار
    const { user, hasPermission } = await requirePermission(request, 'system.roles.manage');
    
    if (!user) {
      return unauthenticatedResponse();
    }
    
    if (!hasPermission) {
      return unauthorizedResponse('ليس لديك صلاحية لإدارة الأدوار');
    }

    const { permissions, userId, targetPermission } = await request.json();

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: 'قائمة الصلاحيات مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من صحة مجموعة الصلاحيات
    const validation = PermissionValidator.validatePermissionSet(permissions);
    
    // تحسين مجموعة الصلاحيات
    const optimizedPermissions = PermissionValidator.optimizePermissionSet(permissions);

    // إذا تم تمرير معرف مستخدم وصلاحية مستهدفة، تحقق من إمكانية الترقية
    let upgradeInfo = null;
    if (userId && targetPermission) {
      // في التطبيق الحقيقي، ستحصل على بيانات المستخدم من قاعدة البيانات
      const mockUser = { userId, role: 'employee', permissions };
      upgradeInfo = PermissionValidator.canUpgradeToPermission(mockUser, targetPermission);
    }

    return NextResponse.json({
      success: true,
      validation: {
        ...validation,
        originalCount: permissions.length,
        optimizedCount: optimizedPermissions.length,
        addedDependencies: optimizedPermissions.filter(p => !permissions.includes(p))
      },
      optimizedPermissions,
      upgradeInfo,
      recommendations: {
        basic: PermissionValidator.getPermissionsByLevel('basic').map(p => p.id),
        advanced: PermissionValidator.getPermissionsByLevel('advanced').map(p => p.id),
        admin: PermissionValidator.getPermissionsByLevel('admin').map(p => p.id)
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في التحقق من الصلاحيات' },
      { status: 500 }
    );
  }
}
