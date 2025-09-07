const fetch = globalThis.fetch;

async function debugInstitutionQuery() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🔍 تشخيص استعلام موظفي المؤسسة...\n');

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

    // جلب المؤسسات أولاً
    const institutionsResponse = await fetch(`${baseUrl}/api/institutions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const institutionsData = await institutionsResponse.json();
    const institutions = institutionsData.data || [];
    
    console.log(`🏢 المؤسسات المتاحة: ${institutions.length}`);
    institutions.forEach(inst => {
      console.log(`   - ${inst.name} (ID: ${inst.id})`);
    });

    // اختبار مؤسسة عنوان الروقان (التي تحتوي على JABER)
    const targetInstitution = institutions.find(inst => inst.name.includes('الروقان'));
    if (!targetInstitution) {
      console.log('❌ لم يتم العثور على مؤسسة عنوان الروقان');
      return;
    }

    console.log(`\n🎯 اختبار مؤسسة: ${targetInstitution.name}`);
    console.log(`   ID: ${targetInstitution.id}`);

    // اختبار عدة طرق لجلب موظفي المؤسسة
    console.log('\n📋 اختبار طرق مختلفة لجلب الموظفين:');

    // 1. الطريقة المستخدمة في صفحة تفاصيل المؤسسة
    console.log('\n1️⃣ الطريقة الأولى: ?institution_id=...');
    const method1Response = await fetch(`${baseUrl}/api/employees?institution_id=${targetInstitution.id}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const method1Data = await method1Response.json();
    console.log(`   النتيجة: ${method1Data.success ? 'نجح' : 'فشل'}`);
    console.log(`   عدد الموظفين: ${method1Data.data?.length || 0}`);
    if (method1Data.data?.length > 0) {
      const jaber = method1Data.data.find(emp => emp.name.includes('JABER'));
      if (jaber) {
        console.log(`   JABER - الإقامة: ${jaber.iqamaExpiry || 'غير محدد'}`);
        console.log(`   JABER - التأمين: ${jaber.healthInsuranceExpiry || 'غير محدد'}`);
      }
    }

    // 2. طريقة بديلة
    console.log('\n2️⃣ الطريقة الثانية: بدون فلتر ثم فلترة محلية');
    const method2Response = await fetch(`${baseUrl}/api/employees`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const method2Data = await method2Response.json();
    const filteredEmployees = method2Data.data?.filter(emp => emp.institutionId === targetInstitution.id) || [];
    console.log(`   النتيجة: ${method2Data.success ? 'نجح' : 'فشل'}`);
    console.log(`   إجمالي الموظفين: ${method2Data.data?.length || 0}`);
    console.log(`   موظفي المؤسسة: ${filteredEmployees.length}`);
    if (filteredEmployees.length > 0) {
      const jaber = filteredEmployees.find(emp => emp.name.includes('JABER'));
      if (jaber) {
        console.log(`   JABER - الإقامة: ${jaber.iqamaExpiry || 'غير محدد'}`);
        console.log(`   JABER - التأمين: ${jaber.healthInsuranceExpiry || 'غير محدد'}`);
      }
    }

    // 3. اختبار مع تفاصيل إضافية
    console.log('\n3️⃣ الطريقة الثالثة: مع تفاصيل الاستجابة');
    const method3Response = await fetch(`${baseUrl}/api/employees?institution_id=${targetInstitution.id}`, {
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`   حالة الاستجابة: ${method3Response.status}`);
    console.log(`   نوع المحتوى: ${method3Response.headers.get('content-type')}`);
    
    const method3Text = await method3Response.text();
    console.log(`   نص الاستجابة: ${method3Text.substring(0, 200)}...`);
    
    try {
      const method3Data = JSON.parse(method3Text);
      console.log(`   تم تحليل JSON بنجاح`);
      console.log(`   عدد الموظفين: ${method3Data.data?.length || 0}`);
    } catch (parseError) {
      console.log(`   ❌ خطأ في تحليل JSON: ${parseError.message}`);
    }

    console.log('\n🎉 انتهى التشخيص!');

  } catch (error) {
    console.error('❌ خطأ في التشخيص:', error);
  }
}

debugInstitutionQuery();
