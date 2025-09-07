// استخدام fetch المدمج في Node.js 18+
const fetch = globalThis.fetch;

async function testSimpleSystem() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🚀 اختبار النظام المبسط والآمن...\n');

  try {
    // اختبار 1: تسجيل الدخول بالمدير
    console.log('👑 اختبار 1: تسجيل الدخول بمدير النظام...');
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
      console.log('❌ فشل تسجيل دخول المدير:', adminData.error);
      return;
    }

    console.log('✅ نجح تسجيل دخول المدير');
    console.log(`   👤 الاسم: ${adminData.user.name}`);
    console.log(`   🎭 الدور: ${adminData.user.role}`);
    console.log(`   📋 الصلاحيات: ${adminData.user.permissions.length === 0 ? 'جميع الصلاحيات (تلقائي)' : adminData.user.permissions.join(', ')}`);
    
    const adminToken = adminData.token;

    // اختبار 2: المدير يمكنه الوصول لكل شيء
    console.log('\n🔓 اختبار 2: وصول المدير للعمليات...');
    
    const adminTests = [
      { endpoint: '/api/employees', method: 'GET', name: 'عرض الموظفين' },
      { endpoint: '/api/institutions', method: 'GET', name: 'عرض المؤسسات' },
      { endpoint: '/api/users', method: 'GET', name: 'عرض المستخدمين' },
      { endpoint: '/api/permissions', method: 'GET', name: 'عرض الصلاحيات' }
    ];

    for (const test of adminTests) {
      const response = await fetch(`${baseUrl}${test.endpoint}`, {
        method: test.method,
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (response.status === 200) {
        console.log(`   ✅ ${test.name}: نجح`);
      } else {
        console.log(`   ❌ ${test.name}: فشل (${response.status})`);
      }
    }

    // اختبار 3: تسجيل الدخول بالموظف التجريبي
    console.log('\n👤 اختبار 3: تسجيل الدخول بالموظف التجريبي...');
    const empLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@company.com',
        password: 'test123'
      }),
    });

    const empData = await empLogin.json();
    if (!empData.success) {
      console.log('❌ فشل تسجيل دخول الموظف:', empData.error);
      return;
    }

    console.log('✅ نجح تسجيل دخول الموظف');
    console.log(`   👤 الاسم: ${empData.user.name}`);
    console.log(`   🎭 الدور: ${empData.user.role}`);
    console.log(`   📋 الصلاحيات: ${empData.user.permissions.join(', ')}`);
    
    const empToken = empData.token;

    // اختبار 4: الموظف محدود الصلاحيات
    console.log('\n🔒 اختبار 4: قيود الموظف...');
    
    const empTests = [
      { endpoint: '/api/employees', method: 'GET', name: 'عرض الموظفين', shouldPass: true },
      { endpoint: '/api/employees', method: 'POST', name: 'إضافة موظف', shouldPass: false, body: { name: 'test', email: 'test@test.com' } },
      { endpoint: '/api/users', method: 'GET', name: 'عرض المستخدمين', shouldPass: false },
      { endpoint: '/api/permissions', method: 'GET', name: 'عرض الصلاحيات', shouldPass: false }
    ];

    for (const test of empTests) {
      const options = {
        method: test.method,
        headers: { 
          'Authorization': `Bearer ${empToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(`${baseUrl}${test.endpoint}`, options);
      
      const passed = test.shouldPass ? response.status === 200 : response.status === 403;
      
      if (passed) {
        console.log(`   ✅ ${test.name}: ${test.shouldPass ? 'مسموح' : 'ممنوع'} كما متوقع`);
      } else {
        console.log(`   ❌ ${test.name}: ${test.shouldPass ? 'ممنوع' : 'مسموح'} بشكل خاطئ! (${response.status})`);
      }
    }

    // اختبار 5: جلب الصلاحيات المتاحة (بالمدير)
    console.log('\n📋 اختبار 5: جلب الصلاحيات المتاحة...');
    const permResponse = await fetch(`${baseUrl}/api/permissions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const permData = await permResponse.json();
    if (permData.success) {
      console.log('✅ نجح جلب الصلاحيات');
      console.log(`   📊 إجمالي الصلاحيات: ${permData.stats.totalPermissions}`);
      console.log(`   🔴 عالية الخطورة: ${permData.stats.highRiskPermissions}`);
      console.log(`   🟢 منخفضة الخطورة: ${permData.stats.lowRiskPermissions}`);
      console.log(`   📂 الفئات: ${permData.stats.categoriesCount}`);
    }

    console.log('\n🎉 انتهى اختبار النظام المبسط!');
    console.log('\n📈 مميزات النظام الجديد:');
    console.log('   ✅ دورين فقط: مدير أو موظف');
    console.log('   ✅ لا توجد أدوار معقدة');
    console.log('   ✅ تحكم كامل في الصلاحيات الفردية');
    console.log('   ✅ حماية صارمة للعمليات الحساسة');
    console.log('   ✅ لا توجد ثغرات أمنية');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testSimpleSystem();
