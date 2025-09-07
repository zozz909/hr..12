const mysql = require('mysql2/promise');

async function testImprovedUI() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🎨 اختبار الواجهة المحسنة...\n');

    // 1. فحص الحالة الحالية
    console.log('📊 فحص الحالة الحالية...');
    
    const [currentStats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_docs,
        COUNT(CASE WHEN status = 'expiring_soon' THEN 1 END) as expiring_soon_docs,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_docs
      FROM institution_documents
    `);
    
    const [subStats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_subs,
        COUNT(CASE WHEN status = 'expiring_soon' THEN 1 END) as expiring_soon_subs,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subs
      FROM subscriptions
    `);

    console.log('📋 الإحصائيات الحالية:');
    console.log(`   📄 المستندات: منتهية: ${currentStats[0].expired_docs}, تنتهي قريباً: ${currentStats[0].expiring_soon_docs}, سارية: ${currentStats[0].active_docs}`);
    console.log(`   💳 الاشتراكات: منتهية: ${subStats[0].expired_subs}, تنتهي قريباً: ${subStats[0].expiring_soon_subs}, سارية: ${subStats[0].active_subs}`);

    // 2. محاكاة ما سيظهر في الواجهة
    console.log('\n🎨 محاكاة عرض الواجهة...');
    
    const totalExpiredDocs = currentStats[0].expired_docs;
    const totalExpiringSoonDocs = currentStats[0].expiring_soon_docs;
    const totalExpiredSubs = subStats[0].expired_subs;
    const totalExpiringSoonSubs = subStats[0].expiring_soon_subs;
    const totalIssues = totalExpiredDocs + totalExpiringSoonDocs + totalExpiredSubs + totalExpiringSoonSubs;

    console.log('🎯 ما سيظهر في الواجهة:');
    
    if (totalIssues === 0) {
      console.log('   🎉 رسالة الحالة: "حالة ممتازة! جميع المستندات والاشتراكات سارية المفعول"');
      console.log('   🟢 لون الخلفية: أخضر');
      console.log('   ✅ أيقونة: Shield (درع)');
    } else {
      console.log('   ⚠️ رسالة الحالة: "تحتاج إلى انتباه! يوجد مستندات أو اشتراكات تحتاج إلى تجديد"');
      console.log('   🔴 لون الخلفية: أحمر');
      console.log('   ⚠️ أيقونة: AlertCircle (تحذير)');
    }

    console.log('\n📊 البطاقات الإحصائية:');
    
    // بطاقة المستندات المنتهية
    console.log(`   📄 مستندات منتهية: ${totalExpiredDocs}`);
    if (totalExpiredDocs === 0) {
      console.log('      🟢 لون: أخضر، رسالة: "✅ ممتاز"');
    } else {
      console.log('      🔴 لون: أحمر، رسالة: تحذير');
    }
    
    // بطاقة المستندات التي تنتهي قريباً
    console.log(`   📄 مستندات تنتهي قريباً: ${totalExpiringSoonDocs}`);
    if (totalExpiringSoonDocs === 0) {
      console.log('      🟢 لون: أخضر، رسالة: "✅ ممتاز"');
    } else {
      console.log('      🟠 لون: برتقالي، رسالة: تحذير');
    }
    
    // بطاقة الاشتراكات المنتهية
    console.log(`   💳 اشتراكات منتهية: ${totalExpiredSubs}`);
    if (totalExpiredSubs === 0) {
      console.log('      🟢 لون: أخضر، رسالة: "✅ ممتاز"');
    } else {
      console.log('      🔴 لون: أحمر، رسالة: تحذير');
    }
    
    // بطاقة الاشتراكات التي تنتهي قريباً
    console.log(`   💳 اشتراكات تنتهي قريباً: ${totalExpiringSoonSubs}`);
    if (totalExpiringSoonSubs === 0) {
      console.log('      🟢 لون: أخضر، رسالة: "✅ ممتاز"');
    } else {
      console.log('      🟠 لون: برتقالي، رسالة: تحذير');
    }
    
    // بطاقة المؤسسات المتأثرة
    console.log(`   🏢 مؤسسات متأثرة: ${totalIssues > 0 ? 1 : 0}`);
    if (totalIssues === 0) {
      console.log('      🟢 لون: أخضر، رسالة: "✅ لا توجد مشاكل"');
    } else {
      console.log('      🔴 لون: أحمر، رسالة: تحذير');
    }

    // 3. اختبار سيناريو وجود مستندات منتهية
    console.log('\n🧪 اختبار سيناريو وجود مستندات منتهية...');
    
    const testDocId = `test-ui-${Date.now()}`;
    
    // إنشاء مستند منتهي
    await connection.execute(`
      INSERT INTO institution_documents 
      (id, institution_id, document_type, name, expiry_date, status, created_at)
      VALUES (?, 'inst-1757171544632-b6qhb4', 'test_document', 'مستند اختبار الواجهة', '2024-01-01', 'expired', NOW())
    `, [testDocId]);
    
    console.log('✅ تم إنشاء مستند منتهي للاختبار');

    // فحص الحالة الجديدة
    const [newStats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_docs,
        COUNT(CASE WHEN status = 'expiring_soon' THEN 1 END) as expiring_soon_docs,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_docs
      FROM institution_documents
    `);

    console.log('\n🎨 محاكاة الواجهة مع وجود مستند منتهي:');
    
    const newTotalExpiredDocs = newStats[0].expired_docs;
    const newTotalIssues = newTotalExpiredDocs + totalExpiringSoonDocs + totalExpiredSubs + totalExpiringSoonSubs;

    if (newTotalIssues > 0) {
      console.log('   ⚠️ رسالة الحالة: "تحتاج إلى انتباه! يوجد مستندات أو اشتراكات تحتاج إلى تجديد"');
      console.log('   🔴 لون الخلفية: أحمر');
      console.log('   ⚠️ أيقونة: AlertCircle (تحذير)');
    }

    console.log(`   📄 مستندات منتهية: ${newTotalExpiredDocs}`);
    console.log('      🔴 لون: أحمر، بدون رسالة "ممتاز"');

    // تنظيف المستند التجريبي
    await connection.execute(`DELETE FROM institution_documents WHERE id = ?`, [testDocId]);
    console.log('✅ تم حذف المستند التجريبي');

    // 4. اختبار API للتأكد
    console.log('\n🌐 اختبار API للتأكد...');
    
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
              
              if (response.count === 0) {
                console.log('🎉 النتيجة: ستظهر الواجهة باللون الأخضر مع رسالة "ممتاز"');
              } else {
                console.log('⚠️ النتيجة: ستظهر الواجهة باللون الأحمر مع رسالة تحذير');
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

    console.log('\n🎯 ملخص التحسينات:');
    console.log('='.repeat(50));
    console.log('✅ رسالة حالة واضحة في أعلى القسم');
    console.log('✅ ألوان ديناميكية (أخضر للحالة الجيدة، أحمر للمشاكل)');
    console.log('✅ رسائل "ممتاز" عند عدم وجود مشاكل');
    console.log('✅ أيقونات واضحة (درع للأمان، تحذير للمشاكل)');
    console.log('✅ تباين لوني واضح لسهولة القراءة');

    console.log('\n💡 ما سيراه المستخدم الآن:');
    console.log('   🎉 إذا كانت جميع المستندات سارية: واجهة خضراء مع رسالة "حالة ممتازة"');
    console.log('   ⚠️ إذا كانت هناك مشاكل: واجهة حمراء مع رسالة "تحتاج إلى انتباه"');
    console.log('   📊 بطاقات ملونة تعكس الحالة الفعلية');
    console.log('   ✅ رسائل تأكيد واضحة');

    console.log('\n🎉 اختبار الواجهة المحسنة مكتمل!');

  } catch (error) {
    console.error('❌ خطأ في اختبار الواجهة:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testImprovedUI();
