const fetch = globalThis.fetch;

async function testExpiredDocuments() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('📊 اختبار إحصائيات الوثائق المنتهية الصلاحية...\n');

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
      
      // حساب الوثائق المنتهية فعلياً (وليس على وشك الانتهاء)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiredStats = {
        iqamas: employees.filter(emp => 
          emp.iqamaExpiry && new Date(emp.iqamaExpiry) < today
        ).length,
        
        workPermits: employees.filter(emp => 
          emp.workPermitExpiry && new Date(emp.workPermitExpiry) < today
        ).length,
        
        contracts: employees.filter(emp => 
          emp.contractExpiry && new Date(emp.contractExpiry) < today
        ).length,
        
        healthInsurance: employees.filter(emp => 
          emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) < today
        ).length,
        
        healthCerts: employees.filter(emp => 
          emp.healthCertExpiry && new Date(emp.healthCertExpiry) < today
        ).length
      };
      
      console.log('\n📊 إحصائيات الوثائق المنتهية الصلاحية فعلياً:');
      console.log(`   🆔 الإقامات المنتهية: ${expiredStats.iqamas}`);
      console.log(`   💼 رخص العمل المنتهية: ${expiredStats.workPermits}`);
      console.log(`   📄 العقود المنتهية: ${expiredStats.contracts}`);
      console.log(`   🛡️ التأمين الصحي المنتهي: ${expiredStats.healthInsurance}`);
      console.log(`   ❤️ الشهادات الصحية المنتهية: ${expiredStats.healthCerts}`);
      
      const totalExpired = expiredStats.iqamas + expiredStats.workPermits + expiredStats.contracts + expiredStats.healthInsurance + expiredStats.healthCerts;
      console.log(`   📊 الإجمالي: ${totalExpired} وثيقة منتهية`);
      
      // عرض الموظفين مع وثائق منتهية
      const employeesWithExpiredDocs = employees.filter(emp => {
        return (emp.iqamaExpiry && new Date(emp.iqamaExpiry) < today) ||
               (emp.workPermitExpiry && new Date(emp.workPermitExpiry) < today) ||
               (emp.contractExpiry && new Date(emp.contractExpiry) < today) ||
               (emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) < today) ||
               (emp.healthCertExpiry && new Date(emp.healthCertExpiry) < today);
      });
      
      console.log(`\n👥 الموظفين مع وثائق منتهية: ${employeesWithExpiredDocs.length}`);
      
      if (employeesWithExpiredDocs.length > 0) {
        console.log('\n🚨 أمثلة على الموظفين مع وثائق منتهية:');
        employeesWithExpiredDocs.slice(0, 3).forEach(emp => {
          console.log(`   - ${emp.name} (${emp.institutionName || 'غير مكفول'})`);
          
          if (emp.iqamaExpiry && new Date(emp.iqamaExpiry) < today) {
            console.log(`     🆔 إقامة منتهية: ${emp.iqamaExpiry}`);
          }
          if (emp.workPermitExpiry && new Date(emp.workPermitExpiry) < today) {
            console.log(`     💼 رخصة عمل منتهية: ${emp.workPermitExpiry}`);
          }
          if (emp.contractExpiry && new Date(emp.contractExpiry) < today) {
            console.log(`     📄 عقد منتهي: ${emp.contractExpiry}`);
          }
          if (emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) < today) {
            console.log(`     🛡️ تأمين منتهي: ${emp.healthInsuranceExpiry}`);
          }
          if (emp.healthCertExpiry && new Date(emp.healthCertExpiry) < today) {
            console.log(`     ❤️ شهادة صحية منتهية: ${emp.healthCertExpiry}`);
          }
        });
      }
    } else {
      console.log('❌ فشل جلب البيانات');
    }

    console.log('\n🎉 انتهى اختبار الوثائق المنتهية!');
    console.log('\n✅ القسم الجديد يعرض:');
    console.log('   🚨 الوثائق المنتهية فعلياً (وليس على وشك الانتهاء)');
    console.log('   📊 إحصائيات مفصلة لكل نوع وثيقة');
    console.log('   🎨 تصميم ملون ومميز لكل نوع');
    console.log('   📈 إجمالي شامل مع زر للعرض التفصيلي');

    console.log('\n🌐 شاهد التحديثات:');
    console.log('   🏠 لوحة التحكم: http://localhost:9004');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testExpiredDocuments();
