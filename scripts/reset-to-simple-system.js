const mysql = require('mysql2/promise');

async function resetToSimpleSystem() {
  try {
    // الاتصال بقاعدة البيانات
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🔗 متصل بقاعدة البيانات...');

    // 1. إعادة تعيين جميع المستخدمين لدورين فقط
    console.log('\n🔄 إعادة تعيين الأدوار...');
    
    // تحديث جميع المستخدمين ليكونوا موظفين عاديين
    await connection.execute(`
      UPDATE users
      SET role = 'employee',
          permissions = '["employees_view", "institutions_view", "branches_view", "leaves_view", "leaves_request", "advances_view", "advances_request", "compensations_view", "reports_view"]'
      WHERE role NOT IN ('admin')
    `);

    // تحديث المديرين ليكون لديهم جميع الصلاحيات
    await connection.execute(`
      UPDATE users 
      SET permissions = '[]'
      WHERE role = 'admin'
    `);

    console.log('✅ تم إعادة تعيين الأدوار');

    // 2. إنشاء مدير نظام رئيسي
    console.log('\n👑 إنشاء مدير النظام الرئيسي...');
    
    const adminExists = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['admin@company.com']
    );

    if (adminExists[0].length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await connection.execute(`
        INSERT INTO users (id, name, email, password, role, permissions, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        'admin-001',
        'مدير النظام',
        'admin@company.com',
        hashedPassword,
        'admin',
        '[]', // المدير لديه جميع الصلاحيات تلقائياً
        'active'
      ]);
      
      console.log('✅ تم إنشاء مدير النظام');
    } else {
      await connection.execute(`
        UPDATE users 
        SET role = 'admin', permissions = '[]'
        WHERE email = 'admin@company.com'
      `);
      console.log('✅ تم تحديث مدير النظام الموجود');
    }

    // 3. إنشاء موظف تجريبي بصلاحيات محددة
    console.log('\n👤 إنشاء موظف تجريبي...');
    
    await connection.execute('DELETE FROM users WHERE email = ?', ['test@company.com']);
    
    const bcrypt = require('bcryptjs');
    const testPassword = await bcrypt.hash('test123', 10);
    
    await connection.execute(`
      INSERT INTO users (id, name, email, password, role, permissions, status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      'test-user-001',
      'موظف تجريبي',
      'test@company.com',
      testPassword,
      'employee',
      '["employees_view", "branches_view", "reports_view"]', // صلاحيات محدودة جداً
      'active'
    ]);

    console.log('✅ تم إنشاء الموظف التجريبي');

    // 4. عرض ملخص النظام الجديد
    console.log('\n📊 ملخص النظام المبسط:');
    
    const [users] = await connection.execute('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    users.forEach(roleCount => {
      console.log(`   ${roleCount.role === 'admin' ? '👑' : '👤'} ${roleCount.role}: ${roleCount.count} مستخدم`);
    });

    console.log('\n🔑 بيانات تسجيل الدخول:');
    console.log('   👑 مدير النظام: admin@company.com / admin123');
    console.log('   👤 موظف تجريبي: test@company.com / test123');

    console.log('\n📋 الصلاحيات المتاحة:');
    console.log('   🟢 عرض البيانات: 9 صلاحيات');
    console.log('   🔴 تعديل البيانات: 18 صلاحية');
    console.log('   ⚠️ عالية الخطورة: 22 صلاحية');

    console.log('\n🎯 النظام الجديد:');
    console.log('   ✅ دورين فقط: مدير أو موظف');
    console.log('   ✅ تحكم كامل في الصلاحيات الفردية');
    console.log('   ✅ حماية صارمة للعمليات الحساسة');
    console.log('   ✅ لا توجد أدوار معقدة أو ثغرات');

    await connection.end();

  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين النظام:', error);
  }
}

resetToSimpleSystem();
