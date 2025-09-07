const mysql = require('mysql2/promise');

async function cleanTestUsers() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🔗 متصل بقاعدة البيانات...');

    // حذف جميع المستخدمين التجريبيين
    const result = await connection.execute(`
      DELETE FROM users 
      WHERE email IN (
        'final.delete@test.com',
        'delete.simple@test.com',
        'delete.test@company.com',
        'branch.manager@company.com',
        'newuser@company.com'
      )
    `);

    console.log(`✅ تم حذف ${result[0].affectedRows} مستخدم تجريبي`);

    // عرض المستخدمين المتبقين
    const [users] = await connection.execute('SELECT id, name, email, role FROM users');
    
    console.log('\n👥 المستخدمين المتبقين:');
    users.forEach(user => {
      console.log(`   ${user.role === 'admin' ? '👑' : '👤'} ${user.name} (${user.email}) - ${user.role}`);
    });

    await connection.end();

  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

cleanTestUsers();
