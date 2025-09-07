const axios = require('axios');

async function testLogin() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🔄 اختبار تسجيل الدخول...');
  
  // اختبار المستخدمين الافتراضيين
  const testUsers = [
    { email: 'admin@company.com', password: 'admin123', name: 'أحمد محمد (مدير النظام)' },
    { email: 'hr@company.com', password: 'hr123', name: 'فاطمة علي (مدير الموارد البشرية)' },
    { email: 'employee@company.com', password: 'emp123', name: 'محمد سالم (موظف)' }
  ];

  for (const user of testUsers) {
    try {
      console.log(`\n🔐 اختبار تسجيل الدخول لـ: ${user.name}`);
      console.log(`   البريد الإلكتروني: ${user.email}`);
      
      const response = await axios.post(`${baseUrl}/api/auth/login`, {
        email: user.email,
        password: user.password,
        rememberMe: false
      });

      const data = response.data;
      
      if (response.status === 200 && data.success) {
        console.log(`   ✅ نجح تسجيل الدخول`);
        console.log(`   👤 اسم المستخدم: ${data.user.name}`);
        console.log(`   🎭 الدور: ${data.user.role}`);
        console.log(`   📊 عدد الصلاحيات: ${data.user.permissions?.length || 0}`);

        // اختبار جلب إعدادات الأمان
        try {
          const settingsResponse = await axios.get(`${baseUrl}/api/security/settings`, {
            headers: {
              'Authorization': `Bearer ${data.token}`,
            },
          });

          if (settingsResponse.status === 200) {
            console.log(`   🔒 تم جلب إعدادات الأمان بنجاح`);
          }
        } catch (settingsError) {
          console.log(`   ❌ فشل في جلب إعدادات الأمان: ${settingsError.response?.status || settingsError.message}`);
        }

      } else {
        console.log(`   ❌ فشل تسجيل الدخول`);
        console.log(`   📄 الاستجابة: ${response.status}`);
        console.log(`   💬 الرسالة: ${data.error || data.message || 'غير محدد'}`);
      }
      
    } catch (error) {
      console.log(`   ❌ خطأ في الشبكة أو الخادم`);
      console.log(`   📝 تفاصيل الخطأ: ${error.message}`);

      if (error.response) {
        console.log(`   📄 كود الاستجابة: ${error.response.status}`);
        console.log(`   💬 رسالة الخطأ: ${error.response.data?.error || 'غير محدد'}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   💡 تأكد من تشغيل التطبيق على ${baseUrl}`);
      }
    }
  }

  // اختبار حالة خاطئة
  console.log(`\n🚫 اختبار بيانات خاطئة:`);
  try {
    const response = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'wrong@email.com',
      password: 'wrongpassword'
    });

    console.log(`   📄 الاستجابة: ${response.status}`);
    console.log(`   💬 الرسالة: ${response.data.error}`);

  } catch (error) {
    if (error.response) {
      console.log(`   📄 الاستجابة: ${error.response.status}`);
      console.log(`   💬 الرسالة: ${error.response.data.error}`);
    } else {
      console.log(`   ❌ خطأ: ${error.message}`);
    }
  }

  console.log('\n🏁 انتهى الاختبار');
}

// تشغيل الاختبار
if (require.main === module) {
  testLogin();
}

module.exports = { testLogin };
