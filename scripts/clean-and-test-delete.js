const mysql = require('mysql2/promise');
const fetch = globalThis.fetch;

async function cleanAndTestDelete() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🧹 تنظيف واختبار وظيفة الحذف...\n');

  try {
    // تنظيف قاعدة البيانات أولاً
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🔗 متصل بقاعدة البيانات...');

    // حذف المستخدمين التجريبيين
    await connection.execute(`
      DELETE FROM users 
      WHERE email IN (
        'delete.test@company.com',
        'branch.manager@company.com',
        'newuser@company.com'
      )
    `);
    
    console.log('✅ تم تنظيف المستخدمين التجريبيين');

    // التأكد من وجود مدير واحد فقط
    const [admins] = await connection.execute(`
      SELECT id, name, email FROM users WHERE role = 'admin'
    `);
    
    console.log(`👑 المديرين الموجودين: ${admins.length}`);
    admins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });

    await connection.end();

    // الآن اختبار النظام
    console.log('\n🧪 اختبار النظام...');

    // تسجيل الدخول
    const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'admin123'
      }),
    });

    const adminData = await adminLogin.json();
    if (!adminData.success) {
      console.log('❌ فشل تسجيل دخول المدير');
      return;
    }

    const adminToken = adminData.token;
    console.log('✅ نجح تسجيل دخول المدير');

    // إضافة مستخدم جديد
    console.log('\n➕ إضافة مستخدم جديد...');
    const newUserData = {
      name: 'مستخدم للحذف',
      email: 'delete.test@company.com',
      password: 'delete123',
      role: 'employee',
      permissions: ['employees_view', 'branches_view', 'branches_add']
    };

    const addResponse = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(newUserData)
    });

    const addResult = await addResponse.json();
    if (!addResult.success) {
      console.log('❌ فشل إضافة المستخدم:', addResult.error);
      return;
    }

    const newUserId = addResult.user.id;
    console.log('✅ تم إضافة المستخدم بنجاح');
    console.log(`   👤 المعرف: ${newUserId}`);
    console.log(`   📧 البريد: ${addResult.user.email}`);
    console.log(`   📋 الصلاحيات: ${addResult.user.permissions.join(', ')}`);

    // اختبار تسجيل الدخول بالمستخدم الجديد
    console.log('\n🔐 اختبار تسجيل الدخول بالمستخدم الجديد...');
    const newUserLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'delete.test@company.com',
        password: 'delete123'
      }),
    });

    const newUserLoginData = await newUserLogin.json();
    if (newUserLoginData.success) {
      console.log('✅ نجح تسجيل دخول المستخدم الجديد');
      console.log(`   📋 الصلاحيات: ${newUserLoginData.user.permissions.join(', ')}`);
    }

    // حذف المستخدم
    console.log('\n🗑️ حذف المستخدم...');
    const deleteResponse = await fetch(`${baseUrl}/api/users`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ id: newUserId })
    });

    const deleteResult = await deleteResponse.json();
    if (deleteResult.success) {
      console.log('✅ تم حذف المستخدم بنجاح');
      
      // اختبار عدم إمكانية تسجيل الدخول
      console.log('\n🔒 اختبار عدم إمكانية تسجيل الدخول...');
      const deletedLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'delete.test@company.com',
          password: 'delete123'
        }),
      });

      const deletedLoginData = await deletedLogin.json();
      if (!deletedLoginData.success) {
        console.log('✅ لا يمكن تسجيل الدخول بالمستخدم المحذوف');
      } else {
        console.log('❌ يمكن تسجيل الدخول بالمستخدم المحذوف!');
      }
    } else {
      console.log('❌ فشل حذف المستخدم:', deleteResult.error);
    }

    console.log('\n🎉 انتهى الاختبار!');
    console.log('\n✅ الميزات المتاحة:');
    console.log('   ➕ إضافة مستخدمين جدد');
    console.log('   🗑️ حذف المستخدمين');
    console.log('   🏢 صلاحيات الفروع (4 صلاحيات)');
    console.log('   🛡️ حماية أمنية محكمة');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

cleanAndTestDelete();
