// استخدام fetch المدمج في Node.js 18+
const fetch = globalThis.fetch;

async function testEnhancedPermissions() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🚀 اختبار نظام الصلاحيات المحسن...\n');

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
    console.log(`   📋 عدد الصلاحيات: ${adminData.user.permissions.length}`);
    
    const adminToken = adminData.token;

    // اختبار 2: جلب الصلاحيات الجديدة
    console.log('\n📋 اختبار 2: جلب الصلاحيات المحسنة...');
    const permissionsResponse = await fetch(`${baseUrl}/api/permissions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const permissionsData = await permissionsResponse.json();
    if (permissionsData.success) {
      console.log('✅ نجح جلب الصلاحيات');
      console.log(`   📊 إجمالي الصلاحيات: ${permissionsData.stats.totalPermissions}`);
      console.log(`   🟢 أساسية: ${permissionsData.stats.basicPermissions}`);
      console.log(`   🟡 متقدمة: ${permissionsData.stats.advancedPermissions}`);
      console.log(`   🔴 إدارية: ${permissionsData.stats.adminPermissions}`);
      console.log(`   📂 الفئات: ${permissionsData.categories.length}`);
    } else {
      console.log('❌ فشل جلب الصلاحيات:', permissionsData.error);
    }

    // اختبار 3: التحقق من صحة مجموعة صلاحيات
    console.log('\n🔍 اختبار 3: التحقق من صحة مجموعة صلاحيات...');
    const testPermissions = [
      'employees.edit', // يتطلب employees.view_details
      'payroll.approve' // يتطلب payroll.edit, payroll.calculate, payroll.view
    ];

    const validateResponse = await fetch(`${baseUrl}/api/permissions/validate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ permissions: testPermissions })
    });
    
    const validateData = await validateResponse.json();
    if (validateData.success) {
      console.log('✅ نجح التحقق من الصلاحيات');
      console.log(`   📊 الصلاحيات الأصلية: ${validateData.validation.originalCount}`);
      console.log(`   ✨ بعد التحسين: ${validateData.validation.optimizedCount}`);
      console.log(`   ➕ تبعيات مضافة: ${validateData.validation.addedDependencies.join(', ')}`);
      
      if (validateData.validation.errors.length > 0) {
        console.log(`   ❌ أخطاء: ${validateData.validation.errors.join(', ')}`);
      }
      
      if (validateData.validation.warnings.length > 0) {
        console.log(`   ⚠️ تحذيرات: ${validateData.validation.warnings.join(', ')}`);
      }
    }

    // اختبار 4: اقتراح صلاحيات للدور
    console.log('\n💡 اختبار 4: اقتراح صلاحيات لدور المشرف...');
    const suggestResponse = await fetch(`${baseUrl}/api/permissions/suggest`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ 
        role: 'supervisor',
        currentPermissions: ['employees.view'],
        level: 'advanced'
      })
    });
    
    const suggestData = await suggestResponse.json();
    if (suggestData.success) {
      console.log('✅ نجح اقتراح الصلاحيات');
      console.log(`   🎯 للدور: ${suggestData.suggestions.forRole.length} صلاحية`);
      console.log(`   📈 موصى بها: ${suggestData.suggestions.smart.recommended.length} صلاحية`);
      console.log(`   ⬆️ ترقيات: ${suggestData.suggestions.smart.upgrade.length} صلاحية`);
      console.log(`   ⚠️ حساسة: ${suggestData.suggestions.smart.critical.length} صلاحية`);
    }

    // اختبار 5: تسجيل الدخول بمستخدم محدود الصلاحيات
    console.log('\n🔒 اختبار 5: تسجيل الدخول بمستخدم محدود...');
    const userLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@company.com',
        password: 'test123'
      }),
    });

    const userData = await userLogin.json();
    if (userData.success) {
      console.log('✅ نجح تسجيل دخول المستخدم المحدود');
      console.log(`   📋 الصلاحيات: ${userData.user.permissions.join(', ')}`);
      
      const userToken = userData.token;

      // اختبار محاولة الوصول للصلاحيات
      console.log('\n🧪 اختبار الوصول للصلاحيات...');
      
      // محاولة عرض الصلاحيات (يجب أن تفشل)
      const accessTest = await fetch(`${baseUrl}/api/permissions`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      
      if (accessTest.status === 403) {
        console.log('✅ نجح: تم منع الوصول للصلاحيات');
      } else {
        console.log('❌ فشل: تم السماح بالوصول للصلاحيات!');
      }

      // محاولة عرض الموظفين (يجب أن تنجح)
      const employeesTest = await fetch(`${baseUrl}/api/employees`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      
      if (employeesTest.status === 200) {
        console.log('✅ نجح: يمكن عرض الموظفين');
      } else {
        console.log('❌ فشل: لا يمكن عرض الموظفين');
      }
    }

    console.log('\n🎉 انتهى اختبار النظام المحسن!');
    console.log('\n📈 تحسينات النظام الجديد:');
    console.log('   ✅ صلاحيات هرمية مع تبعيات');
    console.log('   ✅ فئات منطقية ومنظمة');
    console.log('   ✅ مستويات أمان (أساسي، متقدم، إداري)');
    console.log('   ✅ التحقق التلقائي من التبعيات');
    console.log('   ✅ اقتراحات ذكية للصلاحيات');
    console.log('   ✅ حماية الصلاحيات الحساسة');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testEnhancedPermissions();
