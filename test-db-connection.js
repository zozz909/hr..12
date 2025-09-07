// اختبار الاتصال بقاعدة البيانات
const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  let connection;
  
  try {
    console.log('🔗 محاولة الاتصال بقاعدة البيانات...');
    
    // إعدادات الاتصال
    const config = {
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system',
      port: 3306,
      charset: 'utf8mb4'
      // إزالة timezone لتجنب مشاكل MariaDB
    };
    
    console.log('📋 إعدادات الاتصال:');
    console.log(`   Host: ${config.host}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Port: ${config.port}`);
    
    // محاولة الاتصال
    connection = await mysql.createConnection(config);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    
    // اختبار استعلام بسيط
    console.log('\n🔍 اختبار استعلام بسيط...');
    const [rows] = await connection.execute('SELECT 1 as test_value');
    console.log('✅ الاستعلام نجح:', rows[0]);
    
    // اختبار جدول المؤسسات
    console.log('\n🏢 اختبار جدول المؤسسات...');
    const [institutions] = await connection.execute('SELECT COUNT(*) as count FROM institutions');
    console.log(`✅ عدد المؤسسات: ${institutions[0].count}`);
    
    // اختبار جدول الموظفين
    console.log('\n👥 اختبار جدول الموظفين...');
    const [employees] = await connection.execute('SELECT COUNT(*) as count FROM employees');
    console.log(`✅ عدد الموظفين: ${employees[0].count}`);
    
    // اختبار جدول الفروع
    console.log('\n🏪 اختبار جدول الفروع...');
    const [branches] = await connection.execute('SELECT COUNT(*) as count FROM branches');
    console.log(`✅ عدد الفروع: ${branches[0].count}`);
    
    console.log('\n🎉 جميع الاختبارات نجحت! قاعدة البيانات تعمل بشكل صحيح.');
    
  } catch (error) {
    console.error('\n❌ خطأ في الاتصال بقاعدة البيانات:');
    console.error('   النوع:', error.code || 'UNKNOWN');
    console.error('   الرسالة:', error.message);
    console.error('   التفاصيل:', error.sqlMessage || 'لا توجد تفاصيل إضافية');
    
    // اقتراحات للحلول
    console.log('\n💡 اقتراحات للحل:');
    if (error.code === 'ECONNREFUSED') {
      console.log('   - تأكد من تشغيل خادم MySQL');
      console.log('   - تحقق من أن XAMPP يعمل');
      console.log('   - تأكد من أن المنفذ 3306 مفتوح');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('   - تحقق من اسم المستخدم وكلمة المرور');
      console.log('   - تأكد من أن المستخدم له صلاحيات الوصول');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('   - تأكد من وجود قاعدة البيانات hr_system');
      console.log('   - قم بإنشاء قاعدة البيانات إذا لم تكن موجودة');
    } else {
      console.log('   - تحقق من إعدادات قاعدة البيانات في .env.local');
      console.log('   - تأكد من تشغيل خادم MySQL');
    }
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الاختبار
testDatabaseConnection();
