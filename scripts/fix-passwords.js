const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '123',
  database: process.env.MYSQL_DATABASE || 'hr_system',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  charset: 'utf8mb4'
};

async function fixPasswords() {
  let connection;
  
  try {
    console.log('🔄 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // كلمات المرور الصحيحة
    const users = [
      { id: 'user-001', email: 'admin@company.com', password: 'admin123' },
      { id: 'user-002', email: 'hr@company.com', password: 'hr123' },
      { id: 'user-003', email: 'employee@company.com', password: 'emp123' }
    ];

    console.log('🔄 تحديث كلمات المرور...');

    for (const user of users) {
      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      // تحديث كلمة المرور في قاعدة البيانات
      await connection.query(
        'UPDATE users SET password = ?, login_attempts = 0, locked_until = NULL WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      console.log(`   ✅ تم تحديث كلمة المرور لـ: ${user.email}`);
    }

    console.log('🎉 تم تحديث جميع كلمات المرور بنجاح!');
    
    // عرض المستخدمين المحدثين
    const [updatedUsers] = await connection.query(`
      SELECT id, name, email, role, status, login_attempts, locked_until
      FROM users
    `);
    
    console.log('\n📋 المستخدمين المحدثين:');
    updatedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      الدور: ${user.role}`);
      console.log(`      الحالة: ${user.status}`);
      console.log(`      محاولات الدخول: ${user.login_attempts}`);
      console.log(`      محظور حتى: ${user.locked_until || 'غير محظور'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ خطأ في تحديث كلمات المرور:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// تشغيل الإصلاح
if (require.main === module) {
  fixPasswords();
}

module.exports = { fixPasswords };
