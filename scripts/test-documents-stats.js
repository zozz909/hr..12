const fetch = globalThis.fetch;

async function testDocumentsStats() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('📊 اختبار إحصائيات الوثائق المنتهية...\n');

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

    // جلب الموظفين مع المستندات المنتهية
    console.log('\n📋 جلب الموظفين مع المستندات المنتهية...');
    const expiringResponse = await fetch(`${baseUrl}/api/employees?expiring=true&days=30`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (expiringResponse.ok) {
      const expiringData = await expiringResponse.json();
      const employees = expiringData.data || [];
      
      console.log('✅ تم جلب البيانات بنجاح');
      console.log(`👥 عدد الموظفين مع وثائق منتهية: ${employees.length}`);
      
      // حساب الإحصائيات
      const stats = {
        iqamas: employees.filter(emp => 
          emp.iqamaExpiry && new Date(emp.iqamaExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length,
        
        workPermits: employees.filter(emp => 
          emp.workPermitExpiry && new Date(emp.workPermitExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length,
        
        contracts: employees.filter(emp => 
          emp.contractExpiry && new Date(emp.contractExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length,
        
        healthInsurance: employees.filter(emp => 
          emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length,
        
        healthCerts: employees.filter(emp => 
          emp.healthCertExpiry && new Date(emp.healthCertExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length
      };
      
      console.log('\n📊 إحصائيات الوثائق المنتهية:');
      console.log(`   🆔 الإقامات: ${stats.iqamas}`);
      console.log(`   💼 رخص العمل: ${stats.workPermits}`);
      console.log(`   📄 العقود: ${stats.contracts}`);
      console.log(`   🛡️ التأمين الصحي: ${stats.healthInsurance}`);
      console.log(`   ❤️ الشهادات الصحية: ${stats.healthCerts}`);
      console.log(`   📊 الإجمالي: ${stats.iqamas + stats.workPermits + stats.contracts + stats.healthInsurance + stats.healthCerts}`);
      
      // عرض تفاصيل بعض الموظفين
      if (employees.length > 0) {
        console.log('\n👥 أمثلة على الموظفين مع وثائق منتهية:');
        employees.slice(0, 3).forEach(emp => {
          console.log(`   - ${emp.name} (${emp.institutionName || 'غير مكفول'})`);
          if (emp.iqamaExpiry && new Date(emp.iqamaExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
            console.log(`     🆔 إقامة تنتهي: ${emp.iqamaExpiry}`);
          }
          if (emp.workPermitExpiry && new Date(emp.workPermitExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
            console.log(`     💼 رخصة عمل تنتهي: ${emp.workPermitExpiry}`);
          }
          if (emp.contractExpiry && new Date(emp.contractExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
            console.log(`     📄 عقد ينتهي: ${emp.contractExpiry}`);
          }
          if (emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
            console.log(`     🛡️ تأمين ينتهي: ${emp.healthInsuranceExpiry}`);
          }
          if (emp.healthCertExpiry && new Date(emp.healthCertExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
            console.log(`     ❤️ شهادة صحية تنتهي: ${emp.healthCertExpiry}`);
          }
        });
      }
    } else {
      console.log('❌ فشل جلب البيانات');
    }

    console.log('\n🎉 انتهى اختبار إحصائيات الوثائق!');
    console.log('\n✅ القسم الجديد يتضمن:');
    console.log('   🆔 إحصائيات الإقامات المنتهية');
    console.log('   💼 إحصائيات رخص العمل المنتهية');
    console.log('   📄 إحصائيات العقود المنتهية');
    console.log('   🛡️ إحصائيات التأمين الصحي المنتهي');
    console.log('   ❤️ إحصائيات الشهادات الصحية المنتهية');
    console.log('   📊 إجمالي شامل لجميع الوثائق');

    console.log('\n🌐 شاهد التحديثات:');
    console.log('   🏠 لوحة التحكم: http://localhost:9004');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testDocumentsStats();
