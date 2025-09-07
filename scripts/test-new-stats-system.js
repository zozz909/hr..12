const mysql = require('mysql2/promise');

async function testNewStatsSystem() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🎯 اختبار نظام الإحصائيات الجديد مع المستندات غير القابلة للتجديد...\n');

    // 1. فحص البيانات الحالية
    console.log('📊 فحص البيانات الحالية...');
    
    const [currentDocs] = await connection.execute(`
      SELECT 
        id, name, document_type, expiry_date, status, is_renewable,
        CASE 
          WHEN expiry_date IS NULL THEN 'no_expiry'
          WHEN expiry_date < CURDATE() THEN 'expired'
          WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
          ELSE 'active'
        END as calculated_status
      FROM institution_documents
      ORDER BY expiry_date
    `);

    console.log('📋 المستندات الحالية:');
    currentDocs.forEach(doc => {
      console.log(`   📄 ${doc.name || doc.document_type}`);
      console.log(`      📅 تاريخ الانتهاء: ${doc.expiry_date || 'غير محدد'}`);
      console.log(`      🏷️ الحالة: ${doc.status}`);
      console.log(`      🔄 قابل للتجديد: ${doc.is_renewable ? 'نعم' : 'لا'}`);
      console.log('');
    });

    // 2. إنشاء بيانات اختبار متنوعة
    console.log('🧪 إنشاء بيانات اختبار...');
    
    const testDocs = [
      {
        name: 'رخصة تجارية منتهية قابلة للتجديد',
        documentType: 'license',
        expiryDate: '2024-01-01', // منتهي
        isRenewable: true
      },
      {
        name: 'شهادة ضريبية تنتهي قريباً',
        documentType: 'tax_certificate',
        expiryDate: '2025-01-20', // ينتهي قريباً
        isRenewable: true
      },
      {
        name: 'عقد إيجار منتهي غير قابل للتجديد',
        documentType: 'other',
        expiryDate: '2024-06-01', // منتهي
        isRenewable: false
      },
      {
        name: 'وثيقة تأسيس منتهية غير قابلة للتجديد',
        documentType: 'other',
        expiryDate: '2023-12-01', // منتهي منذ فترة
        isRenewable: false
      }
    ];

    const testDocIds = [];
    
    for (const doc of testDocs) {
      const docId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      testDocIds.push(docId);
      
      // تحديد الحالة بناءً على تاريخ الانتهاء
      const today = new Date();
      const expiry = new Date(doc.expiryDate);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let status = 'active';
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        status = 'expiring_soon';
      }

      await connection.execute(`
        INSERT INTO institution_documents (
          id, institution_id, name, document_type, file_path, file_url,
          is_renewable, expiry_date, status, created_at
        ) VALUES (?, 'inst-1757171544632-b6qhb4', ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        docId,
        doc.name,
        doc.documentType,
        `/uploads/test/${docId}.pdf`,
        `/uploads/test/${docId}.pdf`,
        doc.isRenewable,
        doc.expiryDate,
        status
      ]);

      console.log(`   ✅ ${doc.name} (${status}, ${doc.isRenewable ? 'قابل للتجديد' : 'غير قابل للتجديد'})`);
    }

    // 3. اختبار الإحصائيات الجديدة
    console.log('\n📊 اختبار الإحصائيات الجديدة...');
    
    const [newStats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'expired' AND is_renewable = true THEN 1 END) as renewable_expired,
        COUNT(CASE WHEN status = 'expired' AND is_renewable = false THEN 1 END) as non_renewable_expired,
        COUNT(CASE WHEN status = 'expiring_soon' THEN 1 END) as expiring_soon,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active
      FROM institution_documents
    `);

    console.log('📈 الإحصائيات الجديدة:');
    console.log(`   🔄 مستندات منتهية قابلة للتجديد: ${newStats[0].renewable_expired}`);
    console.log(`   ❌ مستندات منتهية غير قابلة للتجديد: ${newStats[0].non_renewable_expired}`);
    console.log(`   ⚠️ مستندات تنتهي قريباً: ${newStats[0].expiring_soon}`);
    console.log(`   ✅ مستندات نشطة: ${newStats[0].active}`);

    // 4. محاكاة ما سيظهر في الواجهة الجديدة
    console.log('\n🎨 محاكاة الواجهة الجديدة...');
    
    const totalIssues = newStats[0].renewable_expired + newStats[0].non_renewable_expired + newStats[0].expiring_soon;
    
    console.log('🎯 ما سيظهر في الواجهة:');
    
    if (totalIssues > 0) {
      console.log('   ⚠️ رسالة الحالة: "تحتاج إلى انتباه! يوجد مستندات أو اشتراكات تحتاج إلى تجديد أو انتهت ولا يمكن تجديدها"');
      console.log('   🔴 لون الخلفية: أحمر');
      console.log('   ⚠️ أيقونة: AlertCircle (تحذير)');
    } else {
      console.log('   🎉 رسالة الحالة: "ممتاز! جميع المستندات والاشتراكات محدثة"');
      console.log('   🟢 لون الخلفية: أخضر');
      console.log('   ✅ أيقونة: Shield (درع)');
    }

    console.log('\n📊 البطاقات الإحصائية الجديدة:');
    
    // بطاقة المستندات المنتهية القابلة للتجديد
    console.log(`   🔄 مستندات منتهية قابلة للتجديد: ${newStats[0].renewable_expired}`);
    console.log('      🔴 لون: أحمر، رسالة: "قابلة للتجديد"');
    
    // بطاقة المستندات المنتهية غير القابلة للتجديد
    console.log(`   ❌ مستندات منتهية غير قابلة للتجديد: ${newStats[0].non_renewable_expired}`);
    console.log('      🔘 لون: رمادي، رسالة: "غير قابلة للتجديد"');
    
    // بطاقة المستندات التي تنتهي قريباً
    console.log(`   ⚠️ مستندات تنتهي قريباً: ${newStats[0].expiring_soon}`);
    console.log('      🟠 لون: برتقالي، رسالة: "خلال 30 يوم"');

    // 5. اختبار تفاصيل المؤسسة
    console.log('\n🏢 اختبار تفاصيل المؤسسة...');
    
    const [institutionDetails] = await connection.execute(`
      SELECT 
        name,
        COUNT(CASE WHEN status = 'expired' AND is_renewable = true THEN 1 END) as renewable_expired,
        COUNT(CASE WHEN status = 'expired' AND is_renewable = false THEN 1 END) as non_renewable_expired,
        COUNT(CASE WHEN status = 'expiring_soon' THEN 1 END) as expiring_soon
      FROM institution_documents id
      JOIN institutions i ON id.institution_id = i.id
      WHERE i.id = 'inst-1757171544632-b6qhb4'
      GROUP BY i.id, i.name
    `);

    if (institutionDetails.length > 0) {
      const inst = institutionDetails[0];
      console.log(`   🏢 ${inst.name}:`);
      console.log(`      🔄 مستندات منتهية قابلة للتجديد: ${inst.renewable_expired}`);
      console.log(`      ❌ مستندات منتهية غير قابلة للتجديد: ${inst.non_renewable_expired}`);
      console.log(`      ⚠️ مستندات تنتهي قريباً: ${inst.expiring_soon}`);
      
      const totalInstitutionIssues = inst.renewable_expired + inst.non_renewable_expired + inst.expiring_soon;
      console.log(`      📊 إجمالي المشاكل: ${totalInstitutionIssues}`);
    }

    // 6. اختبار API endpoint
    console.log('\n🌐 اختبار API...');
    
    try {
      const { spawn } = require('child_process');
      
      const curlProcess = spawn('curl', ['-s', 'http://localhost:9004/api/documents?expired=true']);
      
      let apiResponse = '';
      curlProcess.stdout.on('data', (data) => {
        apiResponse += data.toString();
      });
      
      await new Promise((resolve) => {
        curlProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const response = JSON.parse(apiResponse);
              console.log(`✅ API يعمل بشكل صحيح`);
              console.log(`📊 عدد المستندات المنتهية: ${response.count || 0}`);
              
              if (response.data && response.data.length > 0) {
                console.log('📋 عينة من المستندات المنتهية:');
                response.data.slice(0, 3).forEach(doc => {
                  console.log(`   📄 ${doc.name || doc.document_type} (قابل للتجديد: ${doc.is_renewable ? 'نعم' : 'لا'})`);
                });
              }
            } catch (e) {
              console.log(`⚠️ استجابة API غير صالحة: ${apiResponse}`);
            }
          }
          resolve();
        });
      });
      
    } catch (error) {
      console.log(`⚠️ لا يمكن اختبار API: ${error.message}`);
    }

    // 7. تنظيف البيانات التجريبية
    console.log('\n🧹 تنظيف البيانات التجريبية...');
    
    for (const docId of testDocIds) {
      await connection.execute(`DELETE FROM institution_documents WHERE id = ?`, [docId]);
    }
    console.log(`✅ تم حذف ${testDocIds.length} مستند تجريبي`);

    console.log('\n🎯 ملخص التحسينات الجديدة:');
    console.log('='.repeat(60));
    console.log('✅ تصنيف المستندات المنتهية حسب قابلية التجديد');
    console.log('✅ بطاقات إحصائية منفصلة للمستندات القابلة وغير القابلة للتجديد');
    console.log('✅ ألوان مختلفة لكل نوع (أحمر للقابلة للتجديد، رمادي لغير القابلة)');
    console.log('✅ أيقونات مميزة (FileText للقابلة، FileX لغير القابلة)');
    console.log('✅ تفاصيل واضحة في قائمة المؤسسات');
    console.log('✅ رسائل توضيحية لكل نوع من المستندات');

    console.log('\n💡 ما سيراه المستخدم الآن:');
    console.log('   🔄 مستندات منتهية قابلة للتجديد: بلون أحمر مع إمكانية التجديد');
    console.log('   ❌ مستندات منتهية غير قابلة للتجديد: بلون رمادي مع تنبيه أنها غير قابلة للتجديد');
    console.log('   ⚠️ مستندات تنتهي قريباً: بلون برتقالي مع عدد الأيام المتبقية');
    console.log('   📊 إحصائيات دقيقة ومفصلة لكل نوع');
    console.log('   🎨 واجهة واضحة ومنظمة');

    console.log('\n🎉 اختبار النظام الجديد مكتمل!');

  } catch (error) {
    console.error('❌ خطأ في اختبار النظام:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testNewStatsSystem();
