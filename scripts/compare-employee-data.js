const fetch = globalThis.fetch;

async function compareEmployeeData() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🔍 مقارنة بيانات الموظفين بين الصفحتين...\n');

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

    // 1. جلب جميع الموظفين (كما في صفحة جميع الموظفين)
    console.log('\n📋 جلب جميع الموظفين...');
    const allEmployeesResponse = await fetch(`${baseUrl}/api/employees`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const allEmployeesData = await allEmployeesResponse.json();
    const allEmployees = allEmployeesData.data || [];
    console.log(`👥 إجمالي الموظفين: ${allEmployees.length}`);

    // 2. جلب المؤسسات
    console.log('\n🏢 جلب المؤسسات...');
    const institutionsResponse = await fetch(`${baseUrl}/api/institutions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const institutionsData = await institutionsResponse.json();
    const institutions = institutionsData.data || [];
    console.log(`🏢 عدد المؤسسات: ${institutions.length}`);

    // 3. مقارنة البيانات لكل مؤسسة
    for (const institution of institutions) {
      console.log(`\n🏢 مؤسسة: ${institution.name}`);
      
      // جلب موظفي المؤسسة (كما في صفحة تفاصيل المؤسسة)
      const institutionEmployeesResponse = await fetch(`${baseUrl}/api/employees?institution_id=${institution.id}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const institutionEmployeesData = await institutionEmployeesResponse.json();
      const institutionEmployees = institutionEmployeesData.data || [];
      
      console.log(`   👥 موظفي المؤسسة: ${institutionEmployees.length}`);
      
      // مقارنة البيانات لكل موظف
      for (const instEmp of institutionEmployees) {
        // البحث عن نفس الموظف في قائمة جميع الموظفين
        const allEmp = allEmployees.find(emp => emp.id === instEmp.id);
        
        if (allEmp) {
          console.log(`\n   👤 ${instEmp.name} (${instEmp.id}):`);
          
          // مقارنة تواريخ الوثائق
          const documents = [
            { name: 'الإقامة', key: 'iqamaExpiry' },
            { name: 'التأمين الصحي', key: 'healthInsuranceExpiry' },
            { name: 'رخصة العمل', key: 'workPermitExpiry' },
            { name: 'الشهادة الصحية', key: 'healthCertExpiry' },
            { name: 'العقد', key: 'contractExpiry' }
          ];
          
          let hasDiscrepancy = false;
          
          for (const doc of documents) {
            const instDate = instEmp[doc.key];
            const allDate = allEmp[doc.key];
            
            if (instDate !== allDate) {
              hasDiscrepancy = true;
              console.log(`     ❌ ${doc.name}:`);
              console.log(`        صفحة المؤسسة: ${instDate || 'غير محدد'}`);
              console.log(`        صفحة جميع الموظفين: ${allDate || 'غير محدد'}`);
            } else {
              console.log(`     ✅ ${doc.name}: ${instDate || 'غير محدد'}`);
            }
          }
          
          if (!hasDiscrepancy) {
            console.log(`     ✅ جميع البيانات متطابقة`);
          }
        } else {
          console.log(`   ❌ الموظف ${instEmp.name} موجود في المؤسسة ولكن غير موجود في قائمة جميع الموظفين!`);
        }
      }
    }

    // 4. البحث عن موظف ياسر تحديداً
    console.log('\n🔍 البحث عن موظف ياسر...');
    const yaserInAll = allEmployees.find(emp => emp.name.includes('ياسر') || emp.name.includes('JABER'));
    const yaserInInstitutions = [];
    
    for (const institution of institutions) {
      const institutionEmployeesResponse = await fetch(`${baseUrl}/api/employees?institution_id=${institution.id}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const institutionEmployeesData = await institutionEmployeesResponse.json();
      const institutionEmployees = institutionEmployeesData.data || [];
      
      const yaserInInst = institutionEmployees.find(emp => emp.name.includes('ياسر') || emp.name.includes('JABER'));
      if (yaserInInst) {
        yaserInInstitutions.push({ institution: institution.name, employee: yaserInInst });
      }
    }
    
    if (yaserInAll) {
      console.log(`👤 ياسر في قائمة جميع الموظفين:`);
      console.log(`   الاسم: ${yaserInAll.name}`);
      console.log(`   الإقامة: ${yaserInAll.iqamaExpiry || 'غير محدد'}`);
      console.log(`   التأمين: ${yaserInAll.healthInsuranceExpiry || 'غير محدد'}`);
      console.log(`   رخصة العمل: ${yaserInAll.workPermitExpiry || 'غير محدد'}`);
      console.log(`   الشهادة الصحية: ${yaserInAll.healthCertExpiry || 'غير محدد'}`);
      console.log(`   العقد: ${yaserInAll.contractExpiry || 'غير محدد'}`);
    }
    
    yaserInInstitutions.forEach(({ institution, employee }) => {
      console.log(`\n👤 ياسر في مؤسسة ${institution}:`);
      console.log(`   الاسم: ${employee.name}`);
      console.log(`   الإقامة: ${employee.iqamaExpiry || 'غير محدد'}`);
      console.log(`   التأمين: ${employee.healthInsuranceExpiry || 'غير محدد'}`);
      console.log(`   رخصة العمل: ${employee.workPermitExpiry || 'غير محدد'}`);
      console.log(`   الشهادة الصحية: ${employee.healthCertExpiry || 'غير محدد'}`);
      console.log(`   العقد: ${employee.contractExpiry || 'غير محدد'}`);
    });

    console.log('\n🎉 انتهت المقارنة!');

  } catch (error) {
    console.error('❌ خطأ في المقارنة:', error);
  }
}

compareEmployeeData();
