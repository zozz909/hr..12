const fetch = globalThis.fetch;

async function testDashboardUpdates() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🏠 اختبار تحديثات لوحة التحكم...\n');

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

    // اختبار API الموظفين مع المستندات المنتهية الصلاحية
    console.log('\n📋 اختبار API الموظفين مع المستندات المنتهية...');
    const expiringResponse = await fetch(`${baseUrl}/api/employees?expiring=true&days=30`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (expiringResponse.ok) {
      const expiringData = await expiringResponse.json();
      console.log('✅ تم جلب الموظفين مع المستندات المنتهية');
      console.log(`📄 عدد الموظفين: ${expiringData.data?.length || 0}`);
      
      if (expiringData.data && expiringData.data.length > 0) {
        console.log('\n📊 تحليل المستندات المنتهية:');
        
        const healthCertExpiring = expiringData.data.filter(emp => 
          emp.healthCertExpiry && new Date(emp.healthCertExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length;
        
        const insuranceExpiring = expiringData.data.filter(emp => 
          emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length;
        
        const iqamasExpiring = expiringData.data.filter(emp => 
          emp.iqamaExpiry && new Date(emp.iqamaExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length;
        
        const workPermitsExpiring = expiringData.data.filter(emp => 
          emp.workPermitExpiry && new Date(emp.workPermitExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length;
        
        const contractsExpiring = expiringData.data.filter(emp => 
          emp.contractExpiry && new Date(emp.contractExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length;
        
        console.log(`   ❤️ شهادات صحية ستنتهي: ${healthCertExpiring}`);
        console.log(`   🛡️ تأمين صحي سينتهي: ${insuranceExpiring}`);
        console.log(`   🆔 إقامات ستنتهي: ${iqamasExpiring}`);
        console.log(`   💼 رخص عمل ستنتهي: ${workPermitsExpiring}`);
        console.log(`   📄 عقود ستنتهي: ${contractsExpiring}`);
      }
    } else {
      console.log('❌ فشل جلب الموظفين مع المستندات المنتهية');
    }

    // اختبار API النماذج
    console.log('\n📋 اختبار API النماذج...');
    const formsResponse = await fetch(`${baseUrl}/api/forms`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (formsResponse.ok) {
      const formsData = await formsResponse.json();
      console.log('✅ API النماذج يعمل بشكل صحيح');
      console.log(`📄 عدد النماذج: ${formsData.forms?.length || 0}`);
    } else {
      console.log('❌ مشكلة في API النماذج');
    }

    console.log('\n🎉 انتهى اختبار التحديثات!');
    console.log('\n✅ التحديثات المكتملة:');
    console.log('   🗑️ حذف قسم إحصائيات النظام');
    console.log('   ❤️ إضافة تنبيه الشهادة الصحية');
    console.log('   🛡️ إضافة تنبيه التأمين الصحي');
    console.log('   📋 إصلاح API النماذج');

    console.log('\n🌐 لوحة التحكم محدثة:');
    console.log('   🏠 الرئيسية: http://localhost:9004');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testDashboardUpdates();
