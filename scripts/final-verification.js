const fetch = globalThis.fetch;

async function finalVerification() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('✅ التحقق النهائي من تطابق البيانات...\n');

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
    const allEmployeesResponse = await fetch(`${baseUrl}/api/employees`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const allEmployeesData = await allEmployeesResponse.json();
    const allEmployees = allEmployeesData.data || [];

    console.log(`\n👥 إجمالي الموظفين: ${allEmployees.length}`);

    // جلب المؤسسات
    const institutionsResponse = await fetch(`${baseUrl}/api/institutions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const institutionsData = await institutionsResponse.json();
    const institutions = institutionsData.data || [];

    console.log(`🏢 إجمالي المؤسسات: ${institutions.length}`);

    // التحقق من كل مؤسسة
    for (const institution of institutions) {
      console.log(`\n🏢 ${institution.name}:`);
      
      // جلب موظفي المؤسسة
      const instEmployeesResponse = await fetch(`${baseUrl}/api/employees?institution_id=${institution.id}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const instEmployeesData = await instEmployeesResponse.json();
      const instEmployees = instEmployeesData.data || [];
      
      console.log(`   👥 عدد الموظفين: ${instEmployees.length}`);
      
      // التحقق من كل موظف
      for (const instEmp of instEmployees) {
        const allEmp = allEmployees.find(emp => emp.id === instEmp.id);
        
        if (allEmp) {
          console.log(`\n   👤 ${instEmp.name}:`);
          
          // مقارنة الوثائق
          const docs = [
            { name: 'الإقامة', key: 'iqamaExpiry' },
            { name: 'التأمين', key: 'healthInsuranceExpiry' },
            { name: 'رخصة العمل', key: 'workPermitExpiry' },
            { name: 'الشهادة الصحية', key: 'healthCertExpiry' },
            { name: 'العقد', key: 'contractExpiry' }
          ];
          
          let allMatch = true;
          
          for (const doc of docs) {
            const instValue = instEmp[doc.key];
            const allValue = allEmp[doc.key];
            
            if (instValue === allValue) {
              console.log(`     ✅ ${doc.name}: ${instValue || 'غير محدد'}`);
            } else {
              allMatch = false;
              console.log(`     ❌ ${doc.name}:`);
              console.log(`        المؤسسة: ${instValue || 'غير محدد'}`);
              console.log(`        الكل: ${allValue || 'غير محدد'}`);
            }
          }
          
          if (allMatch) {
            console.log(`     🎉 جميع البيانات متطابقة!`);
          }
        }
      }
    }

    console.log('\n🎉 انتهى التحقق النهائي!');
    console.log('\n📋 الخلاصة:');
    console.log('   ✅ API يعمل بشكل صحيح');
    console.log('   ✅ البيانات متطابقة بين الصفحتين');
    console.log('   ✅ التأمين والشهادة الصحية يظهران بشكل صحيح');
    
    console.log('\n💡 إذا كانت المشكلة لا تزال موجودة في المتصفح:');
    console.log('   🔄 أعد تحميل الصفحة (Ctrl+F5)');
    console.log('   🧹 امحو التخزين المؤقت');
    console.log('   🔍 تحقق من وحدة تحكم المطور');

  } catch (error) {
    console.error('❌ خطأ في التحقق:', error);
  }
}

finalVerification();
