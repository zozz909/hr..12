const mysql = require('mysql2/promise');

async function updateExistingDocuments() {
  console.log('🔄 تحديث المستندات الموجودة لتكون قابلة للتجديد...\n');

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123',
    database: 'hr_system'
  });

  try {
    // جلب المستندات الموجودة
    const [documents] = await connection.execute(`
      SELECT id, name, document_type, institution_id 
      FROM institution_documents 
      WHERE is_renewable = 0
      LIMIT 10
    `);

    console.log(`📋 تحديث ${documents.length} مستند...\n`);

    for (const doc of documents) {
      // تحديد إذا كان المستند قابل للتجديد بناءً على نوعه
      const renewableTypes = ['license', 'tax_certificate', 'commercial_record'];
      const isRenewable = renewableTypes.includes(doc.document_type) || 
                         doc.name.includes('رخصة') || 
                         doc.name.includes('شهادة') ||
                         doc.name.includes('تأمين');

      if (isRenewable) {
        // إنشاء تاريخ انتهاء عشوائي
        const today = new Date();
        const randomDays = Math.floor(Math.random() * 365) - 180; // من -180 إلى +185 يوم
        const expiryDate = new Date(today.getTime() + randomDays * 24 * 60 * 60 * 1000);
        
        // تحديد الحالة
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        let status = 'active';
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 30) {
          status = 'expiring_soon';
        }

        // تحديث المستند
        await connection.execute(`
          UPDATE institution_documents 
          SET is_renewable = 1, expiry_date = ?, status = ?
          WHERE id = ?
        `, [expiryDate.toISOString().split('T')[0], status, doc.id]);

        console.log(`✅ ${doc.name} - قابل للتجديد: نعم - ينتهي: ${expiryDate.toLocaleDateString('ar-SA')} - الحالة: ${status}`);
      } else {
        console.log(`⚪ ${doc.name} - قابل للتجديد: لا (غير قابل للتجديد)`);
      }
    }

    // عرض الإحصائيات النهائية
    console.log('\n📊 الإحصائيات النهائية:');
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(is_renewable) as renewable,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'expiring_soon' THEN 1 ELSE 0 END) as expiring_soon,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM institution_documents
    `);

    const stat = stats[0];
    console.log(`   📄 إجمالي المستندات: ${stat.total}`);
    console.log(`   🔄 قابلة للتجديد: ${stat.renewable}`);
    console.log(`   🚨 منتهية: ${stat.expired}`);
    console.log(`   ⚠️ على وشك الانتهاء: ${stat.expiring_soon}`);
    console.log(`   ✅ نشطة: ${stat.active}`);

    console.log('\n🎉 تم التحديث بنجاح! الآن يمكنك رؤية أزرار التجديد في واجهة المستخدم.');

  } catch (error) {
    console.error('❌ خطأ في تحديث المستندات:', error);
  } finally {
    await connection.end();
  }
}

updateExistingDocuments();
