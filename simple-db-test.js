// اختبار بسيط لقاعدة البيانات
const mysql = require('mysql2/promise');

async function simpleTest() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system',
      port: 3306,
      charset: 'utf8mb4'
    });
    
    console.log('✅ تم الاتصال بنجاح!');
    
    // اختبار بسيط
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ الاستعلام نجح:', rows[0]);
    
    // عدد المؤسسات
    const [institutions] = await connection.execute('SELECT COUNT(*) as count FROM institutions');
    console.log(`📊 عدد المؤسسات: ${institutions[0].count}`);
    
    // عدد الموظفين
    const [employees] = await connection.execute('SELECT COUNT(*) as count FROM employees');
    console.log(`👥 عدد الموظفين: ${employees[0].count}`);
    
    // عدد الفروع
    const [branches] = await connection.execute('SELECT COUNT(*) as count FROM branches');
    console.log(`🏪 عدد الفروع: ${branches[0].count}`);
    
    console.log('\n🎉 قاعدة البيانات تعمل بشكل صحيح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error('📋 التفاصيل:', error.code);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم قطع الاتصال');
    }
  }
}

simpleTest();
