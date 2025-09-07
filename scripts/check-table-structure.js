const mysql = require('mysql2/promise');

async function checkTableStructure() {
  console.log('🔍 فحص بنية جدول institution_documents...\n');

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123',
    database: 'hr_system'
  });

  try {
    // فحص بنية الجدول
    const [columns] = await connection.execute('DESCRIBE institution_documents');
    
    console.log('📋 أعمدة جدول institution_documents:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} - Default: ${col.Default || 'None'}`);
    });

    // التحقق من وجود الحقول الجديدة
    const hasIsRenewable = columns.some(col => col.Field === 'is_renewable');
    const hasExpiryDate = columns.some(col => col.Field === 'expiry_date');
    const hasStatus = columns.some(col => col.Field === 'status');

    console.log('\n✅ فحص الحقول الجديدة:');
    console.log(`   is_renewable: ${hasIsRenewable ? '✅ موجود' : '❌ غير موجود'}`);
    console.log(`   expiry_date: ${hasExpiryDate ? '✅ موجود' : '❌ غير موجود'}`);
    console.log(`   status: ${hasStatus ? '✅ موجود' : '❌ غير موجود'}`);

    if (!hasIsRenewable || !hasExpiryDate || !hasStatus) {
      console.log('\n⚠️ بعض الحقول مفقودة. سأضيفها الآن...');
      
      if (!hasIsRenewable) {
        await connection.execute('ALTER TABLE institution_documents ADD COLUMN is_renewable BOOLEAN DEFAULT FALSE');
        console.log('✅ تم إضافة حقل is_renewable');
      }
      
      if (!hasExpiryDate) {
        await connection.execute('ALTER TABLE institution_documents ADD COLUMN expiry_date DATE NULL');
        console.log('✅ تم إضافة حقل expiry_date');
      }
      
      if (!hasStatus) {
        await connection.execute("ALTER TABLE institution_documents ADD COLUMN status ENUM('active', 'expired', 'expiring_soon') DEFAULT 'active'");
        console.log('✅ تم إضافة حقل status');
      }
    }

    // عرض بعض البيانات التجريبية
    console.log('\n📄 المستندات الموجودة:');
    const [documents] = await connection.execute(`
      SELECT id, name, document_type, is_renewable, expiry_date, status 
      FROM institution_documents 
      LIMIT 5
    `);
    
    if (documents.length > 0) {
      documents.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.name} (${doc.document_type}) - قابل للتجديد: ${doc.is_renewable ? 'نعم' : 'لا'} - ينتهي: ${doc.expiry_date || 'غير محدد'} - الحالة: ${doc.status}`);
      });
    } else {
      console.log('   لا توجد مستندات');
    }

  } catch (error) {
    console.error('❌ خطأ في فحص الجدول:', error);
  } finally {
    await connection.end();
  }
}

checkTableStructure();
