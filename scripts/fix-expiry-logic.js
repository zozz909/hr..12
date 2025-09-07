const mysql = require('mysql2/promise');

async function fixExpiryLogic() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🔧 إصلاح منطق انتهاء الصلاحية...\n');

    // 1. تحديث حالة الاشتراكات بناءً على تاريخ الانتهاء
    console.log('💳 تحديث حالة الاشتراكات...');
    const [subscriptionUpdate] = await connection.execute(`
      UPDATE subscriptions 
      SET status = CASE 
        WHEN expiry_date < CURDATE() THEN 'expired'
        WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
        ELSE 'active'
      END
    `);
    console.log(`✅ تم تحديث ${subscriptionUpdate.affectedRows} اشتراك`);

    // 2. تحديث حالة مستندات المؤسسات
    console.log('\n🏢 تحديث حالة مستندات المؤسسات...');
    const [institutionDocsUpdate] = await connection.execute(`
      UPDATE institution_documents 
      SET status = CASE 
        WHEN expiry_date IS NULL THEN 'active'
        WHEN expiry_date < CURDATE() THEN 'expired'
        WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
        ELSE 'active'
      END
      WHERE expiry_date IS NOT NULL
    `);
    console.log(`✅ تم تحديث ${institutionDocsUpdate.affectedRows} مستند مؤسسة`);

    // 3. تحديث حالة مستندات الموظفين (إذا كان الجدول موجود)
    console.log('\n👥 تحديث حالة مستندات الموظفين...');
    try {
      const [employeeDocsUpdate] = await connection.execute(`
        UPDATE employee_documents 
        SET status = CASE 
          WHEN expiry_date IS NULL THEN 'active'
          WHEN expiry_date < CURDATE() THEN 'expired'
          WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
          ELSE 'active'
        END
        WHERE expiry_date IS NOT NULL
      `);
      console.log(`✅ تم تحديث ${employeeDocsUpdate.affectedRows} مستند موظف`);
    } catch (error) {
      console.log('ℹ️ جدول مستندات الموظفين غير موجود أو فارغ');
    }

    // 4. إنشاء stored procedure لتحديث الحالات تلقائياً
    console.log('\n⚙️ إنشاء stored procedure للتحديث التلقائي...');
    
    // حذف الإجراء إذا كان موجود
    await connection.execute('DROP PROCEDURE IF EXISTS UpdateExpiryStatuses');
    
    // إنشاء الإجراء الجديد
    await connection.execute(`
      CREATE PROCEDURE UpdateExpiryStatuses()
      BEGIN
        -- تحديث حالة الاشتراكات
        UPDATE subscriptions 
        SET status = CASE 
          WHEN expiry_date < CURDATE() THEN 'expired'
          WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
          ELSE 'active'
        END;
        
        -- تحديث حالة مستندات المؤسسات
        UPDATE institution_documents 
        SET status = CASE 
          WHEN expiry_date IS NULL THEN 'active'
          WHEN expiry_date < CURDATE() THEN 'expired'
          WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
          ELSE 'active'
        END
        WHERE expiry_date IS NOT NULL;
        
        -- تحديث حالة مستندات الموظفين
        UPDATE employee_documents 
        SET status = CASE 
          WHEN expiry_date IS NULL THEN 'active'
          WHEN expiry_date < CURDATE() THEN 'expired'
          WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
          ELSE 'active'
        END
        WHERE expiry_date IS NOT NULL;
      END
    `);
    console.log('✅ تم إنشاء stored procedure بنجاح');

    // 5. تشغيل الإجراء للتأكد من عمله
    console.log('\n🔄 تشغيل الإجراء للتأكد من عمله...');
    await connection.execute('CALL UpdateExpiryStatuses()');
    console.log('✅ تم تشغيل الإجراء بنجاح');

    // 6. فحص النتائج النهائية
    console.log('\n📊 فحص النتائج النهائية...');
    
    const [finalStats] = await connection.execute(`
      SELECT 
        'subscriptions' as table_name,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
        COUNT(CASE WHEN status = 'expiring_soon' THEN 1 END) as expiring_soon_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
      FROM subscriptions
      
      UNION ALL
      
      SELECT 
        'institution_documents' as table_name,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
        COUNT(CASE WHEN status = 'expiring_soon' THEN 1 END) as expiring_soon_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
      FROM institution_documents
    `);

    finalStats.forEach(stat => {
      console.log(`\n📋 ${stat.table_name}:`);
      console.log(`   ❌ منتهية: ${stat.expired_count}`);
      console.log(`   ⚠️ تنتهي قريباً: ${stat.expiring_soon_count}`);
      console.log(`   ✅ سارية: ${stat.active_count}`);
    });

    // 7. إنشاء event scheduler للتحديث اليومي (اختياري)
    console.log('\n⏰ إعداد التحديث التلقائي اليومي...');
    
    // تفعيل event scheduler
    await connection.execute('SET GLOBAL event_scheduler = ON');
    
    // حذف الحدث إذا كان موجود
    await connection.execute('DROP EVENT IF EXISTS daily_expiry_update');
    
    // إنشاء حدث يومي
    await connection.execute(`
      CREATE EVENT daily_expiry_update
      ON SCHEDULE EVERY 1 DAY
      STARTS CURRENT_DATE + INTERVAL 1 DAY
      DO
        CALL UpdateExpiryStatuses()
    `);
    console.log('✅ تم إعداد التحديث التلقائي اليومي');

    console.log('\n🎉 تم إصلاح منطق انتهاء الصلاحية بنجاح!');
    console.log('\n📝 ما تم عمله:');
    console.log('   ✅ تحديث حالة جميع الاشتراكات');
    console.log('   ✅ تحديث حالة جميع مستندات المؤسسات');
    console.log('   ✅ تحديث حالة جميع مستندات الموظفين');
    console.log('   ✅ إنشاء stored procedure للتحديث');
    console.log('   ✅ إعداد تحديث تلقائي يومي');
    
    console.log('\n💡 الآن النظام سيحدث الحالات تلقائياً كل يوم');
    console.log('💡 يمكن تشغيل CALL UpdateExpiryStatuses() يدوياً عند الحاجة');

  } catch (error) {
    console.error('❌ خطأ في إصلاح منطق الانتهاء:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixExpiryLogic();
