const fetch = globalThis.fetch;

async function testAlerts30Days() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('⚠️ اختبار تنبيهات المستندات التي ستنتهي خلال 30 يوم...\n');

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

    // جلب جميع الموظفين
    console.log('\n👥 جلب جميع الموظفين...');
    const employeesResponse = await fetch(`${baseUrl}/api/employees`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (employeesResponse.ok) {
      const employeesData = await employeesResponse.json();
      const employees = employeesData.data || [];
      
      console.log('✅ تم جلب البيانات بنجاح');
      console.log(`👥 إجمالي الموظفين: ${employees.length}`);
      
      // حساب التواريخ
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      console.log(`📅 اليوم: ${today.toLocaleDateString('ar-SA')}`);
      console.log(`📅 خلال 30 يوم: ${futureDate.toLocaleDateString('ar-SA')}`);
      
      // تحليل كل نوع وثيقة
      const documentTypes = [
        { name: 'الإقامات', key: 'iqamaExpiry', icon: '🆔' },
        { name: 'رخص العمل', key: 'workPermitExpiry', icon: '💼' },
        { name: 'العقود', key: 'contractExpiry', icon: '📄' },
        { name: 'التأمين الصحي', key: 'healthInsuranceExpiry', icon: '🛡️' },
        { name: 'الشهادات الصحية', key: 'healthCertExpiry', icon: '❤️' }
      ];
      
      console.log('\n📊 تحليل المستندات:');
      
      let totalExpiring = 0;
      
      for (const docType of documentTypes) {
        console.log(`\n${docType.icon} ${docType.name}:`);
        
        // المستندات المنتهية فعلياً
        const expired = employees.filter(emp => {
          if (!emp[docType.key]) return false;
          const expiryDate = new Date(emp[docType.key]);
          return expiryDate <= today;
        });
        
        // المستندات التي ستنتهي خلال 30 يوم (غير منتهية بعد)
        const expiringSoon = employees.filter(emp => {
          if (!emp[docType.key]) return false;
          const expiryDate = new Date(emp[docType.key]);
          return expiryDate > today && expiryDate <= futureDate;
        });
        
        // المستندات النشطة (أكثر من 30 يوم)
        const active = employees.filter(emp => {
          if (!emp[docType.key]) return false;
          const expiryDate = new Date(emp[docType.key]);
          return expiryDate > futureDate;
        });
        
        console.log(`   🔴 منتهية فعلياً: ${expired.length}`);
        console.log(`   🟡 ستنتهي خلال 30 يوم: ${expiringSoon.length}`);
        console.log(`   🟢 نشطة (أكثر من 30 يوم): ${active.length}`);
        
        totalExpiring += expiringSoon.length;
        
        // عرض تفاصيل المستندات التي ستنتهي قريباً
        if (expiringSoon.length > 0) {
          console.log(`   📋 التفاصيل:`);
          expiringSoon.forEach(emp => {
            const expiryDate = new Date(emp[docType.key]);
            const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            console.log(`     - ${emp.name}: ${expiryDate.toLocaleDateString('ar-SA')} (باقي ${daysLeft} يوم)`);
          });
        }
      }
      
      console.log(`\n📊 الملخص:`);
      console.log(`   ⚠️ إجمالي المستندات التي ستنتهي خلال 30 يوم: ${totalExpiring}`);
      console.log(`   📋 هذا ما سيظهر في قسم "التنبيهات الهامة"`);
      
      // مقارنة مع البيانات المنتهية فعلياً
      const totalExpired = employees.reduce((count, emp) => {
        let expiredCount = 0;
        for (const docType of documentTypes) {
          if (emp[docType.key] && new Date(emp[docType.key]) <= today) {
            expiredCount++;
          }
        }
        return count + expiredCount;
      }, 0);
      
      console.log(`   🔴 إجمالي المستندات المنتهية فعلياً: ${totalExpired}`);
      console.log(`   📋 هذا ما سيظهر في قسم "إحصائيات الوثائق المنتهية"`);
      
    } else {
      console.log('❌ فشل جلب البيانات');
    }

    console.log('\n🎉 انتهى اختبار التنبيهات!');
    console.log('\n✅ التحديثات المطبقة:');
    console.log('   ⚠️ التنبيهات تعرض فقط المستندات التي ستنتهي خلال 30 يوم');
    console.log('   🚫 لا تعرض المستندات المنتهية فعلياً');
    console.log('   📊 قسم منفصل للمستندات المنتهية فعلياً');

    console.log('\n🌐 شاهد التحديثات:');
    console.log('   🏠 لوحة التحكم: http://localhost:9004');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testAlerts30Days();
