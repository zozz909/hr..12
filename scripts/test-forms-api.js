const fetch = globalThis.fetch;

async function testFormsAPI() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('📋 اختبار API النماذج...\n');

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

    // اختبار جلب النماذج
    console.log('\n📋 اختبار جلب النماذج...');
    const formsResponse = await fetch(`${baseUrl}/api/forms`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log('📊 حالة الاستجابة:', formsResponse.status);
    
    if (formsResponse.ok) {
      const formsData = await formsResponse.json();
      console.log('✅ تم جلب النماذج بنجاح');
      console.log(`📄 عدد النماذج: ${formsData.forms?.length || 0}`);
    } else {
      const errorData = await formsResponse.json();
      console.log('❌ فشل جلب النماذج:', errorData.error);
    }

    console.log('\n🎉 انتهى اختبار API النماذج');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testFormsAPI();
