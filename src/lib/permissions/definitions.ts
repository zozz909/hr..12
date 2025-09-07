/**
 * نظام الصلاحيات المحسن - تعريف شامل ومنطقي للصلاحيات
 */

export interface Permission {
  id: string;
  label: string;
  description: string;
  category: string;
  level: 'basic' | 'advanced' | 'admin';
  dependencies?: string[]; // الصلاحيات المطلوبة مسبقاً
  conflicts?: string[]; // الصلاحيات المتعارضة
  isSystemCritical?: boolean; // صلاحيات حساسة للنظام
}

export interface PermissionCategory {
  id: string;
  label: string;
  description: string;
  icon: string;
  order: number;
}

// تعريف فئات الصلاحيات
export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'employees',
    label: 'إدارة الموظفين',
    description: 'صلاحيات متعلقة بإدارة بيانات الموظفين',
    icon: 'Users',
    order: 1
  },
  {
    id: 'institutions',
    label: 'إدارة المؤسسات',
    description: 'صلاحيات متعلقة بإدارة المؤسسات والفروع',
    icon: 'Building',
    order: 2
  },
  {
    id: 'payroll',
    label: 'إدارة الرواتب',
    description: 'صلاحيات متعلقة بحساب ومعالجة الرواتب',
    icon: 'DollarSign',
    order: 3
  },
  {
    id: 'leaves',
    label: 'إدارة الإجازات',
    description: 'صلاحيات متعلقة بطلبات الإجازات والموافقات',
    icon: 'Calendar',
    order: 4
  },
  {
    id: 'advances',
    label: 'إدارة السلف',
    description: 'صلاحيات متعلقة بطلبات السلف والموافقات',
    icon: 'CreditCard',
    order: 5
  },
  {
    id: 'compensations',
    label: 'المكافآت والخصومات',
    description: 'صلاحيات متعلقة بإدارة المكافآت والخصومات',
    icon: 'Award',
    order: 6
  },
  {
    id: 'documents',
    label: 'إدارة الوثائق',
    description: 'صلاحيات متعلقة برفع وإدارة الوثائق',
    icon: 'FileText',
    order: 7
  },
  {
    id: 'reports',
    label: 'التقارير والإحصائيات',
    description: 'صلاحيات متعلقة بعرض وتصدير التقارير',
    icon: 'BarChart',
    order: 8
  },
  {
    id: 'system',
    label: 'إدارة النظام',
    description: 'صلاحيات إدارية للنظام والمستخدمين',
    icon: 'Settings',
    order: 9
  }
];

// تعريف الصلاحيات الشامل
export const PERMISSIONS: Permission[] = [
  // ===== صلاحيات الموظفين =====
  {
    id: 'employees.view',
    label: 'عرض الموظفين',
    description: 'عرض قائمة الموظفين والبيانات الأساسية',
    category: 'employees',
    level: 'basic'
  },
  {
    id: 'employees.view_details',
    label: 'عرض تفاصيل الموظفين',
    description: 'عرض التفاصيل الكاملة للموظفين',
    category: 'employees',
    level: 'basic',
    dependencies: ['employees.view']
  },
  {
    id: 'employees.create',
    label: 'إضافة موظفين',
    description: 'إضافة موظفين جدد للنظام',
    category: 'employees',
    level: 'advanced',
    dependencies: ['employees.view']
  },
  {
    id: 'employees.edit',
    label: 'تعديل الموظفين',
    description: 'تعديل بيانات الموظفين الموجودين',
    category: 'employees',
    level: 'advanced',
    dependencies: ['employees.view_details']
  },
  {
    id: 'employees.delete',
    label: 'حذف الموظفين',
    description: 'حذف أو أرشفة الموظفين',
    category: 'employees',
    level: 'admin',
    dependencies: ['employees.edit'],
    isSystemCritical: true
  },
  {
    id: 'employees.export',
    label: 'تصدير بيانات الموظفين',
    description: 'تصدير قوائم الموظفين إلى ملفات',
    category: 'employees',
    level: 'advanced',
    dependencies: ['employees.view_details']
  },

  // ===== صلاحيات المؤسسات =====
  {
    id: 'institutions.view',
    label: 'عرض المؤسسات',
    description: 'عرض قائمة المؤسسات والفروع',
    category: 'institutions',
    level: 'basic'
  },
  {
    id: 'institutions.create',
    label: 'إضافة مؤسسات',
    description: 'إضافة مؤسسات وفروع جديدة',
    category: 'institutions',
    level: 'advanced',
    dependencies: ['institutions.view']
  },
  {
    id: 'institutions.edit',
    label: 'تعديل المؤسسات',
    description: 'تعديل بيانات المؤسسات والفروع',
    category: 'institutions',
    level: 'advanced',
    dependencies: ['institutions.view']
  },
  {
    id: 'institutions.delete',
    label: 'حذف المؤسسات',
    description: 'حذف المؤسسات والفروع',
    category: 'institutions',
    level: 'admin',
    dependencies: ['institutions.edit'],
    isSystemCritical: true
  },

  // ===== صلاحيات الرواتب =====
  {
    id: 'payroll.view',
    label: 'عرض الرواتب',
    description: 'عرض معلومات الرواتب والمستحقات',
    category: 'payroll',
    level: 'basic'
  },
  {
    id: 'payroll.calculate',
    label: 'حساب الرواتب',
    description: 'تشغيل عمليات حساب الرواتب',
    category: 'payroll',
    level: 'advanced',
    dependencies: ['payroll.view', 'employees.view_details']
  },
  {
    id: 'payroll.edit',
    label: 'تعديل الرواتب',
    description: 'تعديل مبالغ الرواتب والمستحقات',
    category: 'payroll',
    level: 'admin',
    dependencies: ['payroll.calculate'],
    isSystemCritical: true
  },
  {
    id: 'payroll.approve',
    label: 'اعتماد الرواتب',
    description: 'اعتماد ونشر الرواتب المحسوبة',
    category: 'payroll',
    level: 'admin',
    dependencies: ['payroll.edit'],
    isSystemCritical: true
  },

  // ===== صلاحيات الإجازات =====
  {
    id: 'leaves.view',
    label: 'عرض الإجازات',
    description: 'عرض طلبات الإجازات وحالتها',
    category: 'leaves',
    level: 'basic'
  },
  {
    id: 'leaves.create',
    label: 'إنشاء طلبات إجازة',
    description: 'إنشاء طلبات إجازة جديدة',
    category: 'leaves',
    level: 'basic',
    dependencies: ['leaves.view']
  },
  {
    id: 'leaves.edit',
    label: 'تعديل طلبات الإجازة',
    description: 'تعديل طلبات الإجازة المعلقة',
    category: 'leaves',
    level: 'basic',
    dependencies: ['leaves.create']
  },
  {
    id: 'leaves.approve',
    label: 'الموافقة على الإجازات',
    description: 'الموافقة أو رفض طلبات الإجازات',
    category: 'leaves',
    level: 'advanced',
    dependencies: ['leaves.view']
  },
  {
    id: 'leaves.cancel',
    label: 'إلغاء الإجازات',
    description: 'إلغاء الإجازات المعتمدة',
    category: 'leaves',
    level: 'admin',
    dependencies: ['leaves.approve'],
    isSystemCritical: true
  },

  // ===== صلاحيات السلف =====
  {
    id: 'advances.view',
    label: 'عرض السلف',
    description: 'عرض طلبات السلف وحالتها',
    category: 'advances',
    level: 'basic'
  },
  {
    id: 'advances.create',
    label: 'إنشاء طلبات سلف',
    description: 'إنشاء طلبات سلف جديدة',
    category: 'advances',
    level: 'basic',
    dependencies: ['advances.view']
  },
  {
    id: 'advances.approve',
    label: 'الموافقة على السلف',
    description: 'الموافقة أو رفض طلبات السلف',
    category: 'advances',
    level: 'advanced',
    dependencies: ['advances.view']
  },
  {
    id: 'advances.disburse',
    label: 'صرف السلف',
    description: 'تأكيد صرف السلف المعتمدة',
    category: 'advances',
    level: 'admin',
    dependencies: ['advances.approve'],
    isSystemCritical: true
  },

  // ===== صلاحيات المكافآت والخصومات =====
  {
    id: 'compensations.view',
    label: 'عرض المكافآت والخصومات',
    description: 'عرض المكافآت والخصومات المطبقة',
    category: 'compensations',
    level: 'basic'
  },
  {
    id: 'compensations.create',
    label: 'إضافة مكافآت وخصومات',
    description: 'إضافة مكافآت أو خصومات جديدة',
    category: 'compensations',
    level: 'advanced',
    dependencies: ['compensations.view', 'employees.view']
  },
  {
    id: 'compensations.edit',
    label: 'تعديل المكافآت والخصومات',
    description: 'تعديل المكافآت والخصومات الموجودة',
    category: 'compensations',
    level: 'advanced',
    dependencies: ['compensations.create']
  },
  {
    id: 'compensations.delete',
    label: 'حذف المكافآت والخصومات',
    description: 'حذف المكافآت والخصومات',
    category: 'compensations',
    level: 'admin',
    dependencies: ['compensations.edit'],
    isSystemCritical: true
  },

  // ===== صلاحيات الوثائق =====
  {
    id: 'documents.view',
    label: 'عرض الوثائق',
    description: 'عرض الوثائق المرفوعة',
    category: 'documents',
    level: 'basic'
  },
  {
    id: 'documents.upload',
    label: 'رفع الوثائق',
    description: 'رفع وثائق جديدة للنظام',
    category: 'documents',
    level: 'basic',
    dependencies: ['documents.view']
  },
  {
    id: 'documents.edit',
    label: 'تعديل الوثائق',
    description: 'تعديل معلومات الوثائق المرفوعة',
    category: 'documents',
    level: 'advanced',
    dependencies: ['documents.upload']
  },
  {
    id: 'documents.delete',
    label: 'حذف الوثائق',
    description: 'حذف الوثائق من النظام',
    category: 'documents',
    level: 'admin',
    dependencies: ['documents.edit'],
    isSystemCritical: true
  },

  // ===== صلاحيات التقارير =====
  {
    id: 'reports.view',
    label: 'عرض التقارير',
    description: 'عرض التقارير والإحصائيات الأساسية',
    category: 'reports',
    level: 'basic'
  },
  {
    id: 'reports.generate',
    label: 'توليد التقارير',
    description: 'إنشاء تقارير مخصصة',
    category: 'reports',
    level: 'advanced',
    dependencies: ['reports.view']
  },
  {
    id: 'reports.export',
    label: 'تصدير التقارير',
    description: 'تصدير التقارير إلى ملفات خارجية',
    category: 'reports',
    level: 'advanced',
    dependencies: ['reports.generate']
  },
  {
    id: 'reports.schedule',
    label: 'جدولة التقارير',
    description: 'إعداد تقارير دورية مجدولة',
    category: 'reports',
    level: 'admin',
    dependencies: ['reports.export']
  },

  // ===== صلاحيات النظام =====
  {
    id: 'system.users.view',
    label: 'عرض المستخدمين',
    description: 'عرض قائمة مستخدمي النظام',
    category: 'system',
    level: 'advanced'
  },
  {
    id: 'system.users.create',
    label: 'إضافة مستخدمين',
    description: 'إضافة مستخدمين جدد للنظام',
    category: 'system',
    level: 'admin',
    dependencies: ['system.users.view'],
    isSystemCritical: true
  },
  {
    id: 'system.users.edit',
    label: 'تعديل المستخدمين',
    description: 'تعديل بيانات وصلاحيات المستخدمين',
    category: 'system',
    level: 'admin',
    dependencies: ['system.users.create'],
    isSystemCritical: true
  },
  {
    id: 'system.users.delete',
    label: 'حذف المستخدمين',
    description: 'حذف مستخدمين من النظام',
    category: 'system',
    level: 'admin',
    dependencies: ['system.users.edit'],
    isSystemCritical: true
  },
  {
    id: 'system.roles.manage',
    label: 'إدارة الأدوار',
    description: 'إنشاء وتعديل أدوار المستخدمين',
    category: 'system',
    level: 'admin',
    dependencies: ['system.users.view'],
    isSystemCritical: true
  },
  {
    id: 'system.settings',
    label: 'إعدادات النظام',
    description: 'تعديل إعدادات النظام العامة',
    category: 'system',
    level: 'admin',
    isSystemCritical: true
  },
  {
    id: 'system.audit.view',
    label: 'عرض سجل المراجعة',
    description: 'عرض سجل العمليات والتغييرات',
    category: 'system',
    level: 'admin',
    isSystemCritical: true
  },
  {
    id: 'system.backup',
    label: 'النسخ الاحتياطي',
    description: 'إنشاء واستعادة النسخ الاحتياطية',
    category: 'system',
    level: 'admin',
    isSystemCritical: true
  }
];
