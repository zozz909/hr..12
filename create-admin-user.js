const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
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
    
    // التحقق من وجود المستخدم
    const [existingUsers] = await connection.execute(
      'SELECT id, email FROM users WHERE email = ?',
      ['admin@example.com']
    );
    
    if (existingUsers.length > 0) {
      console.log('👤 المستخدم الإداري موجود بالفعل:', existingUsers[0]);
      return;
    }
    
    // إنشاء كلمة مرور مشفرة
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // إنشاء المستخدم الإداري
    const adminUser = {
      id: 'admin-001',
      name: 'مدير النظام',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      permissions: JSON.stringify([
        'institutions_view', 'institutions_add', 'institutions_edit', 'institutions_delete',
        'employees_view', 'employees_add', 'employees_edit', 'employees_delete',
        'documents_view', 'documents_add', 'documents_edit', 'documents_delete',
        'users_view', 'users_add', 'users_edit', 'users_delete',
        'payroll_view', 'payroll_add', 'payroll_edit', 'payroll_delete',
        'reports_view', 'system_settings'
      ]),
      email_verified: true
    };
    
    await connection.execute(`
      INSERT INTO users (id, name, email, password, role, status, permissions, email_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      adminUser.id,
      adminUser.name,
      adminUser.email,
      adminUser.password,
      adminUser.role,
      adminUser.status,
      adminUser.permissions,
      adminUser.email_verified
    ]);
    
    console.log('✅ تم إنشاء المستخدم الإداري بنجاح!');
    console.log('📧 البريد الإلكتروني: admin@example.com');
    console.log('🔑 كلمة المرور: admin123');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم قطع الاتصال');
    }
  }
}

createAdminUser();
