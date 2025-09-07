// استخدام fetch المدمج في Node.js 18+
const fetch = globalThis.fetch;

async function simpleDeleteTest() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🧪 اختبار حذف بسيط...\n');

  try {
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

    // إضافة مستخدم
    const newUser = {
      name: 'اختبار حذف',
      email: 'delete.simple@test.com',
      password: 'test123',
      role: 'employee',
      permissions: ['employees_view']
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
    console.log('📄 نتيجة الحذف:', deleteResult);

    if (deleteResult.success) {
      console.log('✅ تم الحذف بنجاح');
    } else {
      console.log('❌ فشل الحذف:', deleteResult.error);
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

simpleDeleteTest();
