const mysql = require('mysql2/promise');

async function testDashboardData() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🔍 اختبار بيانات لوحة التحكم...\n');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    console.log(`📅 التاريخ الحالي: ${todayStr}`);
    console.log(`📅 تاريخ 30 يوم مستقبلاً: ${futureDateStr}\n`);

    // 1. اختبار مستندات المؤسسات المنتهية
    console.log('🏢 اختبار مستندات المؤسسات:');
    console.log('='.repeat(50));

    const [expiredInstitutionDocs] = await connection.execute(`
      SELECT 
        id.id, id.document_type, id.expiry_date,
        i.name as institution_name,
        CASE 
          WHEN id.expiry_date < CURDATE() THEN 'expired'
          WHEN id.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
          ELSE 'active'
        END as calculated_status
      FROM institution_documents id
      JOIN institutions i ON id.institution_id = i.id
      WHERE id.expiry_date IS NOT NULL
      ORDER BY id.expiry_date
    `);

    let expiredInstDocsCount = 0;
    let expiringSoonInstDocsCount = 0;

    expiredInstitutionDocs.forEach(doc => {
      if (doc.calculated_status === 'expired') {
        expiredInstDocsCount++;
        console.log(`❌ ${doc.institution_name} - ${doc.document_type}: ${doc.expiry_date} (منتهية)`);
      } else if (doc.calculated_status === 'expiring_soon') {
        expiringSoonInstDocsCount++;
        console.log(`⚠️ ${doc.institution_name} - ${doc.document_type}: ${doc.expiry_date} (تنتهي قريباً)`);
      } else {
        console.log(`✅ ${doc.institution_name} - ${doc.document_type}: ${doc.expiry_date} (سارية)`);
      }
    });

    console.log(`\n📊 مستندات المؤسسات:`);
    console.log(`   ❌ منتهية: ${expiredInstDocsCount}`);
    console.log(`   ⚠️ تنتهي قريباً: ${expiringSoonInstDocsCount}`);

    // 2. اختبار الاشتراكات
    console.log('\n\n💳 اختبار الاشتراكات:');
    console.log('='.repeat(50));

    const [subscriptions] = await connection.execute(`
      SELECT 
        s.id, s.name, s.expiry_date, s.status,
        i.name as institution_name,
        CASE 
          WHEN s.expiry_date < CURDATE() THEN 'expired'
          WHEN s.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
          ELSE 'active'
        END as calculated_status
      FROM subscriptions s
      JOIN institutions i ON s.institution_id = i.id
      ORDER BY s.expiry_date
    `);

    let expiredSubsCount = 0;
    let expiringSoonSubsCount = 0;

    subscriptions.forEach(sub => {
      if (sub.calculated_status === 'expired') {
        expiredSubsCount++;
        console.log(`❌ ${sub.institution_name} - ${sub.name}: ${sub.expiry_date} (منتهية) - حالة DB: ${sub.status}`);
      } else if (sub.calculated_status === 'expiring_soon') {
        expiringSoonSubsCount++;
        console.log(`⚠️ ${sub.institution_name} - ${sub.name}: ${sub.expiry_date} (تنتهي قريباً) - حالة DB: ${sub.status}`);
      } else {
        console.log(`✅ ${sub.institution_name} - ${sub.name}: ${sub.expiry_date} (سارية) - حالة DB: ${sub.status}`);
      }
    });

    console.log(`\n📊 الاشتراكات:`);
    console.log(`   ❌ منتهية: ${expiredSubsCount}`);
    console.log(`   ⚠️ تنتهي قريباً: ${expiringSoonSubsCount}`);

    // 3. اختبار مستندات الموظفين
    console.log('\n\n👥 اختبار مستندات الموظفين:');
    console.log('='.repeat(50));

    const [employees] = await connection.execute(`
      SELECT 
        id, name, 
        iqama_expiry, work_permit_expiry, contract_expiry, 
        health_cert_expiry, health_insurance_expiry
      FROM employees 
      WHERE status = 'active'
      ORDER BY name
    `);

    let expiredEmployeeDocsCount = 0;
    let expiringSoonEmployeeDocsCount = 0;

    employees.forEach(emp => {
      const documents = [
        { name: 'الإقامة', date: emp.iqama_expiry },
        { name: 'رخصة العمل', date: emp.work_permit_expiry },
        { name: 'العقد', date: emp.contract_expiry },
        { name: 'الشهادة الصحية', date: emp.health_cert_expiry },
        { name: 'التأمين الصحي', date: emp.health_insurance_expiry }
      ];

      documents.forEach(doc => {
        if (doc.date) {
          const docDate = new Date(doc.date);
          if (docDate < today) {
            expiredEmployeeDocsCount++;
            console.log(`❌ ${emp.name} - ${doc.name}: ${doc.date} (منتهية)`);
          } else if (docDate <= futureDate) {
            expiringSoonEmployeeDocsCount++;
            console.log(`⚠️ ${emp.name} - ${doc.name}: ${doc.date} (تنتهي قريباً)`);
          }
        }
      });
    });

    console.log(`\n📊 مستندات الموظفين:`);
    console.log(`   ❌ منتهية: ${expiredEmployeeDocsCount}`);
    console.log(`   ⚠️ تنتهي قريباً: ${expiringSoonEmployeeDocsCount}`);

    // 4. اختبار API endpoints
    console.log('\n\n🌐 اختبار API endpoints:');
    console.log('='.repeat(50));

    // اختبار API المستندات المنتهية
    const [apiExpiredDocs] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM (
        SELECT
          ed.id, ed.employee_id as entityId, 'employee' as entityType,
          ed.document_type as documentType, ed.file_name as fileName,
          ed.file_path as filePath, ed.file_url as fileUrl,
          ed.expiry_date as expiryDate, ed.status,
          NULL as isRenewable,
          ed.upload_date as uploadDate, ed.created_at as createdAt,
          e.name as entityName
        FROM employee_documents ed
        JOIN employees e ON ed.employee_id = e.id

        UNION ALL

        SELECT
          id.id, id.institution_id as entityId, 'institution' as entityType,
          id.document_type as documentType, id.name as fileName,
          id.file_path as filePath, id.file_url as fileUrl,
          id.expiry_date as expiryDate, id.status,
          id.is_renewable as isRenewable,
          id.upload_date as uploadDate, id.created_at as createdAt,
          i.name as entityName
        FROM institution_documents id
        JOIN institutions i ON id.institution_id = i.id
      ) as all_docs
      WHERE expiryDate IS NOT NULL
      AND expiryDate <= CURDATE()
    `);

    console.log(`📄 API المستندات المنتهية: ${apiExpiredDocs[0].count}`);

    // الخلاصة النهائية
    console.log('\n\n🎯 الخلاصة النهائية:');
    console.log('='.repeat(50));
    console.log(`📅 التاريخ الحالي: ${todayStr}`);
    console.log(`🏢 مستندات المؤسسات المنتهية: ${expiredInstDocsCount}`);
    console.log(`💳 الاشتراكات المنتهية: ${expiredSubsCount}`);
    console.log(`👥 مستندات الموظفين المنتهية: ${expiredEmployeeDocsCount}`);
    console.log(`🌐 API المستندات المنتهية: ${apiExpiredDocs[0].count}`);

    const totalExpired = expiredInstDocsCount + expiredSubsCount + expiredEmployeeDocsCount;
    console.log(`📊 إجمالي المستندات والاشتراكات المنتهية: ${totalExpired}`);

    if (totalExpired === 0) {
      console.log('\n✅ جميع المستندات والاشتراكات سارية المفعول!');
      console.log('❓ إذا كان النظام يظهر أرقام مختلفة، فالمشكلة في منطق العرض.');
    } else {
      console.log('\n⚠️ يوجد مستندات أو اشتراكات منتهية فعلاً.');
    }

    // اختبار تحديث حالة الاشتراكات
    console.log('\n\n🔄 تحديث حالة الاشتراكات:');
    console.log('='.repeat(50));

    const [updateResult] = await connection.execute(`
      UPDATE subscriptions 
      SET status = CASE 
        WHEN expiry_date < CURDATE() THEN 'expired'
        WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
        ELSE 'active'
      END
    `);

    console.log(`✅ تم تحديث ${updateResult.affectedRows} اشتراك`);

    // إعادة فحص الاشتراكات بعد التحديث
    const [updatedSubs] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
        COUNT(CASE WHEN status = 'expiring_soon' THEN 1 END) as expiring_soon_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
      FROM subscriptions
    `);

    console.log(`📊 حالة الاشتراكات بعد التحديث:`);
    console.log(`   ❌ منتهية: ${updatedSubs[0].expired_count}`);
    console.log(`   ⚠️ تنتهي قريباً: ${updatedSubs[0].expiring_soon_count}`);
    console.log(`   ✅ سارية: ${updatedSubs[0].active_count}`);

  } catch (error) {
    console.error('❌ خطأ في اختبار البيانات:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testDashboardData();
