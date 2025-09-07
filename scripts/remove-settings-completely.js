const mysql = require('mysql2/promise');

async function removeSettingsCompletely() {
  try {
    // الاتصال بقاعدة البيانات
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🔗 متصل بقاعدة البيانات...');

    // 1. حذف جدول security_settings
    console.log('\n🗑️ حذف جدول إعدادات الأمان...');
    try {
      await connection.execute('DROP TABLE IF EXISTS security_settings');
      console.log('✅ تم حذف جدول security_settings');
    } catch (error) {
      console.log('⚠️ الجدول غير موجود أو تم حذفه مسبقاً');
    }

    // 2. إزالة صلاحيات الإعدادات من جميع المستخدمين
    console.log('\n🔄 إزالة صلاحيات الإعدادات من المستخدمين...');
    
    const [users] = await connection.execute('SELECT id, permissions FROM users');
    
    for (const user of users) {
      try {
        let permissions = JSON.parse(user.permissions || '[]');
        
        // إزالة جميع صلاحيات الإعدادات
        const settingsPermissions = [
          'system_settings',
          'security_settings',
          'backup_settings',
          'audit_settings',
          'manage_settings'
        ];
        
        const originalCount = permissions.length;
        permissions = permissions.filter(p => !settingsPermissions.includes(p));
        
        if (permissions.length !== originalCount) {
          await connection.execute(
            'UPDATE users SET permissions = ? WHERE id = ?',
            [JSON.stringify(permissions), user.id]
          );
          console.log(`   ✅ تم تحديث صلاحيات المستخدم: ${user.id}`);
        }
      } catch (error) {
        console.log(`   ⚠️ خطأ في تحديث المستخدم ${user.id}:`, error.message);
      }
    }

    // 3. تحديث الصلاحيات الافتراضية
    console.log('\n📋 تحديث الصلاحيات الافتراضية...');
    
    // الموظفين العاديين - صلاحيات أساسية فقط
    await connection.execute(`
      UPDATE users 
      SET permissions = '["employees_view", "institutions_view", "leaves_view", "leaves_request", "advances_view", "advances_request", "compensations_view", "reports_view"]'
      WHERE role = 'employee'
    `);

    // المديرين - بدون صلاحيات محددة (جميع الصلاحيات تلقائياً)
    await connection.execute(`
      UPDATE users 
      SET permissions = '[]'
      WHERE role = 'admin'
    `);

    console.log('✅ تم تحديث الصلاحيات الافتراضية');

    // 4. عرض ملخص النظام النهائي
    console.log('\n📊 ملخص النظام بعد حذف الإعدادات:');
    
    const [finalUsers] = await connection.execute(`
      SELECT role, COUNT(*) as count, 
             AVG(JSON_LENGTH(permissions)) as avg_permissions
      FROM users 
      GROUP BY role
    `);
    
    finalUsers.forEach(roleData => {
      console.log(`   ${roleData.role === 'admin' ? '👑' : '👤'} ${roleData.role}: ${roleData.count} مستخدم`);
      if (roleData.role === 'admin') {
        console.log('     📋 الصلاحيات: جميع الصلاحيات تلقائياً');
      } else {
        console.log(`     📋 الصلاحيات: ${Math.round(roleData.avg_permissions)} صلاحية في المتوسط`);
      }
    });

    console.log('\n🎯 النظام الجديد:');
    console.log('   ✅ لا توجد إعدادات معقدة');
    console.log('   ✅ لا توجد صفحات إعدادات');
    console.log('   ✅ إدارة الصلاحيات فقط للمديرين');
    console.log('   ✅ نظام بسيط وآمن 100%');

    console.log('\n🔑 الوصول للنظام:');
    console.log('   🌐 النظام: http://localhost:9004');
    console.log('   🛡️ إدارة الصلاحيات: http://localhost:9004/admin/permissions');
    console.log('   👑 مدير النظام: admin@company.com / admin123');

    await connection.end();

  } catch (error) {
    console.error('❌ خطأ في حذف الإعدادات:', error);
  }
}

removeSettingsCompletely();
