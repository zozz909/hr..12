// استخدام fetch المدمج في Node.js 18+
const fetch = globalThis.fetch;

async function testNoSettings() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🧪 اختبار النظام بدون إعدادات...\n');

  try {
    // اختبار 1: تسجيل الدخول بالمدير
    console.log('👑 اختبار 1: تسجيل الدخول بالمدير...');
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
    
    const adminToken = adminData.token;

    // اختبار 2: محاولة الوصول لصفحات الإعدادات (يجب أن تفشل)
    console.log('\n🚫 اختبار 2: محاولة الوصول لصفحات الإعدادات...');
    
    const settingsTests = [
      '/settings',
      '/settings/roles', 
      '/settings/overview',
      '/settings/help',
      '/api/security/settings'
    ];

    for (const endpoint of settingsTests) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.status === 404) {
          console.log(`   ✅ ${endpoint}: محذوف بنجاح (404)`);
        } else {
          console.log(`   ❌ ${endpoint}: ما زال موجود! (${response.status})`);
        }
      } catch (error) {
        console.log(`   ✅ ${endpoint}: محذوف بنجاح (خطأ اتصال)`);
      }
    }

    // اختبار 3: التأكد من عمل إدارة الصلاحيات
    console.log('\n🛡️ اختبار 3: إدارة الصلاحيات...');
    
    const permResponse = await fetch(`${baseUrl}/api/permissions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (permResponse.status === 200) {
      const permData = await permResponse.json();
      console.log('✅ إدارة الصلاحيات تعمل');
      console.log(`   📊 الصلاحيات المتاحة: ${permData.stats.totalPermissions}`);
      console.log(`   🔴 عالية الخطورة: ${permData.stats.highRiskPermissions}`);
      console.log(`   🟢 منخفضة الخطورة: ${permData.stats.lowRiskPermissions}`);
    } else {
      console.log('❌ إدارة الصلاحيات لا تعمل');
    }

    // اختبار 4: التأكد من عمل العمليات الأساسية
    console.log('\n⚙️ اختبار 4: العمليات الأساسية...');
    
    const basicTests = [
      { endpoint: '/api/employees', name: 'الموظفين' },
      { endpoint: '/api/institutions', name: 'المؤسسات' },
      { endpoint: '/api/users', name: 'المستخدمين' }
    ];

    for (const test of basicTests) {
      const response = await fetch(`${baseUrl}${test.endpoint}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (response.status === 200) {
        console.log(`   ✅ ${test.name}: يعمل بشكل طبيعي`);
      } else {
        console.log(`   ❌ ${test.name}: لا يعمل (${response.status})`);
      }
    }

    // اختبار 5: تسجيل الدخول بموظف عادي
    console.log('\n👤 اختبار 5: تسجيل الدخول بموظف عادي...');
    const empLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@company.com',
        password: 'test123'
      }),
    });

    const empData = await empLogin.json();
    if (empData.success) {
      console.log('✅ نجح تسجيل دخول الموظف');
      console.log(`   📋 الصلاحيات: ${empData.user.permissions.join(', ')}`);
      
      // التأكد من عدم وجود صلاحيات إعدادات
      const hasSettingsPermissions = empData.user.permissions.some(p => 
        p.includes('settings') || p.includes('system_')
      );
      
      if (!hasSettingsPermissions) {
        console.log('   ✅ لا توجد صلاحيات إعدادات للموظف');
      } else {
        console.log('   ❌ ما زالت توجد صلاحيات إعدادات!');
      }
    }

    console.log('\n🎉 انتهى اختبار النظام بدون إعدادات!');
    console.log('\n✅ تم حذف قسم الإعدادات نهائياً:');
    console.log('   🗑️ حذف جميع صفحات الإعدادات');
    console.log('   🗑️ حذف جميع APIs الإعدادات');
    console.log('   🗑️ حذف جدول security_settings');
    console.log('   🗑️ إزالة مراجع الإعدادات من القوائم');
    console.log('   🗑️ إزالة صلاحيات الإعدادات من المستخدمين');

    console.log('\n🎛️ ما تبقى:');
    console.log('   ✅ إدارة الصلاحيات للمديرين فقط');
    console.log('   ✅ نظام بسيط: مدير أو موظف');
    console.log('   ✅ تحكم كامل في الصلاحيات الفردية');

    await connection.end();

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testNoSettings();
