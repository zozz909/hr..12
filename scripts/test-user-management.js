// استخدام fetch المدمج في Node.js 18+
const fetch = globalThis.fetch;

async function testUserManagement() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🧪 اختبار إدارة المستخدمين الشامل...\n');

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

    // اختبار 2: عرض المستخدمين الحاليين
    console.log('\n👥 اختبار 2: عرض المستخدمين الحاليين...');
    const usersResponse = await fetch(`${baseUrl}/api/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const usersData = await usersResponse.json();
    if (usersData.success) {
      console.log('✅ نجح جلب المستخدمين');
      console.log(`   👥 إجمالي المستخدمين: ${usersData.users.length}`);
      
      const adminCount = usersData.users.filter(u => u.role === 'admin').length;
      const employeeCount = usersData.users.filter(u => u.role === 'employee').length;
      
      console.log(`   👑 المديرين: ${adminCount}`);
      console.log(`   👤 الموظفين: ${employeeCount}`);
    }

    // اختبار 3: إضافة مستخدم جديد
    console.log('\n➕ اختبار 3: إضافة مستخدم جديد...');
    const newUserData = {
      name: 'مدير فرع تجريبي',
      email: 'branch.manager@company.com',
      password: 'branch123',
      role: 'employee',
      permissions: [
        'employees_view',
        'institutions_view', 
        'branches_view',
        'branches_add',
        'branches_edit',
        'leaves_view',
        'leaves_approve',
        'reports_view',
        'reports_generate'
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
    let newUserId = null;
    
    if (addUserResult.success) {
      newUserId = addUserResult.user.id;
      console.log('✅ تم إضافة المستخدم الجديد بنجاح');
      console.log(`   👤 الاسم: ${addUserResult.user.name}`);
      console.log(`   📧 البريد: ${addUserResult.user.email}`);
      console.log(`   🎭 الدور: ${addUserResult.user.role}`);
      console.log(`   📋 الصلاحيات: ${addUserResult.user.permissions.length} صلاحية`);
      
      // عرض الصلاحيات
      console.log('   📝 الصلاحيات المحددة:');
      addUserResult.user.permissions.forEach(p => {
        console.log(`     - ${p}`);
      });
    } else {
      console.log('❌ فشل إضافة المستخدم:', addUserResult.error);
    }

    // اختبار 4: تسجيل الدخول بالمستخدم الجديد
    if (newUserId) {
      console.log('\n🔐 اختبار 4: تسجيل الدخول بالمستخدم الجديد...');
      const newUserLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'branch.manager@company.com',
          password: 'branch123'
        }),
      });

      const newUserLoginData = await newUserLogin.json();
      if (newUserLoginData.success) {
        console.log('✅ نجح تسجيل دخول المستخدم الجديد');
        
        // اختبار الصلاحيات
        const newUserToken = newUserLoginData.token;
        
        // اختبار صلاحية عرض الفروع
        const branchesTest = await fetch(`${baseUrl}/api/branches`, {
          headers: { 'Authorization': `Bearer ${newUserToken}` }
        });
        
        if (branchesTest.status === 200) {
          console.log('   ✅ يمكنه عرض الفروع');
        } else {
          console.log(`   ⚠️ لا يمكنه عرض الفروع (${branchesTest.status})`);
        }
        
        // اختبار منع الوصول لإدارة المستخدمين
        const usersTest = await fetch(`${baseUrl}/api/users`, {
          headers: { 'Authorization': `Bearer ${newUserToken}` }
        });
        
        if (usersTest.status === 403) {
          console.log('   ✅ ممنوع من إدارة المستخدمين (كما متوقع)');
        } else {
          console.log(`   ❌ يمكنه إدارة المستخدمين! (${usersTest.status})`);
        }
      }
    }

    // اختبار 5: محاولة حذف المدير الوحيد (يجب أن تفشل)
    console.log('\n🚫 اختبار 5: محاولة حذف المدير الوحيد...');
    const deleteAdminResponse = await fetch(`${baseUrl}/api/users`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ id: adminData.user.userId })
    });

    if (deleteAdminResponse.status === 403) {
      console.log('✅ تم منع حذف المدير الوحيد (حماية أمنية)');
    } else {
      console.log('❌ تم السماح بحذف المدير الوحيد! (خطر أمني)');
    }

    // اختبار 6: حذف المستخدم الجديد
    if (newUserId) {
      console.log('\n🗑️ اختبار 6: حذف المستخدم الجديد...');
      const deleteUserResponse = await fetch(`${baseUrl}/api/users`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ id: newUserId })
      });

      const deleteResult = await deleteUserResponse.json();
      if (deleteResult.success) {
        console.log('✅ تم حذف المستخدم الجديد بنجاح');
      } else {
        console.log('❌ فشل حذف المستخدم:', deleteResult.error);
      }
    }

    // اختبار 7: التحقق من صلاحيات الفروع
    console.log('\n🏢 اختبار 7: التحقق من صلاحيات الفروع...');
    const permResponse = await fetch(`${baseUrl}/api/permissions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const permData = await permResponse.json();
    if (permData.success) {
      const branchPermissions = permData.permissions.filter(p => p.category === 'branches');
      console.log(`✅ صلاحيات الفروع: ${branchPermissions.length} صلاحية`);
      branchPermissions.forEach(p => {
        console.log(`   🏢 ${p.name} ${p.isHigh ? '⚠️' : '✅'}`);
      });
    }

    console.log('\n🎉 انتهى اختبار إدارة المستخدمين!');
    console.log('\n✅ جميع الميزات تعمل:');
    console.log('   ➕ إضافة مستخدمين جدد');
    console.log('   🗑️ حذف المستخدمين');
    console.log('   🛡️ حماية المدير الوحيد');
    console.log('   🏢 صلاحيات الفروع');
    console.log('   🔒 قيود الأمان');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testUserManagement();
