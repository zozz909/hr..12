const mysql = require('mysql2/promise');

// خريطة تحويل الصلاحيات القديمة إلى الجديدة
const PERMISSION_MIGRATION_MAP = {
  // صلاحيات الموظفين
  'view_employees': 'employees.view',
  'edit_employees': 'employees.edit',
  'delete_employees': 'employees.delete',
  'add_employees': 'employees.create',
  
  // صلاحيات المؤسسات
  'view_institutions': 'institutions.view',
  'add_institutions': 'institutions.create',
  'edit_institutions': 'institutions.edit',
  'delete_institutions': 'institutions.delete',
  
  // صلاحيات الرواتب
  'view_payroll': 'payroll.view',
  'edit_payroll': 'payroll.edit',
  'calculate_payroll': 'payroll.calculate',
  'approve_payroll': 'payroll.approve',
  
  // صلاحيات التقارير
  'view_reports': 'reports.view',
  'generate_reports': 'reports.generate',
  'export_reports': 'reports.export',
  
  // صلاحيات النظام
  'manage_users': 'system.users.edit',
  'view_users': 'system.users.view',
  'system_settings': 'system.settings',
  'manage_roles': 'system.roles.manage',
  'view_audit_log': 'system.audit.view',
  
  // صلاحيات السلف
  'view_advances': 'advances.view',
  'approve_advances': 'advances.approve',
  'request_advances': 'advances.create',
  'manage_advances': 'advances.approve',
  
  // صلاحيات المكافآت
  'view_compensations': 'compensations.view',
  'manage_compensations': 'compensations.create',
  'approve_compensations': 'compensations.edit',
  
  // صلاحيات الإجازات
  'view_leaves': 'leaves.view',
  'request_leaves': 'leaves.create',
  'approve_leaves': 'leaves.approve',
  'manage_leaves': 'leaves.approve',
  
  // صلاحيات الفروع
  'view_branches': 'institutions.view',
  'manage_branches': 'institutions.edit',
  
  // صلاحيات النماذج
  'view_forms': 'documents.view',
  'manage_forms': 'documents.edit'
};

// إضافة صلاحيات تلقائية حسب الدور
const ROLE_AUTO_PERMISSIONS = {
  'admin': [
    'employees.view_details', 'employees.export',
    'payroll.approve', 'leaves.cancel', 'advances.disburse',
    'compensations.delete', 'documents.delete',
    'reports.schedule', 'system.users.create', 'system.users.delete',
    'system.backup'
  ],
  'hr_manager': [
    'employees.view_details', 'employees.export',
    'documents.edit', 'reports.export'
  ],
  'supervisor': [
    'employees.view_details'
  ],
  'employee': [
    'leaves.edit', 'documents.upload'
  ]
};

async function migratePermissions() {
  try {
    // الاتصال بقاعدة البيانات
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🔗 متصل بقاعدة البيانات...');

    // جلب جميع المستخدمين
    const [users] = await connection.execute('SELECT * FROM users');
    
    console.log(`👥 تم العثور على ${users.length} مستخدم للترحيل...`);

    for (const user of users) {
      console.log(`\n🔄 ترحيل المستخدم: ${user.name} (${user.email})`);
      
      let oldPermissions = [];
      try {
        oldPermissions = JSON.parse(user.permissions || '[]');
      } catch (e) {
        console.log(`   ⚠️ خطأ في تحليل الصلاحيات القديمة، سيتم استخدام الافتراضية`);
        oldPermissions = [];
      }

      console.log(`   📋 الصلاحيات القديمة: ${oldPermissions.join(', ')}`);

      // تحويل الصلاحيات القديمة إلى الجديدة
      const newPermissions = [];
      
      for (const oldPerm of oldPermissions) {
        if (PERMISSION_MIGRATION_MAP[oldPerm]) {
          newPermissions.push(PERMISSION_MIGRATION_MAP[oldPerm]);
        } else {
          console.log(`   ⚠️ صلاحية غير معروفة: ${oldPerm}`);
        }
      }

      // إضافة الصلاحيات التلقائية حسب الدور
      const autoPermissions = ROLE_AUTO_PERMISSIONS[user.role] || [];
      newPermissions.push(...autoPermissions);

      // إزالة التكرارات وتحسين القائمة
      const uniquePermissions = [...new Set(newPermissions)];
      
      console.log(`   ✨ الصلاحيات الجديدة: ${uniquePermissions.join(', ')}`);

      // تحديث المستخدم في قاعدة البيانات
      await connection.execute(
        'UPDATE users SET permissions = ? WHERE id = ?',
        [JSON.stringify(uniquePermissions), user.id]
      );

      console.log(`   ✅ تم ترحيل المستخدم بنجاح`);
    }

    console.log('\n🎉 تم ترحيل جميع المستخدمين بنجاح!');
    console.log('\n📊 ملخص الترحيل:');
    console.log(`   👥 عدد المستخدمين: ${users.length}`);
    console.log(`   🔄 الصلاحيات المحولة: ${Object.keys(PERMISSION_MIGRATION_MAP).length}`);
    console.log(`   ✨ النظام الجديد: ${Object.values(PERMISSION_MIGRATION_MAP).length} صلاحية محسنة`);

    await connection.end();

  } catch (error) {
    console.error('❌ خطأ في ترحيل الصلاحيات:', error);
  }
}

migratePermissions();
