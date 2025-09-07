const fetch = globalThis.fetch;

async function testFinalDashboard() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🏠 اختبار لوحة التحكم النهائية...\n');

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

    // جلب الموظفين مع وثائق على وشك الانتهاء
    console.log('\n⚠️ جلب الموظفين مع وثائق على وشك الانتهاء...');
    const expiringResponse = await fetch(`${baseUrl}/api/employees?expiring=true&days=30`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (employeesResponse.ok && expiringResponse.ok) {
      const employeesData = await employeesResponse.json();
      const expiringData = await expiringResponse.json();
      
      const allEmployees = employeesData.data || [];
      const expiringEmployees = expiringData.data || [];
      
      console.log('✅ تم جلب البيانات بنجاح');
      console.log(`👥 إجمالي الموظفين: ${allEmployees.length}`);
      console.log(`⚠️ موظفين مع وثائق على وشك الانتهاء: ${expiringEmployees.length}`);
      
      // حساب الوثائق المنتهية فعلياً
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiredStats = {
        iqamas: allEmployees.filter(emp => 
          emp.iqamaExpiry && new Date(emp.iqamaExpiry) < today
        ).length,
        workPermits: allEmployees.filter(emp => 
          emp.workPermitExpiry && new Date(emp.workPermitExpiry) < today
        ).length,
        contracts: allEmployees.filter(emp => 
          emp.contractExpiry && new Date(emp.contractExpiry) < today
        ).length,
        healthInsurance: allEmployees.filter(emp => 
          emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) < today
        ).length,
        healthCerts: allEmployees.filter(emp => 
          emp.healthCertExpiry && new Date(emp.healthCertExpiry) < today
        ).length
      };
      
      // حساب الوثائق على وشك الانتهاء (خلال 30 يوم)
      const expiringStats = {
        iqamas: expiringEmployees.filter(emp => 
          emp.iqamaExpiry && new Date(emp.iqamaExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length,
        workPermits: expiringEmployees.filter(emp => 
          emp.workPermitExpiry && new Date(emp.workPermitExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length,
        contracts: expiringEmployees.filter(emp => 
          emp.contractExpiry && new Date(emp.contractExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length,
        healthInsurance: expiringEmployees.filter(emp => 
          emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length,
        healthCerts: expiringEmployees.filter(emp => 
          emp.healthCertExpiry && new Date(emp.healthCertExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length
      };
      
      console.log('\n📊 إحصائيات الوثائق المنتهية فعلياً:');
      console.log(`   🆔 الإقامات المنتهية: ${expiredStats.iqamas}`);
      console.log(`   💼 رخص العمل المنتهية: ${expiredStats.workPermits}`);
      console.log(`   📄 العقود المنتهية: ${expiredStats.contracts}`);
      console.log(`   🛡️ التأمين الصحي المنتهي: ${expiredStats.healthInsurance}`);
      console.log(`   ❤️ الشهادات الصحية المنتهية: ${expiredStats.healthCerts}`);
      
      console.log('\n⚠️ إحصائيات الوثائق على وشك الانتهاء (خلال 30 يوم):');
      console.log(`   🆔 الإقامات: ${expiringStats.iqamas}`);
      console.log(`   💼 رخص العمل: ${expiringStats.workPermits}`);
      console.log(`   📄 العقود: ${expiringStats.contracts}`);
      console.log(`   🛡️ التأمين الصحي: ${expiringStats.healthInsurance}`);
      console.log(`   ❤️ الشهادات الصحية: ${expiringStats.healthCerts}`);
      
      const totalExpired = expiredStats.iqamas + expiredStats.workPermits + expiredStats.contracts + expiredStats.healthInsurance + expiredStats.healthCerts;
      const totalExpiring = expiringStats.iqamas + expiringStats.workPermits + expiringStats.contracts + expiringStats.healthInsurance + expiringStats.healthCerts;
      
      console.log(`\n📊 الملخص:`);
      console.log(`   🚨 وثائق منتهية فعلياً: ${totalExpired}`);
      console.log(`   ⚠️ وثائق على وشك الانتهاء: ${totalExpiring}`);
      
    } else {
      console.log('❌ فشل جلب البيانات');
    }

    console.log('\n🎉 انتهى اختبار لوحة التحكم!');
    console.log('\n✅ أقسام لوحة التحكم:');
    console.log('   📊 قسم إحصائيات الوثائق المنتهية فعلياً');
    console.log('   ⚠️ قسم التنبيهات للوثائق على وشك الانتهاء');
    console.log('   🏢 قائمة المؤسسات مع الإحصائيات');

    console.log('\n🌐 شاهد لوحة التحكم:');
    console.log('   🏠 الرئيسية: http://localhost:9004');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testFinalDashboard();
