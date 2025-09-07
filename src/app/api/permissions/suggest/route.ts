import { NextRequest, NextResponse } from 'next/server';
import { PermissionValidator } from '@/lib/permissions/validator';
import { RoleManager } from '@/lib/permissions/roles';
import { requirePermission, unauthorizedResponse, unauthenticatedResponse } from '@/lib/auth-utils';

// POST - اقتراح صلاحيات للدور
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

    const { role, currentPermissions = [], level } = await request.json();

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'الدور مطلوب' },
        { status: 400 }
      );
    }

    // اقتراح صلاحيات للدور
    const suggestions = PermissionValidator.suggestPermissionsForRole(role);
    
    // اقتراحات إضافية حسب المستوى
    let levelSuggestions: string[] = [];
    if (level) {
      levelSuggestions = PermissionValidator.getPermissionsByLevel(level).map(p => p.id);
    }

    // تحليل الصلاحيات الحالية
    let currentAnalysis = null;
    if (currentPermissions.length > 0) {
      const validation = PermissionValidator.validatePermissionSet(currentPermissions);
      const optimized = PermissionValidator.optimizePermissionSet(currentPermissions);
      
      currentAnalysis = {
        validation,
        optimized,
        missingDependencies: optimized.filter(p => !currentPermissions.includes(p)),
        redundantPermissions: currentPermissions.filter(p => !optimized.includes(p))
      };
    }

    // اقتراحات ذكية
    const smartSuggestions = {
      recommended: suggestions.filter(s => !currentPermissions.includes(s)),
      upgrade: suggestions.filter(s => {
        const permission = PermissionValidator.getPermission(s);
        return permission && permission.level === 'advanced' && !currentPermissions.includes(s);
      }),
      critical: suggestions.filter(s => {
        const permission = PermissionValidator.getPermission(s);
        return permission && permission.isSystemCritical && !currentPermissions.includes(s);
      })
    };

    return NextResponse.json({
      success: true,
      suggestions: {
        forRole: suggestions,
        byLevel: levelSuggestions,
        smart: smartSuggestions,
        all: [...new Set([...suggestions, ...levelSuggestions])]
      },
      currentAnalysis,
      roleInfo: RoleManager.getRole(role)
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في اقتراح الصلاحيات' },
      { status: 500 }
    );
  }
}
