const mysql = require('mysql2/promise');

async function addTestRenewableDocuments() {
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

    const sampleDocuments = [
      { name: 'الرخصة التجارية المحدثة', type: 'license', renewable: true },
      { name: 'شهادة الضريبة الجديدة', type: 'tax_certificate', renewable: true },
      { name: 'تصريح العمل', type: 'other', renewable: true },
      { name: 'شهادة الجودة', type: 'other', renewable: false },
      { name: 'عقد الإيجار', type: 'other', renewable: true }
    ];

    for (const institution of institutions) {
      console.log(`إضافة مستندات للمؤسسة: ${institution.name}`);
      
      // إضافة 2-3 مستندات لكل مؤسسة
      const numDocs = Math.floor(Math.random() * 2) + 2; // 2 أو 3 مستندات
      
      for (let i = 0; i < numDocs; i++) {
        const doc = sampleDocuments[i % sampleDocuments.length];
        const docId = `doc-${institution.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        const today = new Date();
        let expiryDate = null;
        let status = 'active';
        
        if (doc.renewable) {
          // إنشاء تواريخ انتهاء متنوعة
          const scenarios = [
            -15, // منتهي منذ 15 يوم
            -5,  // منتهي منذ 5 أيام
            15,  // ينتهي خلال 15 يوم (expiring_soon)
            25,  // ينتهي خلال 25 يوم (expiring_soon)
            60,  // ينتهي خلال 60 يوم (active)
            180, // ينتهي خلال 180 يوم (active)
          ];
          
          const randomDays = scenarios[Math.floor(Math.random() * scenarios.length)];
          expiryDate = new Date(today.getTime() + randomDays * 24 * 60 * 60 * 1000);
          
          // تحديد الحالة
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry < 0) {
            status = 'expired';
          } else if (daysUntilExpiry <= 30) {
            status = 'expiring_soon';
          } else {
            status = 'active';
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

        console.log(`  ✓ تم إضافة: ${doc.name} (${status})`);
      }
    }

    console.log('تم إضافة جميع المستندات التجريبية بنجاح!');

    // عرض إحصائيات
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_renewable = 1 THEN 1 ELSE 0 END) as renewable,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'expiring_soon' THEN 1 ELSE 0 END) as expiring_soon,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM institution_documents
    `);

    console.log('\n📊 إحصائيات المستندات:');
    console.log(`إجمالي المستندات: ${stats[0].total}`);
    console.log(`قابلة للتجديد: ${stats[0].renewable}`);
    console.log(`منتهية الصلاحية: ${stats[0].expired}`);
    console.log(`تنتهي قريباً: ${stats[0].expiring_soon}`);
    console.log(`نشطة: ${stats[0].active}`);

  } catch (error) {
    console.error('خطأ في إضافة المستندات التجريبية:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
addTestRenewableDocuments();
