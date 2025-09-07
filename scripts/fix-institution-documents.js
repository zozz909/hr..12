const mysql = require('mysql2/promise');

async function fixInstitutionDocuments() {
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

    // جلب جميع مستندات المؤسسات
    const [documents] = await connection.execute(`
      SELECT id, name, document_type, is_renewable, expiry_date, status
      FROM institution_documents
    `);

    console.log(`تم العثور على ${documents.length} مستند`);

    for (const doc of documents) {
      let needsUpdate = false;
      let updateFields = [];
      let updateValues = [];

      // إذا كان is_renewable فارغ، اجعله false
      if (doc.is_renewable === null || doc.is_renewable === undefined) {
        updateFields.push('is_renewable = ?');
        updateValues.push(false);
        needsUpdate = true;
        console.log(`تحديث is_renewable للمستند ${doc.name}`);
      }

      // إذا كان المستند قابل للتجديد ولكن لا يوجد تاريخ انتهاء، أضف تاريخ انتهاء عشوائي
      if (doc.is_renewable && !doc.expiry_date) {
        const today = new Date();
        const randomDays = Math.floor(Math.random() * 365) + 30; // من 30 إلى 395 يوم
        const expiryDate = new Date(today.getTime() + randomDays * 24 * 60 * 60 * 1000);
        
        updateFields.push('expiry_date = ?');
        updateValues.push(expiryDate.toISOString().split('T')[0]);
        needsUpdate = true;
        console.log(`إضافة تاريخ انتهاء للمستند ${doc.name}: ${expiryDate.toISOString().split('T')[0]}`);
      }

      // تحديث الحالة إذا كان هناك تاريخ انتهاء
      if (doc.expiry_date || (doc.is_renewable && updateFields.some(f => f.includes('expiry_date')))) {
        const expiryDate = doc.expiry_date || updateValues[updateFields.findIndex(f => f.includes('expiry_date'))];
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let status = 'active';
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 30) {
          status = 'expiring_soon';
        }

        if (status !== doc.status) {
          updateFields.push('status = ?');
          updateValues.push(status);
          needsUpdate = true;
          console.log(`تحديث حالة المستند ${doc.name} إلى ${status}`);
        }
      }

      // تنفيذ التحديث إذا كان مطلوباً
      if (needsUpdate) {
        const updateQuery = `
          UPDATE institution_documents 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `;
        updateValues.push(doc.id);
        
        await connection.execute(updateQuery, updateValues);
        console.log(`تم تحديث المستند ${doc.name} بنجاح`);
      }
    }

    // إضافة بعض المستندات القابلة للتجديد للمؤسسات التي لا تحتوي على مستندات
    const [institutions] = await connection.execute(`
      SELECT i.id, i.name
      FROM institutions i
      LEFT JOIN institution_documents id ON i.id = id.institution_id
      WHERE id.id IS NULL
    `);

    console.log(`إضافة مستندات تجريبية لـ ${institutions.length} مؤسسة`);

    const sampleDocuments = [
      { name: 'الرخصة التجارية', type: 'license', renewable: true },
      { name: 'السجل التجاري', type: 'commercial_record', renewable: true },
      { name: 'شهادة الضريبة', type: 'tax_certificate', renewable: true }
    ];

    for (const institution of institutions) {
      // إضافة مستند واحد قابل للتجديد لكل مؤسسة
      const doc = sampleDocuments[Math.floor(Math.random() * sampleDocuments.length)];
      const docId = `doc-${institution.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      const today = new Date();
      const randomDays = Math.floor(Math.random() * 365) - 90; // من -90 إلى +275 يوم
      const expiryDate = new Date(today.getTime() + randomDays * 24 * 60 * 60 * 1000);
      
      // تحديد الحالة
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let status = 'active';
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        status = 'expiring_soon';
      }

      await connection.execute(`
        INSERT INTO institution_documents (
          id, institution_id, name, document_type, is_renewable, expiry_date, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        docId,
        institution.id,
        doc.name,
        doc.type,
        doc.renewable,
        expiryDate.toISOString().split('T')[0],
        status
      ]);

      console.log(`تم إضافة مستند "${doc.name}" للمؤسسة ${institution.name}`);
    }

    console.log('تم إصلاح جميع مستندات المؤسسات بنجاح!');

  } catch (error) {
    console.error('خطأ في إصلاح مستندات المؤسسات:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
fixInstitutionDocuments();
