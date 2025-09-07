const mysql = require('mysql2/promise');

async function checkEmployeesTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // عرض بنية جدول الموظفين
    const [columns] = await connection.execute(`DESCRIBE employees`);
    
    console.log('\n📋 بنية جدول الموظفين الحالية:');
    console.log('='.repeat(60));
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });

    // عرض عينة من البيانات
    const [sampleData] = await connection.execute(`SELECT * FROM employees LIMIT 3`);
    
    console.log('\n📊 عينة من البيانات:');
    console.log('='.repeat(60));
    sampleData.forEach((row, index) => {
      console.log(`\nموظف ${index + 1}:`);
      Object.keys(row).forEach(key => {
        console.log(`  ${key}: ${row[key]}`);
      });
    });

  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkEmployeesTable();
