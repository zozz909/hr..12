// استخدام fetch المدمج في Node.js 18+
const fetch = globalThis.fetch;

async function testPermissions() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🧪 اختبار نظام الصلاحيات...\n');

  try {
    // تسجيل الدخول بالمستخدم التجريبي
    console.log('🔐 تسجيل الدخول بالمستخدم التجريبي...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@company.com',
        password: 'test123'
      }),
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.log('❌ فشل تسجيل الدخول:', loginData.error);
      return;
    }

    console.log('✅ نجح تسجيل الدخول');
    console.log(`   👤 اسم المستخدم: ${loginData.user.name}`);
    console.log(`   🎭 الدور: ${loginData.user.role}`);
    console.log(`   📋 الصلاحيات: ${loginData.user.permissions.join(', ')}`);
    
    const token = loginData.token;
    console.log('\n');

    // اختبار 1: مشاهدة الموظفين (يجب أن ينجح)
    console.log('📋 اختبار 1: مشاهدة الموظفين (يجب أن ينجح)...');
    const viewResponse = await fetch(`${baseUrl}/api/employees`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const viewData = await viewResponse.json();
    if (viewData.success) {
      console.log('✅ نجح: يمكن مشاهدة الموظفين');
    } else {
      console.log('❌ فشل:', viewData.error);
    }

    // اختبار 2: إضافة موظف (يجب أن يفشل)
    console.log('\n📝 اختبار 2: إضافة موظف (يجب أن يفشل)...');
    const addResponse = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'موظف تجريبي',
        email: 'test-employee@company.com',
        phone: '1234567890',
        position: 'موظف',
        salary: 5000,
        institutionId: 'inst-001'
      }),
    });
    
    const addData = await addResponse.json();
    if (!addData.success && addResponse.status === 403) {
      console.log('✅ نجح الاختبار: تم منع إضافة الموظف');
      console.log(`   📝 الرسالة: ${addData.error}`);
    } else {
      console.log('❌ فشل الاختبار: تم السماح بإضافة الموظف!');
    }

    // اختبار 3: تعديل موظف (يجب أن يفشل)
    console.log('\n✏️ اختبار 3: تعديل موظف (يجب أن يفشل)...');
    const editResponse = await fetch(`${baseUrl}/api/employees/emp-001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'اسم محدث',
        salary: 6000
      }),
    });
    
    const editData = await editResponse.json();
    if (!editData.success && editResponse.status === 403) {
      console.log('✅ نجح الاختبار: تم منع تعديل الموظف');
      console.log(`   📝 الرسالة: ${editData.error}`);
    } else {
      console.log('❌ فشل الاختبار: تم السماح بتعديل الموظف!');
    }

    // اختبار 4: حذف موظف (يجب أن يفشل)
    console.log('\n🗑️ اختبار 4: حذف موظف (يجب أن يفشل)...');
    const deleteResponse = await fetch(`${baseUrl}/api/employees/emp-001`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const deleteData = await deleteResponse.json();
    if (!deleteData.success && deleteResponse.status === 403) {
      console.log('✅ نجح الاختبار: تم منع حذف الموظف');
      console.log(`   📝 الرسالة: ${deleteData.error}`);
    } else {
      console.log('❌ فشل الاختبار: تم السماح بحذف الموظف!');
    }

    console.log('\n🏁 انتهى اختبار الصلاحيات');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testPermissions();
