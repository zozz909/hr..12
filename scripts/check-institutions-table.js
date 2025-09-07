const mysql = require('mysql2/promise');

async function checkInstitutionsTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // Check table structure
    const [columns] = await connection.execute(`DESCRIBE institutions`);
    
    console.log('\n📋 بنية جدول المؤسسات:');
    console.log('='.repeat(60));
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });

    // Check existing data
    const [institutions] = await connection.execute(`SELECT * FROM institutions LIMIT 5`);
    
    console.log('\n📊 عينة من البيانات:');
    console.log('='.repeat(60));
    institutions.forEach((inst, index) => {
      console.log(`\nمؤسسة ${index + 1}:`);
      Object.keys(inst).forEach(key => {
        console.log(`  ${key}: ${inst[key]}`);
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

checkInstitutionsTable();
