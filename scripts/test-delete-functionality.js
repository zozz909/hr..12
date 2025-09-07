// استخدام fetch المدمج في Node.js 18+
const fetch = globalThis.fetch;

async function testDeleteFunctionality() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🧪 اختبار وظيفة حذف المستخدمين...\n');

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
    const adminToken = adminData.token;

    // اختبار 2: إضافة مستخدم للحذف
    console.log('\n➕ اختبار 2: إضافة مستخدم للحذف...');
    const testUserData = {
      name: 'مستخدم للحذف',
      email: 'delete.test@company.com',
      password: 'delete123',
      role: 'employee',
      permissions: ['employees_view', 'branches_view']
    };

    const addResponse = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(testUserData)
    });

    const addResult = await addResponse.json();
    let testUserId = null;
    
    if (addResult.success) {
      testUserId = addResult.user.id;
      console.log('✅ تم إضافة مستخدم للاختبار');
      console.log(`   👤 المعرف: ${testUserId}`);
      console.log(`   📧 البريد: ${addResult.user.email}`);
    } else {
      console.log('❌ فشل إضافة المستخدم:', addResult.error);
      return;
    }

    // اختبار 3: حذف المستخدم التجريبي
    console.log('\n🗑️ اختبار 3: حذف المستخدم التجريبي...');
    const deleteResponse = await fetch(`${baseUrl}/api/users`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ id: testUserId })
    });

    const deleteResult = await deleteResponse.json();
    if (deleteResult.success) {
      console.log('✅ تم حذف المستخدم بنجاح');
    } else {
      console.log('❌ فشل حذف المستخدم:', deleteResult.error);
    }

    // اختبار 4: التحقق من عدم إمكانية تسجيل الدخول بالمستخدم المحذوف
    console.log('\n🔐 اختبار 4: محاولة تسجيل الدخول بالمستخدم المحذوف...');
    const deletedUserLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'delete.test@company.com',
        password: 'delete123'
      }),
    });

    const deletedLoginResult = await deletedUserLogin.json();
    if (!deletedLoginResult.success) {
      console.log('✅ لا يمكن تسجيل الدخول بالمستخدم المحذوف (كما متوقع)');
    } else {
      console.log('❌ يمكن تسجيل الدخول بالمستخدم المحذوف! (خطأ)');
    }

    // اختبار 5: عرض المستخدمين النهائي
    console.log('\n👥 اختبار 5: عرض المستخدمين النهائي...');
    const finalUsersResponse = await fetch(`${baseUrl}/api/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const finalUsersData = await finalUsersResponse.json();
    if (finalUsersData.success) {
      console.log('✅ قائمة المستخدمين النهائية:');
      
      finalUsersData.users.forEach(user => {
        console.log(`   ${user.role === 'admin' ? '👑' : '👤'} ${user.name} (${user.email}) - ${user.role}`);
      });
      
      const adminCount = finalUsersData.users.filter(u => u.role === 'admin').length;
      const employeeCount = finalUsersData.users.filter(u => u.role === 'employee').length;
      
      console.log(`\n📊 الإحصائيات:`);
      console.log(`   👑 المديرين: ${adminCount}`);
      console.log(`   👤 الموظفين: ${employeeCount}`);
      console.log(`   👥 الإجمالي: ${finalUsersData.users.length}`);
    }

    console.log('\n🎉 انتهى اختبار وظيفة الحذف!');
    console.log('\n✅ الميزات المتاحة:');
    console.log('   ➕ إضافة مستخدمين جدد');
    console.log('   🗑️ حذف المستخدمين');
    console.log('   🛡️ حماية من حذف المدير الوحيد');
    console.log('   🏢 صلاحيات الفروع (4 صلاحيات)');
    console.log('   🔒 نظام أمان محكم');

    console.log('\n🌐 جرب النظام الآن:');
    console.log('   🏠 النظام: http://localhost:9004');
    console.log('   🛡️ إدارة الصلاحيات: http://localhost:9004/admin/permissions');
    console.log('   🔑 مدير النظام: admin@company.com / admin123');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testDeleteFunctionality();
