const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    // الاتصال بقاعدة البيانات
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🔗 متصل بقاعدة البيانات...');

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash('test123', 10);

    // إنشاء مستخدم تجريبي بصلاحيات محدودة (مشاهدة فقط)
    const testUser = {
      id: 'test-user-001',
      name: 'مستخدم تجريبي',
      email: 'test@company.com',
      password: hashedPassword,
      role: 'employee',
      permissions: JSON.stringify(['view_employees']), // صلاحية مشاهدة فقط
      status: 'active'
    };

    // حذف المستخدم إذا كان موجوداً
    await connection.execute(
      'DELETE FROM users WHERE email = ?',
      [testUser.email]
    );

    // إدراج المستخدم الجديد
    await connection.execute(
      `INSERT INTO users (id, name, email, password, role, permissions, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        testUser.id,
        testUser.name,
        testUser.email,
        testUser.password,
        testUser.role,
        testUser.permissions,
        testUser.status
      ]
    );

    console.log('✅ تم إنشاء المستخدم التجريبي بنجاح:');
    console.log(`   📧 البريد الإلكتروني: ${testUser.email}`);
    console.log(`   🔑 كلمة المرور: test123`);
    console.log(`   👤 الاسم: ${testUser.name}`);
    console.log(`   🎭 الدور: ${testUser.role}`);
    console.log(`   📋 الصلاحيات: مشاهدة الموظفين فقط`);
    console.log('');
    console.log('🧪 يمكنك الآن اختبار النظام:');
    console.log('   1. سجل دخول بهذا المستخدم');
    console.log('   2. حاول حذف أو تعديل موظف');
    console.log('   3. يجب أن تظهر رسالة "ليس لديك صلاحية"');

    await connection.end();

  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدم التجريبي:', error);
  }
}

createTestUser();
