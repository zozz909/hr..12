const mysql = require('mysql2/promise');

async function debugStatsAccuracy() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🔍 تحليل دقة الإحصائيات...\n');

    // 1. فحص البيانات الخام في قاعدة البيانات
    console.log('📊 فحص البيانات الخام...');
    
    const [rawDocs] = await connection.execute(`
      SELECT 
        id, document_type, name, expiry_date, status,
        CASE 
          WHEN expiry_date IS NULL THEN 'no_expiry'
          WHEN expiry_date < CURDATE() THEN 'expired'
          WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
          ELSE 'active'
        END as calculated_status
      FROM institution_documents
      ORDER BY expiry_date
    `);

    console.log('📋 مستندات المؤسسات:');
    rawDocs.forEach(doc => {
      console.log(`   📄 ${doc.name || doc.document_type}`);
      console.log(`      📅 تاريخ الانتهاء: ${doc.expiry_date || 'غير محدد'}`);
      console.log(`      🏷️ الحالة المحفوظة: ${doc.status}`);
      console.log(`      🧮 الحالة المحسوبة: ${doc.calculated_status}`);
      console.log(`      ${doc.status !== doc.calculated_status ? '⚠️ عدم تطابق!' : '✅ متطابق'}`);
      console.log('');
    });

    const [rawSubs] = await connection.execute(`
      SELECT 
        id, name, expiry_date, status,
        CASE 
          WHEN expiry_date < CURDATE() THEN 'expired'
          WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
          ELSE 'active'
        END as calculated_status
      FROM subscriptions
      ORDER BY expiry_date
    `);

    console.log('💳 الاشتراكات:');
    rawSubs.forEach(sub => {
      console.log(`   💳 ${sub.name}`);
      console.log(`      📅 تاريخ الانتهاء: ${sub.expiry_date}`);
      console.log(`      🏷️ الحالة المحفوظة: ${sub.status}`);
      console.log(`      🧮 الحالة المحسوبة: ${sub.calculated_status}`);
      console.log(`      ${sub.status !== sub.calculated_status ? '⚠️ عدم تطابق!' : '✅ متطابق'}`);
      console.log('');
    });

    // 2. فحص الإحصائيات المحسوبة
    console.log('📊 فحص الإحصائيات المحسوبة...');
    
    const [docStats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_by_status,
        COUNT(CASE WHEN expiry_date < CURDATE() THEN 1 END) as expired_by_date,
        COUNT(CASE WHEN status = 'expiring_soon' THEN 1 END) as expiring_soon_by_status,
        COUNT(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND expiry_date >= CURDATE() THEN 1 END) as expiring_soon_by_date,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_by_status,
        COUNT(CASE WHEN expiry_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY) OR expiry_date IS NULL THEN 1 END) as active_by_date
      FROM institution_documents
    `);

    console.log('📋 إحصائيات المستندات:');
    console.log(`   ❌ منتهية (حسب الحالة): ${docStats[0].expired_by_status}`);
    console.log(`   ❌ منتهية (حسب التاريخ): ${docStats[0].expired_by_date}`);
    console.log(`   ⚠️ تنتهي قريباً (حسب الحالة): ${docStats[0].expiring_soon_by_status}`);
    console.log(`   ⚠️ تنتهي قريباً (حسب التاريخ): ${docStats[0].expiring_soon_by_date}`);
    console.log(`   ✅ سارية (حسب الحالة): ${docStats[0].active_by_status}`);
    console.log(`   ✅ سارية (حسب التاريخ): ${docStats[0].active_by_date}`);

    const [subStats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_by_status,
        COUNT(CASE WHEN expiry_date < CURDATE() THEN 1 END) as expired_by_date,
        COUNT(CASE WHEN status = 'expiring_soon' THEN 1 END) as expiring_soon_by_status,
        COUNT(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND expiry_date >= CURDATE() THEN 1 END) as expiring_soon_by_date,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_by_status,
        COUNT(CASE WHEN expiry_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as active_by_date
      FROM subscriptions
    `);

    console.log('\n💳 إحصائيات الاشتراكات:');
    console.log(`   ❌ منتهية (حسب الحالة): ${subStats[0].expired_by_status}`);
    console.log(`   ❌ منتهية (حسب التاريخ): ${subStats[0].expired_by_date}`);
    console.log(`   ⚠️ تنتهي قريباً (حسب الحالة): ${subStats[0].expiring_soon_by_status}`);
    console.log(`   ⚠️ تنتهي قريباً (حسب التاريخ): ${subStats[0].expiring_soon_by_date}`);
    console.log(`   ✅ سارية (حسب الحالة): ${subStats[0].active_by_status}`);
    console.log(`   ✅ سارية (حسب التاريخ): ${subStats[0].active_by_date}`);

    // 3. اختبار API endpoints
    console.log('\n🌐 اختبار API endpoints...');
    
    try {
      const { spawn } = require('child_process');
      
      // اختبار المستندات المنتهية
      console.log('📄 اختبار API المستندات المنتهية...');
      const expiredDocsProcess = spawn('curl', ['-s', 'http://localhost:9004/api/documents?expired=true']);
      
      let expiredDocsResponse = '';
      expiredDocsProcess.stdout.on('data', (data) => {
        expiredDocsResponse += data.toString();
      });
      
      await new Promise((resolve) => {
        expiredDocsProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const response = JSON.parse(expiredDocsResponse);
              console.log(`   📊 API المستندات المنتهية: ${response.count || 0}`);
              console.log(`   📋 البيانات: ${JSON.stringify(response.data?.slice(0, 2) || [])}`);
            } catch (e) {
              console.log(`   ⚠️ استجابة غير صالحة: ${expiredDocsResponse}`);
            }
          }
          resolve();
        });
      });

      // اختبار المستندات التي تنتهي قريباً
      console.log('\n📄 اختبار API المستندات التي تنتهي قريباً...');
      const expiringDocsProcess = spawn('curl', ['-s', 'http://localhost:9004/api/documents?expiring=true&days=30']);
      
      let expiringDocsResponse = '';
      expiringDocsProcess.stdout.on('data', (data) => {
        expiringDocsResponse += data.toString();
      });
      
      await new Promise((resolve) => {
        expiringDocsProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const response = JSON.parse(expiringDocsResponse);
              console.log(`   📊 API المستندات التي تنتهي قريباً: ${response.count || 0}`);
              console.log(`   📋 البيانات: ${JSON.stringify(response.data?.slice(0, 2) || [])}`);
            } catch (e) {
              console.log(`   ⚠️ استجابة غير صالحة: ${expiringDocsResponse}`);
            }
          }
          resolve();
        });
      });

    } catch (error) {
      console.log(`⚠️ خطأ في اختبار API: ${error.message}`);
    }

    // 4. فحص منطق الصفحة الرئيسية
    console.log('\n🏠 محاكاة منطق الصفحة الرئيسية...');
    
    // محاكاة ما يحدث في الصفحة الرئيسية
    const [institutions] = await connection.execute('SELECT * FROM institutions');
    
    let totalExpiredDocs = 0, totalExpiringSoonDocs = 0, totalExpiredSubs = 0, totalExpiringSoonSubs = 0;
    
    for (const institution of institutions) {
      // محاكاة استدعاء API للمستندات المنتهية
      const [expiredDocs] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM institution_documents 
        WHERE institution_id = ? AND status = 'expired'
      `, [institution.id]);
      
      const [expiringSoonDocs] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM institution_documents 
        WHERE institution_id = ? AND status = 'expiring_soon'
      `, [institution.id]);
      
      // محاكاة منطق الاشتراكات
      const [subs] = await connection.execute(`
        SELECT * FROM subscriptions WHERE institution_id = ?
      `, [institution.id]);
      
      const today = new Date();
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const expiredSubs = subs.filter(sub => {
        if (!sub.expiry_date) return false;
        const expiryDate = new Date(sub.expiry_date);
        return expiryDate < today;
      });
      
      const expiringSoonSubs = subs.filter(sub => {
        if (!sub.expiry_date) return false;
        const expiryDate = new Date(sub.expiry_date);
        return expiryDate >= today && expiryDate <= futureDate;
      });
      
      totalExpiredDocs += expiredDocs[0].count;
      totalExpiringSoonDocs += expiringSoonDocs[0].count;
      totalExpiredSubs += expiredSubs.length;
      totalExpiringSoonSubs += expiringSoonSubs.length;
      
      console.log(`   🏢 ${institution.name}:`);
      console.log(`      📄 مستندات منتهية: ${expiredDocs[0].count}`);
      console.log(`      📄 مستندات تنتهي قريباً: ${expiringSoonDocs[0].count}`);
      console.log(`      💳 اشتراكات منتهية: ${expiredSubs.length}`);
      console.log(`      💳 اشتراكات تنتهي قريباً: ${expiringSoonSubs.length}`);
    }
    
    console.log('\n📊 الإحصائيات الإجمالية (محاكاة الصفحة الرئيسية):');
    console.log(`   📄 إجمالي المستندات المنتهية: ${totalExpiredDocs}`);
    console.log(`   📄 إجمالي المستندات التي تنتهي قريباً: ${totalExpiringSoonDocs}`);
    console.log(`   💳 إجمالي الاشتراكات المنتهية: ${totalExpiredSubs}`);
    console.log(`   💳 إجمالي الاشتراكات التي تنتهي قريباً: ${totalExpiringSoonSubs}`);

    // 5. التوصيات
    console.log('\n💡 التحليل والتوصيات:');
    console.log('='.repeat(60));
    
    if (docStats[0].expired_by_status !== docStats[0].expired_by_date) {
      console.log('⚠️ عدم تطابق في إحصائيات المستندات المنتهية');
      console.log(`   📊 حسب الحالة: ${docStats[0].expired_by_status}`);
      console.log(`   📊 حسب التاريخ: ${docStats[0].expired_by_date}`);
      console.log('   🔧 يجب تحديث حالة المستندات');
    }
    
    if (subStats[0].expired_by_status !== subStats[0].expired_by_date) {
      console.log('⚠️ عدم تطابق في إحصائيات الاشتراكات المنتهية');
      console.log(`   📊 حسب الحالة: ${subStats[0].expired_by_status}`);
      console.log(`   📊 حسب التاريخ: ${subStats[0].expired_by_date}`);
      console.log('   🔧 يجب تحديث حالة الاشتراكات');
    }
    
    console.log('\n🎯 خطة الإصلاح:');
    console.log('   1. تحديث حالة جميع المستندات والاشتراكات');
    console.log('   2. التأكد من صحة منطق API');
    console.log('   3. التأكد من صحة منطق الصفحة الرئيسية');
    console.log('   4. إضافة تحديث تلقائي للحالات');

  } catch (error) {
    console.error('❌ خطأ في تحليل الإحصائيات:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugStatsAccuracy();
