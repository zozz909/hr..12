import { PERMISSIONS, Permission, PERMISSION_CATEGORIES } from './definitions';
import { AuthUser } from '../auth-utils';

/**
 * فئة إدارة الصلاحيات المحسنة
 */
export class PermissionValidator {
  
  /**
   * التحقق من صحة صلاحية معينة
   */
  static isValidPermission(permissionId: string): boolean {
    return PERMISSIONS.some(p => p.id === permissionId);
  }

  /**
   * الحصول على تفاصيل صلاحية
   */
  static getPermission(permissionId: string): Permission | null {
    return PERMISSIONS.find(p => p.id === permissionId) || null;
  }

  /**
   * التحقق من وجود صلاحية للمستخدم مع التحقق من التبعيات
   */
  static hasPermission(user: AuthUser, permissionId: string): boolean {
    // المدير لديه جميع الصلاحيات
    if (user.role === 'admin') {
      return true;
    }

    // التحقق من وجود الصلاحية
    if (!user.permissions.includes(permissionId)) {
      return false;
    }

    // التحقق من التبعيات
    const permission = this.getPermission(permissionId);
    if (permission?.dependencies) {
      return permission.dependencies.every(dep => user.permissions.includes(dep));
    }

    return true;
  }

  /**
   * التحقق من وجود أي من الصلاحيات المطلوبة
   */
  static hasAnyPermission(user: AuthUser, permissionIds: string[]): boolean {
    if (user.role === 'admin') {
      return true;
    }

    return permissionIds.some(permissionId => this.hasPermission(user, permissionId));
  }

  /**
   * التحقق من وجود جميع الصلاحيات المطلوبة
   */
  static hasAllPermissions(user: AuthUser, permissionIds: string[]): boolean {
    if (user.role === 'admin') {
      return true;
    }

    return permissionIds.every(permissionId => this.hasPermission(user, permissionId));
  }

  /**
   * التحقق من صحة مجموعة صلاحيات (للتأكد من عدم وجود تعارضات)
   */
  static validatePermissionSet(permissionIds: string[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // التحقق من صحة جميع الصلاحيات
    const invalidPermissions = permissionIds.filter(id => !this.isValidPermission(id));
    if (invalidPermissions.length > 0) {
      errors.push(`صلاحيات غير صحيحة: ${invalidPermissions.join(', ')}`);
    }

    // التحقق من التبعيات
    for (const permissionId of permissionIds) {
      const permission = this.getPermission(permissionId);
      if (permission?.dependencies) {
        const missingDeps = permission.dependencies.filter(dep => !permissionIds.includes(dep));
        if (missingDeps.length > 0) {
          errors.push(`الصلاحية "${permission.label}" تتطلب: ${missingDeps.join(', ')}`);
        }
      }
    }

    // التحقق من التعارضات
    for (const permissionId of permissionIds) {
      const permission = this.getPermission(permissionId);
      if (permission?.conflicts) {
        const conflicts = permission.conflicts.filter(conflict => permissionIds.includes(conflict));
        if (conflicts.length > 0) {
          errors.push(`الصلاحية "${permission.label}" تتعارض مع: ${conflicts.join(', ')}`);
        }
      }
    }

    // تحذيرات للصلاحيات الحساسة
    const criticalPermissions = permissionIds
      .map(id => this.getPermission(id))
      .filter(p => p?.isSystemCritical)
      .map(p => p!.label);
    
    if (criticalPermissions.length > 0) {
      warnings.push(`صلاحيات حساسة: ${criticalPermissions.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * الحصول على الصلاحيات حسب الفئة
   */
  static getPermissionsByCategory(categoryId: string): Permission[] {
    return PERMISSIONS.filter(p => p.category === categoryId);
  }

  /**
   * الحصول على الصلاحيات حسب المستوى
   */
  static getPermissionsByLevel(level: 'basic' | 'advanced' | 'admin'): Permission[] {
    return PERMISSIONS.filter(p => p.level === level);
  }

  /**
   * اقتراح صلاحيات للدور
   */
  static suggestPermissionsForRole(role: string): string[] {
    const suggestions: Record<string, string[]> = {
      'admin': PERMISSIONS.map(p => p.id),
      'hr_manager': [
        'employees.view', 'employees.view_details', 'employees.create', 'employees.edit', 'employees.export',
        'institutions.view', 'institutions.create', 'institutions.edit',
        'payroll.view', 'payroll.calculate', 'payroll.edit',
        'leaves.view', 'leaves.approve', 'leaves.cancel',
        'advances.view', 'advances.approve', 'advances.disburse',
        'compensations.view', 'compensations.create', 'compensations.edit',
        'documents.view', 'documents.upload', 'documents.edit',
        'reports.view', 'reports.generate', 'reports.export'
      ],
      'supervisor': [
        'employees.view', 'employees.view_details', 'employees.edit',
        'leaves.view', 'leaves.approve',
        'advances.view', 'advances.approve',
        'compensations.view', 'compensations.create',
        'reports.view', 'reports.generate'
      ],
      'employee': [
        'employees.view',
        'leaves.view', 'leaves.create', 'leaves.edit',
        'advances.view', 'advances.create',
        'documents.view', 'documents.upload',
        'reports.view'
      ],
      'viewer': [
        'employees.view',
        'reports.view'
      ]
    };

    return suggestions[role] || [];
  }

  /**
   * تنظيف وتحسين مجموعة صلاحيات
   */
  static optimizePermissionSet(permissionIds: string[]): string[] {
    const optimized = new Set<string>();

    for (const permissionId of permissionIds) {
      const permission = this.getPermission(permissionId);
      if (permission) {
        // إضافة التبعيات تلقائياً
        if (permission.dependencies) {
          permission.dependencies.forEach(dep => optimized.add(dep));
        }
        optimized.add(permissionId);
      }
    }

    return Array.from(optimized).sort();
  }

  /**
   * الحصول على الصلاحيات المفقودة للوصول لصلاحية معينة
   */
  static getMissingDependencies(userPermissions: string[], targetPermission: string): string[] {
    const permission = this.getPermission(targetPermission);
    if (!permission?.dependencies) {
      return [];
    }

    return permission.dependencies.filter(dep => !userPermissions.includes(dep));
  }

  /**
   * التحقق من إمكانية ترقية المستخدم لصلاحية معينة
   */
  static canUpgradeToPermission(user: AuthUser, targetPermission: string): {
    canUpgrade: boolean;
    missingDependencies: string[];
    reason?: string;
  } {
    const permission = this.getPermission(targetPermission);
    
    if (!permission) {
      return {
        canUpgrade: false,
        missingDependencies: [],
        reason: 'صلاحية غير موجودة'
      };
    }

    if (user.permissions.includes(targetPermission)) {
      return {
        canUpgrade: false,
        missingDependencies: [],
        reason: 'المستخدم يملك هذه الصلاحية بالفعل'
      };
    }

    const missingDeps = this.getMissingDependencies(user.permissions, targetPermission);
    
    return {
      canUpgrade: missingDeps.length === 0,
      missingDependencies: missingDeps,
      reason: missingDeps.length > 0 ? 'تبعيات مفقودة' : undefined
    };
  }
}
