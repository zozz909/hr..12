const mysql = require('mysql2/promise');

async function debugExpiredDocuments() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🔍 فحص المستندات المنتهية الصلاحية...\n');

    // الحصول على التاريخ الحالي
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log(`📅 التاريخ الحالي: ${todayStr}\n`);

    // فحص مستندات الموظفين
    console.log('👥 فحص مستندات الموظفين:');
    console.log('='.repeat(50));

    const [employees] = await connection.execute(`
      SELECT 
        id, name, 
        iqama_expiry, work_permit_expiry, contract_expiry, 
        health_cert_expiry, health_insurance_expiry
      FROM employees 
      WHERE status = 'active'
      ORDER BY name
      LIMIT 10
    `);

    let expiredCount = 0;
    let validCount = 0;

    employees.forEach((emp, index) => {
      console.log(`\n${index + 1}. 👤 ${emp.name}:`);
      
      const documents = [
        { name: 'الإقامة', date: emp.iqama_expiry, icon: '🆔' },
        { name: 'رخصة العمل', date: emp.work_permit_expiry, icon: '💼' },
        { name: 'العقد', date: emp.contract_expiry, icon: '📄' },
        { name: 'الشهادة الصحية', date: emp.health_cert_expiry, icon: '🏥' },
        { name: 'التأمين الصحي', date: emp.health_insurance_expiry, icon: '🛡️' }
      ];

      documents.forEach(doc => {
        if (doc.date) {
          const docDate = new Date(doc.date);
          const isExpired = docDate < today;
          const daysDiff = Math.ceil((docDate - today) / (1000 * 60 * 60 * 24));
          
          if (isExpired) {
            expiredCount++;
            console.log(`   ${doc.icon} ${doc.name}: ${doc.date} ❌ منتهية منذ ${Math.abs(daysDiff)} يوم`);
          } else {
            validCount++;
            console.log(`   ${doc.icon} ${doc.name}: ${doc.date} ✅ سارية (${daysDiff} يوم متبقي)`);
          }
        } else {
          console.log(`   ${doc.icon} ${doc.name}: غير محدد`);
        }
      });
    });

    console.log(`\n📊 ملخص مستندات الموظفين:`);
    console.log(`   ❌ منتهية: ${expiredCount}`);
    console.log(`   ✅ سارية: ${validCount}`);

    // فحص مستندات المؤسسات
    console.log('\n\n🏢 فحص مستندات المؤسسات:');
    console.log('='.repeat(50));

    const [institutionDocs] = await connection.execute(`
      SELECT 
        id.id, id.document_type, id.expiry_date,
        i.name as institution_name
      FROM institution_documents id
      JOIN institutions i ON id.institution_id = i.id
      WHERE id.expiry_date IS NOT NULL
      ORDER BY i.name, id.document_type
    `);

    let instExpiredCount = 0;
    let instValidCount = 0;

    institutionDocs.forEach((doc, index) => {
      const docDate = new Date(doc.expiry_date);
      const isExpired = docDate < today;
      const daysDiff = Math.ceil((docDate - today) / (1000 * 60 * 60 * 24));
      
      if (isExpired) {
        instExpiredCount++;
        console.log(`${index + 1}. 🏢 ${doc.institution_name} - ${doc.document_type}:`);
        console.log(`   📅 ${doc.expiry_date} ❌ منتهية منذ ${Math.abs(daysDiff)} يوم\n`);
      } else {
        instValidCount++;
        console.log(`${index + 1}. 🏢 ${doc.institution_name} - ${doc.document_type}:`);
        console.log(`   📅 ${doc.expiry_date} ✅ سارية (${daysDiff} يوم متبقي)\n`);
      }
    });

    console.log(`📊 ملخص مستندات المؤسسات:`);
    console.log(`   ❌ منتهية: ${instExpiredCount}`);
    console.log(`   ✅ سارية: ${instValidCount}`);

    // فحص الاستعلامات المستخدمة في API
    console.log('\n\n🔍 اختبار استعلامات API:');
    console.log('='.repeat(50));

    // استعلام المستندات المنتهية
    const [expiredQuery] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM institution_documents 
      WHERE expiry_date IS NOT NULL 
      AND expiry_date <= CURDATE()
    `);

    console.log(`📄 المستندات المنتهية (حسب API): ${expiredQuery[0].count}`);

    // استعلام المستندات التي على وشك الانتهاء
    const [expiringQuery] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM institution_documents 
      WHERE expiry_date IS NOT NULL 
      AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      AND expiry_date > CURDATE()
    `);

    console.log(`📄 المستندات التي على وشك الانتهاء (30 يوم): ${expiringQuery[0].count}`);

    // فحص الاشتراكات
    console.log('\n💳 فحص الاشتراكات:');
    const [subscriptions] = await connection.execute(`
      SELECT 
        s.id, s.subscription_type, s.expiry_date,
        i.name as institution_name
      FROM subscriptions s
      JOIN institutions i ON s.institution_id = i.id
      WHERE s.expiry_date IS NOT NULL
      ORDER BY s.expiry_date
    `);

    let subExpiredCount = 0;
    let subValidCount = 0;

    subscriptions.forEach((sub, index) => {
      const subDate = new Date(sub.expiry_date);
      const isExpired = subDate < today;
      const daysDiff = Math.ceil((subDate - today) / (1000 * 60 * 60 * 24));
      
      if (isExpired) {
        subExpiredCount++;
        console.log(`${index + 1}. 💳 ${sub.institution_name} - ${sub.subscription_type}:`);
        console.log(`   📅 ${sub.expiry_date} ❌ منتهية منذ ${Math.abs(daysDiff)} يوم`);
      } else {
        subValidCount++;
        console.log(`${index + 1}. 💳 ${sub.institution_name} - ${sub.subscription_type}:`);
        console.log(`   📅 ${sub.expiry_date} ✅ سارية (${daysDiff} يوم متبقي)`);
      }
    });

    console.log(`\n📊 ملخص الاشتراكات:`);
    console.log(`   ❌ منتهية: ${subExpiredCount}`);
    console.log(`   ✅ سارية: ${subValidCount}`);

    // التحقق من منطق التاريخ
    console.log('\n\n🧮 اختبار منطق التاريخ:');
    console.log('='.repeat(50));

    const testDates = [
      '2024-01-01', // منتهية
      '2024-12-01', // منتهية
      '2025-02-01', // سارية
      '2025-06-01', // سارية
      '2026-01-01'  // سارية
    ];

    testDates.forEach(testDate => {
      const date = new Date(testDate);
      const isExpired = date < today;
      const daysDiff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      
      console.log(`📅 ${testDate}: ${isExpired ? '❌ منتهية' : '✅ سارية'} (${daysDiff} يوم)`);
    });

    console.log('\n🎯 الخلاصة:');
    console.log('='.repeat(50));
    console.log(`📅 التاريخ الحالي: ${todayStr}`);
    console.log(`👥 مستندات الموظفين المنتهية: ${expiredCount}`);
    console.log(`🏢 مستندات المؤسسات المنتهية: ${instExpiredCount}`);
    console.log(`💳 الاشتراكات المنتهية: ${subExpiredCount}`);
    
    if (expiredCount === 0 && instExpiredCount === 0 && subExpiredCount === 0) {
      console.log('\n✅ جميع المستندات والاشتراكات سارية المفعول!');
      console.log('❓ إذا كان النظام يظهر مستندات منتهية، فالمشكلة في منطق العرض وليس في البيانات.');
    } else {
      console.log('\n⚠️ يوجد مستندات أو اشتراكات منتهية فعلاً.');
    }

  } catch (error) {
    console.error('❌ خطأ في فحص البيانات:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugExpiredDocuments();
