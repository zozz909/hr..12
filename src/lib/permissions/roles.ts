import { PermissionValidator } from './validator';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  level: 'basic' | 'advanced' | 'admin';
  maxUsers?: number; // حد أقصى للمستخدمين (للأدوار الحساسة)
  created_at?: Date;
  updated_at?: Date;
}

/**
 * الأدوار المحددة مسبقاً في النظام
 */
export const SYSTEM_ROLES: Role[] = [
  {
    id: 'super_admin',
    name: 'مدير النظام الرئيسي',
    description: 'صلاحيات كاملة غير محدودة لجميع أجزاء النظام',
    permissions: [], // سيتم تعبئتها تلقائياً بجميع الصلاحيات
    isSystem: true,
    isActive: true,
    level: 'admin',
    maxUsers: 2 // حد أقصى مديرين فقط
  },
  {
    id: 'admin',
    name: 'مدير النظام',
    description: 'صلاحيات إدارية شاملة مع بعض القيود الأمنية',
    permissions: [
      // إدارة الموظفين
      'employees.view', 'employees.view_details', 'employees.create', 
      'employees.edit', 'employees.delete', 'employees.export',
      
      // إدارة المؤسسات
      'institutions.view', 'institutions.create', 'institutions.edit', 'institutions.delete',
      
      // إدارة الرواتب
      'payroll.view', 'payroll.calculate', 'payroll.edit', 'payroll.approve',
      
      // إدارة الإجازات
      'leaves.view', 'leaves.approve', 'leaves.cancel',
      
      // إدارة السلف
      'advances.view', 'advances.approve', 'advances.disburse',
      
      // إدارة المكافآت
      'compensations.view', 'compensations.create', 'compensations.edit', 'compensations.delete',
      
      // إدارة الوثائق
      'documents.view', 'documents.upload', 'documents.edit', 'documents.delete',
      
      // التقارير
      'reports.view', 'reports.generate', 'reports.export', 'reports.schedule',
      
      // إدارة المستخدمين
      'system.users.view', 'system.users.create', 'system.users.edit',
      'system.roles.manage', 'system.settings', 'system.audit.view'
    ],
    isSystem: true,
    isActive: true,
    level: 'admin',
    maxUsers: 5
  },
  {
    id: 'hr_manager',
    name: 'مدير الموارد البشرية',
    description: 'إدارة شاملة للموظفين والرواتب والإجازات',
    permissions: [
      // إدارة الموظفين
      'employees.view', 'employees.view_details', 'employees.create', 
      'employees.edit', 'employees.export',
      
      // عرض المؤسسات
      'institutions.view',
      
      // إدارة الرواتب
      'payroll.view', 'payroll.calculate', 'payroll.edit',
      
      // إدارة الإجازات
      'leaves.view', 'leaves.approve',
      
      // إدارة السلف
      'advances.view', 'advances.approve',
      
      // إدارة المكافآت
      'compensations.view', 'compensations.create', 'compensations.edit',
      
      // إدارة الوثائق
      'documents.view', 'documents.upload', 'documents.edit',
      
      // التقارير
      'reports.view', 'reports.generate', 'reports.export'
    ],
    isSystem: true,
    isActive: true,
    level: 'advanced'
  },
  {
    id: 'supervisor',
    name: 'مشرف',
    description: 'إشراف على الموظفين والموافقة على الطلبات',
    permissions: [
      // عرض الموظفين
      'employees.view', 'employees.view_details', 'employees.edit',
      
      // عرض المؤسسات
      'institutions.view',
      
      // عرض الرواتب
      'payroll.view',
      
      // إدارة الإجازات
      'leaves.view', 'leaves.approve',
      
      // إدارة السلف
      'advances.view', 'advances.approve',
      
      // عرض المكافآت
      'compensations.view', 'compensations.create',
      
      // إدارة الوثائق
      'documents.view', 'documents.upload',
      
      // التقارير
      'reports.view', 'reports.generate'
    ],
    isSystem: true,
    isActive: true,
    level: 'advanced'
  },
  {
    id: 'employee',
    name: 'موظف',
    description: 'صلاحيات أساسية للموظف العادي',
    permissions: [
      // عرض الموظفين
      'employees.view',
      
      // عرض المؤسسات
      'institutions.view',
      
      // إدارة الإجازات الشخصية
      'leaves.view', 'leaves.create', 'leaves.edit',
      
      // إدارة السلف الشخصية
      'advances.view', 'advances.create',
      
      // عرض المكافآت
      'compensations.view',
      
      // إدارة الوثائق الشخصية
      'documents.view', 'documents.upload',
      
      // عرض التقارير
      'reports.view'
    ],
    isSystem: true,
    isActive: true,
    level: 'basic'
  },
  {
    id: 'viewer',
    name: 'مشاهد',
    description: 'عرض البيانات فقط بدون تعديل',
    permissions: [
      'employees.view',
      'institutions.view',
      'leaves.view',
      'advances.view',
      'compensations.view',
      'documents.view',
      'reports.view'
    ],
    isSystem: true,
    isActive: true,
    level: 'basic'
  }
];

/**
 * فئة إدارة الأدوار
 */
export class RoleManager {
  
  /**
   * الحصول على جميع الأدوار
   */
  static getAllRoles(): Role[] {
    return SYSTEM_ROLES.filter(role => role.isActive);
  }

  /**
   * الحصول على دور بالمعرف
   */
  static getRole(roleId: string): Role | null {
    return SYSTEM_ROLES.find(role => role.id === roleId) || null;
  }

  /**
   * التحقق من صحة دور
   */
  static validateRole(role: Partial<Role>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // التحقق من البيانات الأساسية
    if (!role.name?.trim()) {
      errors.push('اسم الدور مطلوب');
    }

    if (!role.description?.trim()) {
      errors.push('وصف الدور مطلوب');
    }

    if (!role.permissions || role.permissions.length === 0) {
      errors.push('يجب تحديد صلاحية واحدة على الأقل');
    }

    // التحقق من صحة الصلاحيات
    if (role.permissions) {
      const permissionValidation = PermissionValidator.validatePermissionSet(role.permissions);
      errors.push(...permissionValidation.errors);
      warnings.push(...permissionValidation.warnings);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * إنشاء دور جديد
   */
  static createRole(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Role {
    const role: Role = {
      ...roleData,
      id: `custom_${Date.now()}`,
      created_at: new Date(),
      updated_at: new Date(),
      permissions: PermissionValidator.optimizePermissionSet(roleData.permissions)
    };

    return role;
  }

  /**
   * تحديث دور موجود
   */
  static updateRole(roleId: string, updates: Partial<Role>): Role | null {
    const roleIndex = SYSTEM_ROLES.findIndex(role => role.id === roleId);
    if (roleIndex === -1) {
      return null;
    }

    const currentRole = SYSTEM_ROLES[roleIndex];
    
    // منع تعديل الأدوار النظامية الحساسة
    if (currentRole.isSystem && ['super_admin', 'admin'].includes(currentRole.id)) {
      throw new Error('لا يمكن تعديل الأدوار النظامية الأساسية');
    }

    const updatedRole: Role = {
      ...currentRole,
      ...updates,
      id: currentRole.id, // منع تغيير المعرف
      isSystem: currentRole.isSystem, // منع تغيير نوع الدور
      updated_at: new Date(),
      permissions: updates.permissions ? 
        PermissionValidator.optimizePermissionSet(updates.permissions) : 
        currentRole.permissions
    };

    SYSTEM_ROLES[roleIndex] = updatedRole;
    return updatedRole;
  }

  /**
   * حذف دور (للأدوار المخصصة فقط)
   */
  static deleteRole(roleId: string): boolean {
    const roleIndex = SYSTEM_ROLES.findIndex(role => role.id === roleId);
    if (roleIndex === -1) {
      return false;
    }

    const role = SYSTEM_ROLES[roleIndex];
    
    // منع حذف الأدوار النظامية
    if (role.isSystem) {
      throw new Error('لا يمكن حذف الأدوار النظامية');
    }

    SYSTEM_ROLES.splice(roleIndex, 1);
    return true;
  }

  /**
   * الحصول على إحصائيات الأدوار
   */
  static getRoleStats(): {
    totalRoles: number;
    systemRoles: number;
    customRoles: number;
    activeRoles: number;
    inactiveRoles: number;
  } {
    return {
      totalRoles: SYSTEM_ROLES.length,
      systemRoles: SYSTEM_ROLES.filter(r => r.isSystem).length,
      customRoles: SYSTEM_ROLES.filter(r => !r.isSystem).length,
      activeRoles: SYSTEM_ROLES.filter(r => r.isActive).length,
      inactiveRoles: SYSTEM_ROLES.filter(r => !r.isActive).length
    };
  }
}
