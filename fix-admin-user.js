const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixAdminUser() {
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
    
    // حذف المستخدم الموجود إن وجد
    await connection.execute('DELETE FROM users WHERE email = ?', ['admin@example.com']);
    
    // إنشاء كلمة مرور مشفرة جديدة
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔐 تم تشفير كلمة المرور');
    
    // إنشاء المستخدم الإداري الجديد
    await connection.execute(`
      INSERT INTO users (id, name, email, password, role, status, permissions, email_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      'admin-new',
      'مدير النظام',
      'admin@example.com',
      hashedPassword,
      'admin',
      'active',
      JSON.stringify([
        'institutions_view', 'institutions_add', 'institutions_edit', 'institutions_delete',
        'employees_view', 'employees_add', 'employees_edit', 'employees_delete',
        'documents_view', 'documents_add', 'documents_edit', 'documents_delete',
        'users_view', 'users_add', 'users_edit', 'users_delete',
        'payroll_view', 'payroll_add', 'payroll_edit', 'payroll_delete',
        'reports_view', 'system_settings'
      ]),
      true
    ]);
    
    console.log('✅ تم إنشاء المستخدم الإداري بنجاح!');
    console.log('📧 البريد الإلكتروني: admin@example.com');
    console.log('🔑 كلمة المرور: admin123');
    
    // التحقق من إنشاء المستخدم
    const [users] = await connection.execute(
      'SELECT id, email, role, status FROM users WHERE email = ?',
      ['admin@example.com']
    );
    
    console.log('👤 المستخدم المنشأ:', users[0]);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error('تفاصيل الخطأ:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم قطع الاتصال');
    }
  }
}

fixAdminUser();
