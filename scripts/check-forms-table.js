const mysql = require('mysql2/promise');

async function checkFormsTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🔍 فحص بنية جدول forms...\n');

    // عرض بنية الجدول
    const [columns] = await connection.execute('DESCRIBE forms');
    
    console.log('📋 أعمدة جدول forms:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // عرض البيانات الموجودة
    const [forms] = await connection.execute('SELECT * FROM forms LIMIT 5');
    
    console.log(`\n📄 البيانات الموجودة (${forms.length} نموذج):`);
    forms.forEach(form => {
      console.log(`   - ${form.title} (${form.category})`);
    });

    await connection.end();

  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

checkFormsTable();
