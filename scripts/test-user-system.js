const mysql = require('mysql2/promise');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '123',
  database: process.env.MYSQL_DATABASE || 'hr_system',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  charset: 'utf8mb4'
};

async function testUserSystem() {
  let connection;
  
  try {
    console.log('🔄 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // اختبار جدول المستخدمين
    console.log('\n📋 اختبار جدول المستخدمين:');
    
    const [users] = await connection.execute(`
      SELECT id, name, email, role, status, email_verified, 
             created_at, last_login, login_attempts
      FROM users
    `);
    
    console.log(`   عدد المستخدمين: ${users.length}`);
    
    if (users.length > 0) {
      console.log('   المستخدمين الموجودين:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
      });
    }

    // اختبار جدول إعدادات الأمان
    console.log('\n🔒 اختبار جدول إعدادات الأمان:');
    
    const [settings] = await connection.execute(`
      SELECT setting_key, category, is_active, created_at
      FROM security_settings
      WHERE is_active = TRUE
    `);
    
    console.log(`   عدد الإعدادات: ${settings.length}`);
    
    if (settings.length > 0) {
      console.log('   الإعدادات الموجودة:');
      settings.forEach((setting, index) => {
        console.log(`   ${index + 1}. ${setting.setting_key} (${setting.category})`);
      });
    }

    // اختبار الاستعلامات المتقدمة
    console.log('\n🔍 اختبار الاستعلامات المتقدمة:');
    
    // عدد المستخدمين النشطين
    const [activeUsers] = await connection.execute(`
      SELECT COUNT(*) as count FROM users WHERE status = 'active'
    `);
    console.log(`   المستخدمين النشطين: ${activeUsers[0].count}`);
    
    // عدد المدراء
    const [admins] = await connection.execute(`
      SELECT COUNT(*) as count FROM users WHERE role = 'admin'
    `);
    console.log(`   المدراء: ${admins[0].count}`);
    
    // آخر تسجيل دخول
    const [lastLogin] = await connection.execute(`
      SELECT name, email, last_login 
      FROM users 
      WHERE last_login IS NOT NULL 
      ORDER BY last_login DESC 
      LIMIT 1
    `);
    
    if (lastLogin.length > 0) {
      console.log(`   آخر تسجيل دخول: ${lastLogin[0].name} في ${lastLogin[0].last_login}`);
    } else {
      console.log('   لا توجد سجلات تسجيل دخول');
    }

    // اختبار إعداد محدد
    const [twoFactorSetting] = await connection.execute(`
      SELECT setting_value FROM security_settings 
      WHERE setting_key = 'two_factor_auth' AND is_active = TRUE
    `);
    
    if (twoFactorSetting.length > 0) {
      const value = JSON.parse(twoFactorSetting[0].setting_value);
      console.log(`   المصادقة الثنائية: ${value.enabled ? 'مفعلة' : 'غير مفعلة'}`);
    }

    console.log('\n🎉 جميع الاختبارات نجحت! النظام جاهز للاستخدام.');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار النظام:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n💡 يبدو أن الجداول غير موجودة. قم بتشغيل:');
      console.log('   npm run setup-db');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 خطأ في الوصول لقاعدة البيانات. تحقق من:');
      console.log('   - اسم المستخدم وكلمة المرور');
      console.log('   - أن خادم MySQL يعمل');
      console.log('   - إعدادات الاتصال في .env.local');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testUserSystem();
}

module.exports = { testUserSystem };
