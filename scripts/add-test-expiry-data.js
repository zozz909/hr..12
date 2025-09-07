const mysql = require('mysql2/promise');

async function addTestExpiryData() {
  let connection;
  
  try {
    // إنشاء الاتصال بقاعدة البيانات
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // جلب جميع المؤسسات
    const [institutions] = await connection.execute(`
      SELECT id, name FROM institutions LIMIT 5
    `);

    console.log(`تم العثور على ${institutions.length} مؤسسة`);

    const today = new Date();

    for (const institution of institutions) {
      console.log(`\n🏢 إضافة بيانات تجريبية للمؤسسة: ${institution.name}`);
      
      // إضافة اشتراكات متنوعة
      const subscriptions = [
        { name: 'قوى', icon: 'ShieldCheck', days: -10 }, // منتهي منذ 10 أيام
        { name: 'أبشر أعمال', icon: 'BookUser', days: 15 }, // ينتهي خلال 15 يوم
        { name: 'التأمينات الاجتماعية', icon: 'Users', days: -5 }, // منتهي منذ 5 أيام
        { name: 'الزكاة والضريبة', icon: 'CreditCard', days: 25 }, // ينتهي خلال 25 يوم
        { name: 'الجوازات', icon: 'FileText', days: 120 } // نشط
      ];

      // إضافة 2-3 اشتراكات لكل مؤسسة
      const numSubs = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 0; i < numSubs; i++) {
        const sub = subscriptions[i % subscriptions.length];
        const subId = `sub-${institution.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        const expiryDate = new Date(today.getTime() + sub.days * 24 * 60 * 60 * 1000);
        
        // تحديد الحالة
        let status = 'active';
        if (sub.days < 0) {
          status = 'expired';
        } else if (sub.days <= 30) {
          status = 'expiring_soon';
        }

        await connection.execute(`
          INSERT INTO subscriptions (
            id, institution_id, name, icon, expiry_date, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          subId,
          institution.id,
          sub.name,
          sub.icon,
          expiryDate.toISOString().split('T')[0],
          status
        ]);

        console.log(`  ✅ اشتراك: ${sub.name} (${status})`);
      }

      // إضافة مستندات متنوعة
      const documents = [
        { name: 'الرخصة التجارية', type: 'license', days: -20, renewable: true },
        { name: 'شهادة الضريبة', type: 'tax_certificate', days: 10, renewable: true },
        { name: 'تصريح البلدية', type: 'other', days: -3, renewable: true },
        { name: 'شهادة الجودة', type: 'other', days: 45, renewable: false },
        { name: 'عقد الإيجار', type: 'other', days: 180, renewable: true }
      ];

      // إضافة 1-2 مستندات لكل مؤسسة
      const numDocs = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < numDocs; i++) {
        const doc = documents[i % documents.length];
        const docId = `doc-${institution.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        let expiryDate = null;
        let status = 'active';
        
        if (doc.renewable) {
          expiryDate = new Date(today.getTime() + doc.days * 24 * 60 * 60 * 1000);
          
          if (doc.days < 0) {
            status = 'expired';
          } else if (doc.days <= 30) {
            status = 'expiring_soon';
          }
        }

        await connection.execute(`
          INSERT INTO institution_documents (
            id, institution_id, name, document_type, is_renewable, expiry_date, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          docId,
          institution.id,
          `${doc.name} - ${institution.name}`,
          doc.type,
          doc.renewable,
          expiryDate ? expiryDate.toISOString().split('T')[0] : null,
          status
        ]);

        console.log(`  📄 مستند: ${doc.name} (${status})`);
      }
    }

    // عرض إحصائيات نهائية
    const [docStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'expiring_soon' THEN 1 ELSE 0 END) as expiring_soon,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM institution_documents
    `);

    const [subStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'expiring_soon' THEN 1 ELSE 0 END) as expiring_soon,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM subscriptions
    `);

    console.log('\n📊 إحصائيات نهائية:');
    console.log('\n📄 المستندات:');
    console.log(`إجمالي: ${docStats[0].total}`);
    console.log(`منتهية: ${docStats[0].expired}`);
    console.log(`تنتهي قريباً: ${docStats[0].expiring_soon}`);
    console.log(`نشطة: ${docStats[0].active}`);

    console.log('\n💳 الاشتراكات:');
    console.log(`إجمالي: ${subStats[0].total}`);
    console.log(`منتهية: ${subStats[0].expired}`);
    console.log(`تنتهي قريباً: ${subStats[0].expiring_soon}`);
    console.log(`نشطة: ${subStats[0].active}`);

    console.log('\n🎉 تم إضافة البيانات التجريبية بنجاح!');

  } catch (error) {
    console.error('خطأ في إضافة البيانات التجريبية:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
addTestExpiryData();
