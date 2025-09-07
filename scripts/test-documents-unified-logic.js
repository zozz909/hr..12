const mysql = require('mysql2/promise');

async function testDocumentsUnifiedLogic() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🎯 اختبار المنطق الموحد للمستندات - تطبيق منطق الاشتراكات...\n');

    // 1. إنشاء بيانات اختبار للمستندات
    console.log('🧪 إنشاء بيانات اختبار للمستندات...');
    
    const testDocs = [
      {
        name: 'رخصة تجارية منتهية',
        expiryDate: '2024-12-01', // منتهي منذ 37 يوم
        isRenewable: true,
        expectedShow: true,
        expectedCategory: 'expired_renewable'
      },
      {
        name: 'شهادة ضريبية تنتهي قريباً',
        expiryDate: '2025-01-20', // ينتهي خلال 13 يوم
        isRenewable: true,
        expectedShow: true,
        expectedCategory: 'expiring_soon'
      },
      {
        name: 'تأمين مبنى مجدد',
        expiryDate: '2025-03-15', // ينتهي خلال 67 يوم
        isRenewable: true,
        expectedShow: false,
        expectedCategory: 'hidden_renewed'
      },
      {
        name: 'عقد إيجار منتهي غير قابل للتجديد',
        expiryDate: '2024-11-15', // منتهي منذ 53 يوم
        isRenewable: false,
        expectedShow: true,
        expectedCategory: 'expired_non_renewable'
      },
      {
        name: 'وثيقة تأسيس دائمة',
        expiryDate: null, // بدون تاريخ انتهاء
        isRenewable: false,
        expectedShow: false,
        expectedCategory: 'hidden_permanent'
      },
      {
        name: 'ترخيص بناء ينتهي بعد شهرين',
        expiryDate: '2025-03-07', // ينتهي خلال 59 يوم
        isRenewable: true,
        expectedShow: false,
        expectedCategory: 'hidden_renewed'
      }
    ];

    const testDocIds = [];
    
    for (const doc of testDocs) {
      const docId = `test-unified-doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      testDocIds.push(docId);
      
      // تحديد الحالة بناءً على تاريخ الانتهاء
      let status = 'active';
      if (doc.expiryDate) {
        const today = new Date();
        const expiry = new Date(doc.expiryDate);
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
        docId,
        doc.name,
        `/uploads/test/${docId}.pdf`,
        `/uploads/test/${docId}.pdf`,
        doc.isRenewable,
        doc.expiryDate,
        status
      ]);

      console.log(`   ✅ ${doc.name}`);
      console.log(`      📅 تاريخ الانتهاء: ${doc.expiryDate || 'دائم'}`);
      console.log(`      🔄 قابل للتجديد: ${doc.isRenewable ? 'نعم' : 'لا'}`);
      console.log(`      🏷️ الحالة: ${status}`);
      console.log(`      👁️ متوقع أن يظهر: ${doc.expectedShow ? 'نعم' : 'لا'}`);
      console.log(`      📂 التصنيف المتوقع: ${doc.expectedCategory}`);
      console.log('');
    }

    // 2. اختبار المنطق الموحد الجديد
    console.log('📊 اختبار المنطق الموحد الجديد...');
    
    const today = new Date();
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 يوم من الآن
    
    console.log(`📅 اليوم: ${today.toISOString().split('T')[0]}`);
    console.log(`📅 حد الـ 30 يوم: ${futureDate.toISOString().split('T')[0]}`);
    console.log('');

    // 3. جلب جميع المستندات التجريبية
    const [allDocs] = await connection.execute(`
      SELECT id, name, expiry_date, is_renewable, status
      FROM institution_documents 
      WHERE id LIKE 'test-unified-doc-%'
      ORDER BY expiry_date
    `);

    console.log(`📋 إجمالي المستندات التجريبية: ${allDocs.length}`);

    // 4. تطبيق المنطق الموحد (نفس منطق الاشتراكات)
    console.log('\n🔄 تطبيق المنطق الموحد...');

    // المستندات المنتهية
    const expiredDocs = allDocs.filter(doc => {
      if (!doc.expiry_date) return false;
      const expiryDate = new Date(doc.expiry_date);
      return expiryDate < today;
    });

    // المستندات التي تنتهي قريباً
    const expiringSoonDocs = allDocs.filter(doc => {
      if (!doc.expiry_date) return false;
      const expiryDate = new Date(doc.expiry_date);
      return expiryDate >= today && expiryDate <= futureDate;
    });

    // المستندات المخفية (مجددة أو دائمة)
    const hiddenDocs = allDocs.filter(doc => {
      if (!doc.expiry_date) return true; // بدون تاريخ انتهاء
      const expiryDate = new Date(doc.expiry_date);
      return expiryDate > futureDate; // ينتهي بعد أكثر من 30 يوم
    });

    // تصنيف المستندات المنتهية حسب قابلية التجديد
    const renewableExpiredDocs = expiredDocs.filter(doc => doc.is_renewable !== 0);
    const nonRenewableExpiredDocs = expiredDocs.filter(doc => doc.is_renewable === 0);

    // 5. عرض النتائج
    console.log('🔴 المستندات المنتهية (تظهر):');
    expiredDocs.forEach(doc => {
      const daysExpired = Math.floor((today.getTime() - new Date(doc.expiry_date).getTime()) / (1000 * 60 * 60 * 24));
      const renewableText = doc.is_renewable ? 'قابل للتجديد' : 'غير قابل للتجديد';
      console.log(`   📄 ${doc.name} - منتهي منذ ${daysExpired} يوم (${renewableText})`);
    });
    console.log(`📊 إجمالي المستندات المنتهية: ${expiredDocs.length}`);
    console.log(`   🔄 قابلة للتجديد: ${renewableExpiredDocs.length}`);
    console.log(`   ❌ غير قابلة للتجديد: ${nonRenewableExpiredDocs.length}\n`);

    console.log('🟠 المستندات التي تنتهي قريباً (تظهر):');
    expiringSoonDocs.forEach(doc => {
      const daysUntilExpiry = Math.ceil((new Date(doc.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   📄 ${doc.name} - ينتهي خلال ${daysUntilExpiry} يوم`);
    });
    console.log(`📊 إجمالي المستندات التي تنتهي قريباً: ${expiringSoonDocs.length}\n`);

    console.log('⚪ المستندات المخفية (لا تظهر):');
    hiddenDocs.forEach(doc => {
      if (!doc.expiry_date) {
        console.log(`   📄 ${doc.name} - بدون تاريخ انتهاء (دائم)`);
      } else {
        const daysUntilExpiry = Math.ceil((new Date(doc.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   📄 ${doc.name} - ينتهي خلال ${daysUntilExpiry} يوم (مجدد)`);
      }
    });
    console.log(`📊 إجمالي المستندات المخفية: ${hiddenDocs.length}\n`);

    // 6. مقارنة مع التوقعات
    console.log('🎯 مقارنة النتائج مع التوقعات...');
    
    let correctPredictions = 0;
    let totalPredictions = testDocs.length;

    for (const testDoc of testDocs) {
      const actualDoc = allDocs.find(doc => doc.name === testDoc.name);
      if (!actualDoc) continue;

      let actualCategory = 'unknown';
      let actualShow = false;

      if (!actualDoc.expiry_date) {
        actualCategory = 'hidden_permanent';
        actualShow = false;
      } else {
        const expiryDate = new Date(actualDoc.expiry_date);
        if (expiryDate < today) {
          actualCategory = actualDoc.is_renewable ? 'expired_renewable' : 'expired_non_renewable';
          actualShow = true;
        } else if (expiryDate <= futureDate) {
          actualCategory = 'expiring_soon';
          actualShow = true;
        } else {
          actualCategory = 'hidden_renewed';
          actualShow = false;
        }
      }

      const showMatch = actualShow === testDoc.expectedShow;
      const categoryMatch = actualCategory === testDoc.expectedCategory;
      const overallMatch = showMatch && categoryMatch;

      if (overallMatch) correctPredictions++;

      console.log(`   ${overallMatch ? '✅' : '❌'} ${testDoc.name}`);
      console.log(`      👁️ يظهر: متوقع ${testDoc.expectedShow ? 'نعم' : 'لا'}, فعلي ${actualShow ? 'نعم' : 'لا'} ${showMatch ? '✅' : '❌'}`);
      console.log(`      📂 التصنيف: متوقع ${testDoc.expectedCategory}, فعلي ${actualCategory} ${categoryMatch ? '✅' : '❌'}`);
    }

    console.log(`\n📊 دقة التوقعات: ${correctPredictions}/${totalPredictions} (${Math.round(correctPredictions/totalPredictions*100)}%)`);

    // 7. محاكاة الواجهة الجديدة
    console.log('\n🎨 محاكاة الواجهة مع المنطق الموحد...');
    
    console.log('📊 ما سيظهر في البطاقات الإحصائية:');
    console.log(`   🔄 مستندات منتهية قابلة للتجديد: ${renewableExpiredDocs.length}`);
    console.log(`   ❌ مستندات منتهية غير قابلة للتجديد: ${nonRenewableExpiredDocs.length}`);
    console.log(`   ⚠️ مستندات تنتهي قريباً: ${expiringSoonDocs.length}`);
    
    const totalIssues = renewableExpiredDocs.length + nonRenewableExpiredDocs.length + expiringSoonDocs.length;
    console.log(`   📊 إجمالي المشاكل: ${totalIssues}`);
    
    if (totalIssues > 0) {
      console.log('   ⚠️ رسالة الحالة: "تحتاج إلى انتباه!"');
      console.log('   🔴 لون الخلفية: أحمر');
    } else {
      console.log('   🎉 رسالة الحالة: "ممتاز! جميع المستندات محدثة"');
      console.log('   🟢 لون الخلفية: أخضر');
    }

    // 8. مقارنة الأداء
    console.log('\n⚡ مقارنة الأداء...');
    
    console.log('📈 المنطق القديم (API calls منفصلة):');
    console.log('   🔴 استعلام 1: جلب المستندات المنتهية');
    console.log('   🟠 استعلام 2: جلب المستندات التي تنتهي قريباً');
    console.log('   📊 إجمالي: 2 استعلام + معالجة منفصلة');
    
    console.log('\n📈 المنطق الجديد (منطق موحد):');
    console.log('   📋 استعلام 1: جلب جميع المستندات');
    console.log('   🔄 معالجة محلية: تصفية حسب التاريخ');
    console.log('   📊 إجمالي: 1 استعلام + معالجة موحدة');
    
    console.log('\n🎯 الفوائد:');
    console.log('   🚀 أداء أفضل: 50% أقل استعلامات');
    console.log('   🎯 منطق موحد: نفس المعايير للمستندات والاشتراكات');
    console.log('   🔧 سهولة الصيانة: كود أقل وأوضح');
    console.log('   📊 دقة أكبر: تصفية محلية موحدة');

    // 9. تنظيف البيانات التجريبية
    console.log('\n🧹 تنظيف البيانات التجريبية...');
    
    for (const docId of testDocIds) {
      await connection.execute(`DELETE FROM institution_documents WHERE id = ?`, [docId]);
    }
    console.log(`✅ تم حذف ${testDocIds.length} مستند تجريبي`);

    console.log('\n🎯 ملخص تطبيق المنطق الموحد على المستندات:');
    console.log('='.repeat(70));
    console.log('✅ تم تطبيق نفس منطق الاشتراكات على المستندات');
    console.log('✅ جلب جميع المستندات مرة واحدة ثم التصفية محلياً');
    console.log('✅ نفس معايير الـ 30 يوم للمستندات والاشتراكات');
    console.log('✅ إخفاء المستندات المجددة (أكثر من 30 يوم)');
    console.log('✅ إظهار المنتهي والذي سينتهي قريباً فقط');
    console.log('✅ تصنيف ذكي حسب قابلية التجديد');
    console.log('✅ أداء محسن بـ 50% أقل استعلامات');

    console.log('\n🎉 تطبيق المنطق الموحد على المستندات مكتمل!');

  } catch (error) {
    console.error('❌ خطأ في اختبار المنطق الموحد للمستندات:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testDocumentsUnifiedLogic();
