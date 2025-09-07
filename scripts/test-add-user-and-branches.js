// استخدام fetch المدمج في Node.js 18+
const fetch = globalThis.fetch;

async function testAddUserAndBranches() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🧪 اختبار إضافة المستخدم وصلاحيات الفروع...\n');

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

    // اختبار 2: جلب الصلاحيات والتأكد من وجود صلاحيات الفروع
    console.log('\n📋 اختبار 2: التحقق من صلاحيات الفروع...');
    const permResponse = await fetch(`${baseUrl}/api/permissions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const permData = await permResponse.json();
    if (permData.success) {
      const branchPermissions = permData.permissions.filter(p => p.category === 'branches');
      console.log('✅ صلاحيات الفروع متاحة');
      console.log(`   📊 عدد صلاحيات الفروع: ${branchPermissions.length}`);
      branchPermissions.forEach(p => {
        console.log(`   🏢 ${p.name}: ${p.description} ${p.isHigh ? '⚠️' : '✅'}`);
      });
      
      console.log(`\n📊 إجمالي الصلاحيات: ${permData.stats.totalPermissions}`);
      console.log(`   🔴 عالية الخطورة: ${permData.stats.highRiskPermissions}`);
      console.log(`   🟢 منخفضة الخطورة: ${permData.stats.lowRiskPermissions}`);
    }

    // اختبار 3: إضافة مستخدم جديد
    console.log('\n👤 اختبار 3: إضافة مستخدم جديد...');
    const newUserData = {
      name: 'مستخدم تجريبي جديد',
      email: 'newuser@company.com',
      password: 'newuser123',
      role: 'employee',
      permissions: [
        'employees_view',
        'institutions_view', 
        'branches_view',
        'branches_add', // صلاحية فروع متقدمة
        'leaves_view',
        'reports_view'
      ]
    };

    const addUserResponse = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(newUserData)
    });

    const addUserResult = await addUserResponse.json();
    if (addUserResult.success) {
      console.log('✅ تم إضافة المستخدم الجديد بنجاح');
      console.log(`   👤 الاسم: ${addUserResult.user.name}`);
      console.log(`   📧 البريد: ${addUserResult.user.email}`);
      console.log(`   🎭 الدور: ${addUserResult.user.role}`);
      console.log(`   📋 الصلاحيات: ${addUserResult.user.permissions.length} صلاحية`);
      
      // اختبار تسجيل الدخول بالمستخدم الجديد
      console.log('\n🔐 اختبار تسجيل الدخول بالمستخدم الجديد...');
      const newUserLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@company.com',
          password: 'newuser123'
        }),
      });

      const newUserLoginData = await newUserLogin.json();
      if (newUserLoginData.success) {
        console.log('✅ نجح تسجيل دخول المستخدم الجديد');
        console.log(`   📋 الصلاحيات: ${newUserLoginData.user.permissions.join(', ')}`);
        
        // التحقق من وجود صلاحيات الفروع
        const hasBranchPermissions = newUserLoginData.user.permissions.some(p => p.includes('branches'));
        if (hasBranchPermissions) {
          console.log('   ✅ يمتلك صلاحيات الفروع');
        } else {
          console.log('   ❌ لا يمتلك صلاحيات الفروع');
        }
      }
    } else {
      console.log('❌ فشل إضافة المستخدم:', addUserResult.error);
    }

    // اختبار 4: اختبار صلاحيات الفروع
    console.log('\n🏢 اختبار 4: اختبار صلاحيات الفروع...');
    
    // محاولة الوصول لـ API الفروع
    const branchesResponse = await fetch(`${baseUrl}/api/branches`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (branchesResponse.status === 200) {
      console.log('✅ API الفروع يعمل بشكل طبيعي');
    } else {
      console.log(`⚠️ API الفروع يحتاج تحديث (${branchesResponse.status})`);
    }

    // اختبار 5: عرض ملخص النظام المحدث
    console.log('\n📊 اختبار 5: ملخص النظام المحدث...');
    
    const usersResponse = await fetch(`${baseUrl}/api/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (usersResponse.status === 200) {
      const usersData = await usersResponse.json();
      console.log('✅ نجح جلب المستخدمين');
      console.log(`   👥 إجمالي المستخدمين: ${usersData.users.length}`);
      
      const adminCount = usersData.users.filter(u => u.role === 'admin').length;
      const employeeCount = usersData.users.filter(u => u.role === 'employee').length;
      
      console.log(`   👑 المديرين: ${adminCount}`);
      console.log(`   👤 الموظفين: ${employeeCount}`);
    }

    console.log('\n🎉 انتهى اختبار النظام المحدث!');
    console.log('\n✅ التحديثات الجديدة:');
    console.log('   ➕ إضافة صلاحيات الفروع (4 صلاحيات)');
    console.log('   ➕ إمكانية إضافة مستخدمين جدد');
    console.log('   ✅ نظام بسيط ومرن');
    console.log('   ✅ تحكم كامل في الصلاحيات');

    console.log('\n🔑 بيانات تسجيل الدخول:');
    console.log('   👑 مدير النظام: admin@company.com / admin123');
    console.log('   👤 موظف تجريبي: test@company.com / test123');
    console.log('   👤 مستخدم جديد: newuser@company.com / newuser123');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testAddUserAndBranches();
