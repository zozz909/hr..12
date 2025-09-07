const mysql = require('mysql2/promise');

async function addRenewableDocuments() {
  console.log('📄 إضافة مستندات قابلة للتجديد للمؤسسات...\n');

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123',
    database: 'hr_system'
  });

  try {
    // جلب المؤسسات الموجودة
    const [institutions] = await connection.execute('SELECT id, name FROM institutions LIMIT 3');
    
    if (institutions.length === 0) {
      console.log('❌ لا توجد مؤسسات في قاعدة البيانات');
      return;
    }

    console.log(`📋 إضافة مستندات قابلة للتجديد لـ ${institutions.length} مؤسسة...\n`);

    for (const institution of institutions) {
      console.log(`🏢 إضافة مستندات لمؤسسة: ${institution.name}`);
      
      // مستندات قابلة للتجديد
      const renewableDocuments = [
        {
          name: 'رخصة تجارية',
          documentType: 'license',
          expiryDate: '2024-12-31', // منتهي قريباً
          isRenewable: true
        },
        {
          name: 'شهادة ضريبية',
          documentType: 'tax_certificate',
          expiryDate: '2024-08-15', // منتهي
          isRenewable: true
        },
        {
          name: 'تأمين المبنى',
          documentType: 'other',
          expiryDate: '2025-03-20', // نشط
          isRenewable: true
        }
      ];

      // مستند غير قابل للتجديد
      const nonRenewableDocument = {
        name: 'عقد الإيجار الأصلي',
        documentType: 'other',
        isRenewable: false
      };

      // إضافة المستندات القابلة للتجديد
      for (const doc of renewableDocuments) {
        const docId = `doc-${institution.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          docId,
          institution.id,
          doc.name,
          doc.documentType,
          `/uploads/documents/${docId}.pdf`,
          `/uploads/documents/${docId}.pdf`,
          doc.isRenewable,
          doc.expiryDate,
          status
        ]);

        console.log(`   ✅ ${doc.name} (${status})`);
      }

      // إضافة المستند غير القابل للتجديد
      const nonRenewableDocId = `doc-${institution.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      await connection.execute(`
        INSERT INTO institution_documents (
          id, institution_id, name, document_type, file_path, file_url,
          is_renewable, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        nonRenewableDocId,
        institution.id,
        nonRenewableDocument.name,
        nonRenewableDocument.documentType,
        `/uploads/documents/${nonRenewableDocId}.pdf`,
        `/uploads/documents/${nonRenewableDocId}.pdf`,
        nonRenewableDocument.isRenewable,
        'active'
      ]);

      console.log(`   ✅ ${nonRenewableDocument.name} (غير قابل للتجديد)`);
      console.log('');
    }

    console.log('✅ تم إضافة جميع المستندات بنجاح!');
    console.log('\n📊 ما تم إضافته:');
    console.log('   🔄 مستندات قابلة للتجديد مع أزرار تجديد');
    console.log('   📅 تواريخ انتهاء مختلفة (منتهي، على وشك الانتهاء، نشط)');
    console.log('   📄 مستندات غير قابلة للتجديد بدون أزرار تجديد');
    console.log('   🎨 عرض الحالة والتواريخ في الواجهة');

  } catch (error) {
    console.error('❌ خطأ في إضافة المستندات:', error);
  } finally {
    await connection.end();
  }
}

addRenewableDocuments();
