/**
 * نظام صلاحيات مبسط وآمن
 * دورين فقط: مدير النظام أو موظف
 * تحكم كامل في الصلاحيات الفردية
 */

export interface SimplePermission {
  id: string;
  name: string;
  description: string;
  category: string;
  isHigh: boolean; // صلاحية عالية الخطورة
}

export interface SimpleUser {
  userId: string;
  role: 'admin' | 'employee';
  permissions: string[];
}

// الصلاحيات المتاحة في النظام
export const AVAILABLE_PERMISSIONS: SimplePermission[] = [
  // === الموظفين ===
  { id: 'employees_view', name: 'عرض الموظفين', description: 'عرض قائمة الموظفين', category: 'employees', isHigh: false },
  { id: 'employees_add', name: 'إضافة موظفين', description: 'إضافة موظفين جدد', category: 'employees', isHigh: true },
  { id: 'employees_edit', name: 'تعديل الموظفين', description: 'تعديل بيانات الموظفين', category: 'employees', isHigh: true },
  { id: 'employees_delete', name: 'حذف الموظفين', description: 'حذف الموظفين من النظام', category: 'employees', isHigh: true },
  { id: 'employees_export', name: 'تصدير الموظفين', description: 'تصدير بيانات الموظفين', category: 'employees', isHigh: false },

  // === المؤسسات ===
  { id: 'institutions_view', name: 'عرض المؤسسات', description: 'عرض قائمة المؤسسات', category: 'institutions', isHigh: false },
  { id: 'institutions_add', name: 'إضافة مؤسسات', description: 'إضافة مؤسسات جديدة', category: 'institutions', isHigh: true },
  { id: 'institutions_edit', name: 'تعديل المؤسسات', description: 'تعديل بيانات المؤسسات', category: 'institutions', isHigh: true },
  { id: 'institutions_delete', name: 'حذف المؤسسات', description: 'حذف المؤسسات', category: 'institutions', isHigh: true },

  // === الفروع ===
  { id: 'branches_view', name: 'عرض الفروع', description: 'عرض قائمة الفروع', category: 'branches', isHigh: false },
  { id: 'branches_add', name: 'إضافة فروع', description: 'إضافة فروع جديدة', category: 'branches', isHigh: true },
  { id: 'branches_edit', name: 'تعديل الفروع', description: 'تعديل بيانات الفروع', category: 'branches', isHigh: true },
  { id: 'branches_delete', name: 'حذف الفروع', description: 'حذف الفروع', category: 'branches', isHigh: true },

  // === الرواتب ===
  { id: 'payroll_view', name: 'عرض الرواتب', description: 'عرض معلومات الرواتب', category: 'payroll', isHigh: false },
  { id: 'payroll_calculate', name: 'حساب الرواتب', description: 'حساب الرواتب الشهرية', category: 'payroll', isHigh: true },
  { id: 'payroll_edit', name: 'تعديل الرواتب', description: 'تعديل مبالغ الرواتب', category: 'payroll', isHigh: true },
  { id: 'payroll_approve', name: 'اعتماد الرواتب', description: 'اعتماد صرف الرواتب', category: 'payroll', isHigh: true },

  // === الإجازات ===
  { id: 'leaves_view', name: 'عرض الإجازات', description: 'عرض طلبات الإجازات', category: 'leaves', isHigh: false },
  { id: 'leaves_request', name: 'طلب إجازة', description: 'تقديم طلبات إجازة', category: 'leaves', isHigh: false },
  { id: 'leaves_approve', name: 'الموافقة على الإجازات', description: 'الموافقة أو رفض الإجازات', category: 'leaves', isHigh: true },
  { id: 'leaves_cancel', name: 'إلغاء الإجازات', description: 'إلغاء الإجازات المعتمدة', category: 'leaves', isHigh: true },

  // === السلف ===
  { id: 'advances_view', name: 'عرض السلف', description: 'عرض طلبات السلف', category: 'advances', isHigh: false },
  { id: 'advances_request', name: 'طلب سلفة', description: 'تقديم طلبات سلف', category: 'advances', isHigh: false },
  { id: 'advances_approve', name: 'الموافقة على السلف', description: 'الموافقة أو رفض السلف', category: 'advances', isHigh: true },
  { id: 'advances_disburse', name: 'صرف السلف', description: 'تأكيد صرف السلف', category: 'advances', isHigh: true },

  // === المكافآت والخصومات ===
  { id: 'compensations_view', name: 'عرض المكافآت', description: 'عرض المكافآت والخصومات', category: 'compensations', isHigh: false },
  { id: 'compensations_add', name: 'إضافة مكافآت', description: 'إضافة مكافآت أو خصومات', category: 'compensations', isHigh: true },
  { id: 'compensations_edit', name: 'تعديل المكافآت', description: 'تعديل المكافآت والخصومات', category: 'compensations', isHigh: true },
  { id: 'compensations_delete', name: 'حذف المكافآت', description: 'حذف المكافآت والخصومات', category: 'compensations', isHigh: true },

  // === التقارير ===
  { id: 'reports_view', name: 'عرض التقارير', description: 'عرض التقارير والإحصائيات', category: 'reports', isHigh: false },
  { id: 'reports_generate', name: 'توليد التقارير', description: 'إنشاء تقارير مخصصة', category: 'reports', isHigh: false },
  { id: 'reports_export', name: 'تصدير التقارير', description: 'تصدير التقارير لملفات', category: 'reports', isHigh: false },

  // === إدارة النظام ===
  { id: 'users_view', name: 'عرض المستخدمين', description: 'عرض قائمة المستخدمين', category: 'system', isHigh: true },
  { id: 'users_add', name: 'إضافة مستخدمين', description: 'إضافة مستخدمين جدد', category: 'system', isHigh: true },
  { id: 'users_edit', name: 'تعديل المستخدمين', description: 'تعديل بيانات المستخدمين', category: 'system', isHigh: true },
  { id: 'users_delete', name: 'حذف المستخدمين', description: 'حذف المستخدمين', category: 'system', isHigh: true },
  { id: 'system_settings', name: 'إعدادات النظام', description: 'إدارة إعدادات الأمان والنظام', category: 'system', isHigh: true },
];

// فئات الصلاحيات
export const PERMISSION_CATEGORIES = {
  employees: 'الموظفين',
  institutions: 'المؤسسات',
  branches: 'الفروع',
  payroll: 'الرواتب',
  leaves: 'الإجازات',
  advances: 'السلف',
  compensations: 'المكافآت والخصومات',
  reports: 'التقارير',
  system: 'إدارة المستخدمين'
};

/**
 * فئة التحقق من الصلاحيات المبسطة
 */
export class SimplePermissionChecker {
  
  /**
   * التحقق من صلاحية واحدة
   */
  static hasPermission(user: SimpleUser, permission: string): boolean {
    // مدير النظام لديه جميع الصلاحيات
    if (user.role === 'admin') {
      return true;
    }

    // التحقق من وجود الصلاحية في قائمة المستخدم
    return user.permissions.includes(permission);
  }

  /**
   * التحقق من أي صلاحية من قائمة
   */
  static hasAnyPermission(user: SimpleUser, permissions: string[]): boolean {
    if (user.role === 'admin') {
      return true;
    }

    return permissions.some(permission => user.permissions.includes(permission));
  }

  /**
   * التحقق من جميع الصلاحيات في قائمة
   */
  static hasAllPermissions(user: SimpleUser, permissions: string[]): boolean {
    if (user.role === 'admin') {
      return true;
    }

    return permissions.every(permission => user.permissions.includes(permission));
  }

  /**
   * الحصول على الصلاحيات حسب الفئة
   */
  static getPermissionsByCategory(category: string): SimplePermission[] {
    return AVAILABLE_PERMISSIONS.filter(p => p.category === category);
  }

  /**
   * الحصول على الصلاحيات عالية الخطورة
   */
  static getHighRiskPermissions(): SimplePermission[] {
    return AVAILABLE_PERMISSIONS.filter(p => p.isHigh);
  }

  /**
   * التحقق من صحة قائمة صلاحيات
   */
  static validatePermissions(permissions: string[]): {
    valid: string[];
    invalid: string[];
    highRisk: string[];
  } {
    const validPermissionIds = AVAILABLE_PERMISSIONS.map(p => p.id);
    
    const valid = permissions.filter(p => validPermissionIds.includes(p));
    const invalid = permissions.filter(p => !validPermissionIds.includes(p));
    const highRisk = valid.filter(p => {
      const permission = AVAILABLE_PERMISSIONS.find(ap => ap.id === p);
      return permission?.isHigh || false;
    });

    return { valid, invalid, highRisk };
  }

  /**
   * الحصول على الصلاحيات الافتراضية للدور
   */
  static getDefaultPermissions(role: 'admin' | 'employee'): string[] {
    if (role === 'admin') {
      // المدير لديه جميع الصلاحيات (سيتم التحقق في hasPermission)
      return [];
    }

    // الموظف العادي - صلاحيات أساسية فقط
    return [
      'employees_view',
      'institutions_view',
      'branches_view',
      'leaves_view',
      'leaves_request',
      'advances_view',
      'advances_request',
      'compensations_view',
      'reports_view'
    ];
  }

  /**
   * فلترة الصلاحيات المسموحة للدور
   */
  static filterAllowedPermissions(role: 'admin' | 'employee', permissions: string[]): string[] {
    if (role === 'admin') {
      // المدير يمكنه الحصول على أي صلاحية
      return permissions.filter(p => AVAILABLE_PERMISSIONS.some(ap => ap.id === p));
    }

    // الموظف لا يمكنه الحصول على صلاحيات النظام
    const systemPermissions = AVAILABLE_PERMISSIONS
      .filter(p => p.category === 'system')
      .map(p => p.id);

    return permissions.filter(p => 
      AVAILABLE_PERMISSIONS.some(ap => ap.id === p) && 
      !systemPermissions.includes(p)
    );
  }
}
