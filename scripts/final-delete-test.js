const mysql = require('mysql2/promise');
const fetch = globalThis.fetch;

async function finalDeleteTest() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🧪 اختبار نهائي لوظيفة الحذف...\n');

  try {
    // تنظيف قاعدة البيانات
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    // حذف المستخدمين التجريبيين
    await connection.execute(`
      DELETE FROM users 
      WHERE email LIKE '%delete%' OR email LIKE '%test%' OR email LIKE '%simple%'
    `);
    
    console.log('✅ تم تنظيف المستخدمين التجريبيين');
    await connection.end();

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
    const adminToken = adminData.token;
    console.log('✅ تسجيل الدخول نجح');

    // إضافة مستخدم جديد
    const newUser = {
      name: 'مستخدم للحذف النهائي',
      email: 'final.delete@test.com',
      password: 'test123',
      role: 'employee',
      permissions: ['employees_view', 'branches_view']
    };

    const addResponse = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(newUser)
    });

    const addResult = await addResponse.json();
    if (!addResult.success) {
      console.log('❌ فشل إضافة المستخدم:', addResult.error);
      return;
    }

    const userId = addResult.user.id;
    console.log('✅ تم إضافة المستخدم:', userId);

    // التأكد من تسجيل الدخول
    const loginTest = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'final.delete@test.com',
        password: 'test123'
      }),
    });

    const loginResult = await loginTest.json();
    if (loginResult.success) {
      console.log('✅ المستخدم يمكنه تسجيل الدخول');
    }

    // محاولة الحذف
    console.log('\n🗑️ محاولة الحذف...');
    const deleteResponse = await fetch(`${baseUrl}/api/users`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ id: userId })
    });

    console.log('📊 حالة الاستجابة:', deleteResponse.status);
    
    const deleteResult = await deleteResponse.json();
    console.log('📄 نتيجة الحذف:', JSON.stringify(deleteResult, null, 2));

    if (deleteResult.success) {
      console.log('✅ تم الحذف بنجاح');
      
      // اختبار عدم إمكانية تسجيل الدخول
      const deletedLoginTest = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'final.delete@test.com',
          password: 'test123'
        }),
      });

      const deletedLoginResult = await deletedLoginTest.json();
      if (!deletedLoginResult.success) {
        console.log('✅ لا يمكن تسجيل الدخول بالمستخدم المحذوف');
      } else {
        console.log('❌ يمكن تسجيل الدخول بالمستخدم المحذوف!');
      }
    } else {
      console.log('❌ فشل الحذف:', deleteResult.error);
    }

    console.log('\n🎉 انتهى الاختبار النهائي!');

  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

finalDeleteTest();
