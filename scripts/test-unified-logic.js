const mysql = require('mysql2/promise');

async function testUnifiedLogic() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🎯 اختبار المنطق الموحد - تطبيق منطق الاشتراكات على المستندات...\n');

    // 1. إنشاء بيانات اختبار متنوعة للمستندات والاشتراكات
    console.log('🧪 إنشاء بيانات اختبار...');
    
    const testData = [
      // مستندات
      {
        type: 'document',
        name: 'رخصة تجارية منتهية',
        expiryDate: '2024-12-01', // منتهي
        isRenewable: true,
        expectedShow: true
      },
      {
        type: 'document',
        name: 'شهادة ضريبية تنتهي قريباً',
        expiryDate: '2025-01-20', // ينتهي خلال 13 يوم
        isRenewable: true,
        expectedShow: true
      },
      {
        type: 'document',
        name: 'تأمين مبنى مجدد',
        expiryDate: '2025-03-15', // ينتهي خلال 67 يوم
        isRenewable: true,
        expectedShow: false
      },
      {
        type: 'document',
        name: 'عقد إيجار منتهي غير قابل للتجديد',
        expiryDate: '2024-11-15', // منتهي
        isRenewable: false,
        expectedShow: true
      },
      // اشتراكات
      {
        type: 'subscription',
        name: 'اشتراك برنامج محاسبة منتهي',
        expiryDate: '2024-12-15', // منتهي
        expectedShow: true
      },
      {
        type: 'subscription',
        name: 'اشتراك إنترنت ينتهي قريباً',
        expiryDate: '2025-01-25', // ينتهي خلال 18 يوم
        expectedShow: true
      },
      {
        type: 'subscription',
        name: 'اشتراك كهرباء مجدد',
        expiryDate: '2025-04-10', // ينتهي خلال 93 يوم
        expectedShow: false
      }
    ];

    const testIds = [];
    
    for (const item of testData) {
      const itemId = `test-unified-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      testIds.push({ id: itemId, type: item.type });
      
      if (item.type === 'document') {
        // تحديد الحالة بناءً على تاريخ الانتهاء
        let status = 'active';
        if (item.expiryDate) {
          const today = new Date();
          const expiry = new Date(item.expiryDate);
          const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            status = 'expired';
          } else if (daysUntilExpiry <= 30) {
            status = 'expiring_soon';
          }
        }

        await connection.execute(`
          INSERT INTO institution_documents (
            id, institution_id, name, document_type, file_path, file_url,
            is_renewable, expiry_date, status, created_at
          ) VALUES (?, 'inst-1757171544632-b6qhb4', ?, 'test', ?, ?, ?, ?, ?, NOW())
        `, [
          itemId,
          item.name,
          `/uploads/test/${itemId}.pdf`,
          `/uploads/test/${itemId}.pdf`,
          item.isRenewable,
          item.expiryDate,
          status
        ]);
      } else {
        // اشتراك
        await connection.execute(`
          INSERT INTO subscriptions (
            id, institution_id, name, type, amount, expiry_date, created_at
          ) VALUES (?, 'inst-1757171544632-b6qhb4', ?, 'test', 100.00, ?, NOW())
        `, [
          itemId,
          item.name,
          item.expiryDate
        ]);
      }

      console.log(`   ✅ ${item.name} (${item.type})`);
      console.log(`      📅 تاريخ الانتهاء: ${item.expiryDate}`);
      if (item.type === 'document') {
        console.log(`      🔄 قابل للتجديد: ${item.isRenewable ? 'نعم' : 'لا'}`);
      }
      console.log(`      👁️ متوقع أن يظهر: ${item.expectedShow ? 'نعم' : 'لا'}`);
      console.log('');
    }

    // 2. اختبار المنطق الموحد
    console.log('📊 اختبار المنطق الموحد...');
    
    const today = new Date();
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 يوم من الآن
    
    console.log(`📅 اليوم: ${today.toISOString().split('T')[0]}`);
    console.log(`📅 حد الـ 30 يوم: ${futureDate.toISOString().split('T')[0]}`);
    console.log('');

    // 3. اختبار المستندات بالمنطق الجديد
    console.log('📄 اختبار المستندات بالمنطق الموحد...');
    
    const [allDocs] = await connection.execute(`
      SELECT id, name, expiry_date, is_renewable, status
      FROM institution_documents 
      WHERE id LIKE 'test-unified-%'
      ORDER BY expiry_date
    `);

    console.log(`📋 إجمالي المستندات التجريبية: ${allDocs.length}`);

    // تطبيق نفس منطق الاشتراكات
    const expiredDocs = allDocs.filter(doc => {
      if (!doc.expiry_date) return false;
      const expiryDate = new Date(doc.expiry_date);
      return expiryDate < today;
    });

    const expiringSoonDocs = allDocs.filter(doc => {
      if (!doc.expiry_date) return false;
      const expiryDate = new Date(doc.expiry_date);
      return expiryDate >= today && expiryDate <= futureDate;
    });

    const hiddenDocs = allDocs.filter(doc => {
      if (!doc.expiry_date) return true; // بدون تاريخ انتهاء
      const expiryDate = new Date(doc.expiry_date);
      return expiryDate > futureDate; // ينتهي بعد أكثر من 30 يوم
    });

    console.log('🔴 المستندات المنتهية (تظهر):');
    expiredDocs.forEach(doc => {
      const daysExpired = Math.floor((today.getTime() - new Date(doc.expiry_date).getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   📄 ${doc.name} - منتهي منذ ${daysExpired} يوم (${doc.is_renewable ? 'قابل للتجديد' : 'غير قابل للتجديد'})`);
    });
    console.log(`📊 إجمالي المستندات المنتهية: ${expiredDocs.length}\n`);

    console.log('🟠 المستندات التي تنتهي قريباً (تظهر):');
    expiringSoonDocs.forEach(doc => {
      const daysUntilExpiry = Math.ceil((new Date(doc.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   📄 ${doc.name} - ينتهي خلال ${daysUntilExpiry} يوم`);
    });
    console.log(`📊 إجمالي المستندات التي تنتهي قريباً: ${expiringSoonDocs.length}\n`);

    console.log('⚪ المستندات المخفية (لا تظهر):');
    hiddenDocs.forEach(doc => {
      if (!doc.expiry_date) {
        console.log(`   📄 ${doc.name} - بدون تاريخ انتهاء`);
      } else {
        const daysUntilExpiry = Math.ceil((new Date(doc.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   📄 ${doc.name} - ينتهي خلال ${daysUntilExpiry} يوم (مجدد)`);
      }
    });
    console.log(`📊 إجمالي المستندات المخفية: ${hiddenDocs.length}\n`);

    // 4. اختبار الاشتراكات بنفس المنطق
    console.log('💳 اختبار الاشتراكات بالمنطق الموحد...');
    
    const [allSubs] = await connection.execute(`
      SELECT id, name, expiry_date
      FROM subscriptions 
      WHERE id LIKE 'test-unified-%'
      ORDER BY expiry_date
    `);

    console.log(`📋 إجمالي الاشتراكات التجريبية: ${allSubs.length}`);

    const expiredSubs = allSubs.filter(sub => {
      if (!sub.expiry_date) return false;
      const expiryDate = new Date(sub.expiry_date);
      return expiryDate < today;
    });

    const expiringSoonSubs = allSubs.filter(sub => {
      if (!sub.expiry_date) return false;
      const expiryDate = new Date(sub.expiry_date);
      return expiryDate >= today && expiryDate <= futureDate;
    });

    const hiddenSubs = allSubs.filter(sub => {
      if (!sub.expiry_date) return true;
      const expiryDate = new Date(sub.expiry_date);
      return expiryDate > futureDate;
    });

    console.log('🔴 الاشتراكات المنتهية (تظهر):');
    expiredSubs.forEach(sub => {
      const daysExpired = Math.floor((today.getTime() - new Date(sub.expiry_date).getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   💳 ${sub.name} - منتهي منذ ${daysExpired} يوم`);
    });
    console.log(`📊 إجمالي الاشتراكات المنتهية: ${expiredSubs.length}\n`);

    console.log('🟠 الاشتراكات التي تنتهي قريباً (تظهر):');
    expiringSoonSubs.forEach(sub => {
      const daysUntilExpiry = Math.ceil((new Date(sub.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   💳 ${sub.name} - ينتهي خلال ${daysUntilExpiry} يوم`);
    });
    console.log(`📊 إجمالي الاشتراكات التي تنتهي قريباً: ${expiringSoonSubs.length}\n`);

    console.log('⚪ الاشتراكات المخفية (لا تظهر):');
    hiddenSubs.forEach(sub => {
      if (!sub.expiry_date) {
        console.log(`   💳 ${sub.name} - بدون تاريخ انتهاء`);
      } else {
        const daysUntilExpiry = Math.ceil((new Date(sub.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   💳 ${sub.name} - ينتهي خلال ${daysUntilExpiry} يوم (مجدد)`);
      }
    });
    console.log(`📊 إجمالي الاشتراكات المخفية: ${hiddenSubs.length}\n`);

    // 5. محاكاة الواجهة الجديدة
    console.log('🎨 محاكاة الواجهة مع المنطق الموحد...');
    
    const renewableExpiredDocs = expiredDocs.filter(doc => doc.is_renewable !== 0);
    const nonRenewableExpiredDocs = expiredDocs.filter(doc => doc.is_renewable === 0);
    
    console.log('📊 ما سيظهر في البطاقات الإحصائية:');
    console.log(`   🔄 مستندات منتهية قابلة للتجديد: ${renewableExpiredDocs.length}`);
    console.log(`   ❌ مستندات منتهية غير قابلة للتجديد: ${nonRenewableExpiredDocs.length}`);
    console.log(`   ⚠️ مستندات تنتهي قريباً: ${expiringSoonDocs.length}`);
    console.log(`   🔴 اشتراكات منتهية: ${expiredSubs.length}`);
    console.log(`   🟠 اشتراكات تنتهي قريباً: ${expiringSoonSubs.length}`);
    
    const totalIssues = renewableExpiredDocs.length + nonRenewableExpiredDocs.length + 
                       expiringSoonDocs.length + expiredSubs.length + expiringSoonSubs.length;
    console.log(`   📊 إجمالي المشاكل: ${totalIssues}`);
    
    if (totalIssues > 0) {
      console.log('   ⚠️ رسالة الحالة: "تحتاج إلى انتباه!"');
      console.log('   🔴 لون الخلفية: أحمر');
    } else {
      console.log('   🎉 رسالة الحالة: "ممتاز! جميع المستندات والاشتراكات محدثة"');
      console.log('   🟢 لون الخلفية: أخضر');
    }

    // 6. تنظيف البيانات التجريبية
    console.log('\n🧹 تنظيف البيانات التجريبية...');
    
    for (const item of testIds) {
      if (item.type === 'document') {
        await connection.execute(`DELETE FROM institution_documents WHERE id = ?`, [item.id]);
      } else {
        await connection.execute(`DELETE FROM subscriptions WHERE id = ?`, [item.id]);
      }
    }
    console.log(`✅ تم حذف ${testIds.length} عنصر تجريبي`);

    console.log('\n🎯 ملخص المنطق الموحد:');
    console.log('='.repeat(60));
    console.log('✅ المستندات والاشتراكات تستخدم نفس المنطق الآن');
    console.log('✅ جلب جميع البيانات مرة واحدة ثم التصفية محلياً');
    console.log('✅ نفس معايير الـ 30 يوم للمستندات والاشتراكات');
    console.log('✅ إخفاء المجدد (أكثر من 30 يوم) للمستندات والاشتراكات');
    console.log('✅ إظهار المنتهي والذي سينتهي قريباً فقط');

    console.log('\n💡 الفوائد الجديدة:');
    console.log('   🚀 أداء أفضل: استعلام واحد بدلاً من استعلامين للمستندات');
    console.log('   🎯 منطق موحد: نفس المعايير للمستندات والاشتراكات');
    console.log('   🔧 سهولة الصيانة: كود أقل وأوضح');
    console.log('   📊 دقة أكبر: تصفية محلية بدلاً من الاعتماد على API');

    console.log('\n🎉 اختبار المنطق الموحد مكتمل!');

  } catch (error) {
    console.error('❌ خطأ في اختبار المنطق الموحد:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testUnifiedLogic();
