const fetch = globalThis.fetch;

async function testHealthDocuments() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🏥 اختبار التأمين الصحي والشهادة الصحية...\n');

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
      
      // فحص بيانات التأمين والشهادة الصحية
      console.log('\n🔍 فحص بيانات التأمين والشهادة الصحية:');
      employees.forEach((emp, index) => {
        if (index < 3) { // عرض أول 3 موظفين فقط
          console.log(`\n👤 ${emp.name}:`);
          console.log(`   🆔 إقامة: ${emp.iqamaExpiry || 'غير محدد'}`);
          console.log(`   💼 رخصة عمل: ${emp.workPermitExpiry || 'غير محدد'}`);
          console.log(`   📄 عقد: ${emp.contractExpiry || 'غير محدد'}`);
          console.log(`   🛡️ تأمين صحي: ${emp.healthInsuranceExpiry || 'غير محدد'}`);
          console.log(`   ❤️ شهادة صحية: ${emp.healthCertExpiry || 'غير محدد'}`);
        }
      });
    }

    // جلب الموظفين مع وثائق على وشك الانتهاء
    console.log('\n⚠️ جلب الموظفين مع وثائق على وشك الانتهاء...');
    const expiringResponse = await fetch(`${baseUrl}/api/employees?expiring=true&days=30`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (expiringResponse.ok) {
      const expiringData = await expiringResponse.json();
      const expiringEmployees = expiringData.data || [];
      
      console.log('✅ تم جلب الموظفين مع وثائق على وشك الانتهاء');
      console.log(`⚠️ عدد الموظفين: ${expiringEmployees.length}`);
      
      // حساب الإحصائيات
      const today = new Date();
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const expiringStats = {
        iqamas: expiringEmployees.filter(emp => 
          emp.iqamaExpiry && new Date(emp.iqamaExpiry) <= futureDate
        ).length,
        workPermits: expiringEmployees.filter(emp => 
          emp.workPermitExpiry && new Date(emp.workPermitExpiry) <= futureDate
        ).length,
        contracts: expiringEmployees.filter(emp => 
          emp.contractExpiry && new Date(emp.contractExpiry) <= futureDate
        ).length,
        healthInsurance: expiringEmployees.filter(emp => 
          emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) <= futureDate
        ).length,
        healthCerts: expiringEmployees.filter(emp => 
          emp.healthCertExpiry && new Date(emp.healthCertExpiry) <= futureDate
        ).length
      };
      
      console.log('\n📊 إحصائيات الوثائق على وشك الانتهاء:');
      console.log(`   🆔 الإقامات: ${expiringStats.iqamas}`);
      console.log(`   💼 رخص العمل: ${expiringStats.workPermits}`);
      console.log(`   📄 العقود: ${expiringStats.contracts}`);
      console.log(`   🛡️ التأمين الصحي: ${expiringStats.healthInsurance}`);
      console.log(`   ❤️ الشهادات الصحية: ${expiringStats.healthCerts}`);
      
      // عرض تفاصيل الموظفين مع تأمين أو شهادة صحية على وشك الانتهاء
      const healthRelatedEmployees = expiringEmployees.filter(emp => 
        (emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) <= futureDate) ||
        (emp.healthCertExpiry && new Date(emp.healthCertExpiry) <= futureDate)
      );
      
      if (healthRelatedEmployees.length > 0) {
        console.log('\n🏥 موظفين مع تأمين أو شهادة صحية على وشك الانتهاء:');
        healthRelatedEmployees.forEach(emp => {
          console.log(`   - ${emp.name} (${emp.institutionName || 'غير مكفول'})`);
          if (emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) <= futureDate) {
            console.log(`     🛡️ تأمين ينتهي: ${emp.healthInsuranceExpiry}`);
          }
          if (emp.healthCertExpiry && new Date(emp.healthCertExpiry) <= futureDate) {
            console.log(`     ❤️ شهادة تنتهي: ${emp.healthCertExpiry}`);
          }
        });
      } else {
        console.log('\n🏥 لا يوجد موظفين مع تأمين أو شهادة صحية على وشك الانتهاء');
      }
    }

    console.log('\n🎉 انتهى اختبار التأمين والشهادة الصحية!');
    console.log('\n🌐 شاهد لوحة التحكم:');
    console.log('   🏠 الرئيسية: http://localhost:9004');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testHealthDocuments();
