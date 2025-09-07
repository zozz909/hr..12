const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔧 تشغيل migration لإضافة حقول المستندات القابلة للتجديد...\n');

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123',
    database: 'hr_system'
  });

  try {
    // قراءة ملف الـ migration
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_renewable_documents.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // تقسيم الاستعلامات
    const queries = migrationSQL.split(';').filter(query => query.trim().length > 0);
    
    console.log(`📋 تشغيل ${queries.length} استعلام...\n`);
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i].trim();
      if (query) {
        console.log(`${i + 1}. تشغيل: ${query.substring(0, 50)}...`);
        try {
          await connection.execute(query);
          console.log('   ✅ تم بنجاح');
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('   ⚠️ الحقل موجود مسبقاً - تم التخطي');
          } else {
            console.log(`   ❌ خطأ: ${error.message}`);
          }
        }
      }
    }

    console.log('\n✅ تم تشغيل جميع migrations بنجاح!');
    console.log('\n📊 الحقول المضافة:');
    console.log('   • is_renewable: لتحديد إذا كان المستند قابل للتجديد');
    console.log('   • expiry_date: تاريخ انتهاء صلاحية المستند');
    console.log('   • status: حالة المستند (active, expired, expiring_soon)');

  } catch (error) {
    console.error('❌ خطأ في تشغيل migration:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
