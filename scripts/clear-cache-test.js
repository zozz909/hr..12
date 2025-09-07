const fetch = globalThis.fetch;

async function clearCacheTest() {
  const baseUrl = 'http://localhost:9004';
  
  console.log('🧹 اختبار محو التخزين المؤقت...\n');

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

    // جلب بيانات JABER من مصادر مختلفة
    console.log('\n🔍 جلب بيانات JABER من مصادر مختلفة...');
    
    // 1. من API جميع الموظفين
    const allEmployeesResponse = await fetch(`${baseUrl}/api/employees`, {
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const allEmployeesData = await allEmployeesResponse.json();
    const jaberFromAll = allEmployeesData.data?.find(emp => emp.name.includes('JABER'));
    
    // 2. من API موظفي المؤسسة
    const institutionEmployeesResponse = await fetch(`${baseUrl}/api/employees?institution_id=inst-meydwpre-ma1xf9`, {
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const institutionEmployeesData = await institutionEmployeesResponse.json();
    const jaberFromInstitution = institutionEmployeesData.data?.find(emp => emp.name.includes('JABER'));
    
    // 3. من API الموظف المحدد
    if (jaberFromAll) {
      const specificEmployeeResponse = await fetch(`${baseUrl}/api/employees/${jaberFromAll.id}`, {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const specificEmployeeData = await specificEmployeeResponse.json();
      const jaberSpecific = specificEmployeeData.data;
      
      console.log('\n📊 مقارنة بيانات JABER من 3 مصادر:');
      
      const documents = [
        { name: 'الإقامة', key: 'iqamaExpiry' },
        { name: 'التأمين الصحي', key: 'healthInsuranceExpiry' },
        { name: 'رخصة العمل', key: 'workPermitExpiry' },
        { name: 'الشهادة الصحية', key: 'healthCertExpiry' },
        { name: 'العقد', key: 'contractExpiry' }
      ];
      
      documents.forEach(doc => {
        const fromAll = jaberFromAll?.[doc.key];
        const fromInst = jaberFromInstitution?.[doc.key];
        const fromSpecific = jaberSpecific?.[doc.key];
        
        console.log(`\n📄 ${doc.name}:`);
        console.log(`   من جميع الموظفين: ${fromAll || 'غير محدد'}`);
        console.log(`   من موظفي المؤسسة: ${fromInst || 'غير محدد'}`);
        console.log(`   من API المحدد: ${fromSpecific || 'غير محدد'}`);
        
        if (fromAll === fromInst && fromInst === fromSpecific) {
          console.log(`   ✅ البيانات متطابقة`);
        } else {
          console.log(`   ❌ البيانات غير متطابقة!`);
        }
        
        // حساب الحالة
        const getStatus = (dateStr) => {
          if (!dateStr) return 'غير محدد';
          const expiry = new Date(dateStr);
          const today = new Date();
          const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 0) return '🔴 منتهية';
          if (diffDays <= 30) return '🟡 تنتهي قريباً';
          return '🟢 نشطة';
        };
        
        if (fromAll) {
          console.log(`   📊 الحالة: ${getStatus(fromAll)}`);
        }
      });
    }

    console.log('\n🎉 انتهى اختبار محو التخزين المؤقت!');
    console.log('\n💡 نصائح لحل مشكلة التضارب:');
    console.log('   🔄 أعد تحميل الصفحتين (Ctrl+F5)');
    console.log('   🧹 امحو التخزين المؤقت للمتصفح');
    console.log('   📱 جرب في نافذة خاصة (Incognito)');
    console.log('   🔍 تحقق من وحدة تحكم المطور (F12)');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

clearCacheTest();
