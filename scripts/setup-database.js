const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '123',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  charset: 'utf8mb4'
};

async function setupDatabase() {
  let connection;

  try {
    console.log('🔄 الاتصال بخادم MySQL...');

    // الاتصال بخادم MySQL (بدون تحديد قاعدة بيانات)
    connection = await mysql.createConnection(dbConfig);

    console.log('✅ تم الاتصال بخادم MySQL بنجاح');

    // إنشاء قاعدة البيانات أولاً
    console.log('🔄 إنشاء قاعدة البيانات...');
    await connection.query('CREATE DATABASE IF NOT EXISTS hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('USE hr_system');

    // قراءة ملف schema.sql
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 تنفيذ ملف قاعدة البيانات...');

    // تقسيم الاستعلامات وتنفيذها
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.includes('CREATE DATABASE') && !stmt.includes('USE hr_system'));

    // تنفيذ الاستعلامات بالترتيب
    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
          successCount++;

          // طباعة تقدم العملية
          if (statement.includes('CREATE TABLE')) {
            const tableName = statement.match(/CREATE TABLE (\w+)/)?.[1];
            console.log(`   ✅ تم إنشاء جدول: ${tableName}`);
          } else if (statement.includes('INSERT INTO')) {
            const tableName = statement.match(/INSERT INTO (\w+)/)?.[1];
            console.log(`   📝 تم إدراج بيانات في جدول: ${tableName}`);
          }

        } catch (error) {
          errorCount++;
          // تجاهل أخطاء DROP TABLE IF EXISTS فقط
          if (!error.message.includes('Unknown table') && !statement.includes('DROP TABLE')) {
            console.error('❌ خطأ في تنفيذ الاستعلام:', statement.substring(0, 100) + '...');
            console.error('   تفاصيل الخطأ:', error.message);
          }
        }
      }
    }

    console.log(`📊 تم تنفيذ ${successCount} استعلام بنجاح، ${errorCount} خطأ`);

    if (errorCount > 0) {
      console.log('⚠️  بعض الأخطاء حدثت، لكن قد تكون طبيعية (مثل حذف جداول غير موجودة)');
    }

    console.log('✅ تم إنشاء قاعدة البيانات والجداول بنجاح');

    // التحقق من وجود البيانات
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [settingsRows] = await connection.query('SELECT COUNT(*) as count FROM security_settings');

    console.log(`📊 عدد المستخدمين: ${userRows[0].count}`);
    console.log(`📊 عدد إعدادات الأمان: ${settingsRows[0].count}`);

    if (userRows[0].count === 0) {
      console.log('⚠️  لا توجد مستخدمين في قاعدة البيانات');
    }

    if (settingsRows[0].count === 0) {
      console.log('⚠️  لا توجد إعدادات أمان في قاعدة البيانات');
    }

    console.log('🎉 تم إعداد قاعدة البيانات بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في إعداد قاعدة البيانات:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// تشغيل الإعداد
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
