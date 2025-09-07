const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// تحميل متغيرات البيئة
require('dotenv').config({ path: '.env.local' });

// إعدادات قاعدة البيانات
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '123',
  database: process.env.MYSQL_DATABASE || 'hr_system',
  port: process.env.MYSQL_PORT || 3306
};

async function setupSecurityTables() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // قراءة ملف SQL
    const sqlFilePath = path.join(__dirname, '..', 'database', 'create-security-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // تقسيم الاستعلامات
    const queries = sqlContent
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0);
    
    console.log(`📝 تنفيذ ${queries.length} استعلام...`);
    
    // تنفيذ كل استعلام
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      try {
        await connection.execute(query);
        console.log(`✅ تم تنفيذ الاستعلام ${i + 1}/${queries.length}`);
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠️  الجدول موجود بالفعل - الاستعلام ${i + 1}`);
        } else {
          console.error(`❌ خطأ في الاستعلام ${i + 1}:`, error.message);
        }
      }
    }
    
    // التحقق من إنشاء الجداول
    console.log('\n🔍 التحقق من الجداول المنشأة...');
    
    const tables = [
      'security_settings',
      'allowed_devices', 
      'login_attempts',
      'security_audit_log'
    ];
    
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          console.log(`✅ الجدول ${table} موجود`);
          
          // عرض عدد السجلات
          const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   📊 عدد السجلات: ${countResult[0].count}`);
        } else {
          console.log(`❌ الجدول ${table} غير موجود`);
        }
      } catch (error) {
        console.error(`❌ خطأ في التحقق من الجدول ${table}:`, error.message);
      }
    }
    
    // إضافة بيانات تجريبية إضافية
    console.log('\n📝 إضافة بيانات تجريبية...');
    
    try {
      // إضافة جهاز تجريبي
      await connection.execute(`
        INSERT IGNORE INTO allowed_devices (
          id, ip_address, description, is_active, added_at
        ) VALUES (?, ?, ?, ?, NOW())
      `, [
        'device-admin-pc',
        '192.168.1.100',
        'جهاز مدير النظام',
        true
      ]);
      
      console.log('✅ تم إضافة جهاز تجريبي');
      
      // إضافة حدث أمني تجريبي
      await connection.execute(`
        INSERT INTO security_audit_log (
          id, event_type, description, severity, created_at
        ) VALUES (?, ?, ?, ?, NOW())
      `, [
        'event-system-setup',
        'SYSTEM_SETUP',
        'تم إعداد نظام الأمان وإنشاء الجداول',
        'medium'
      ]);
      
      console.log('✅ تم إضافة حدث أمني تجريبي');
      
    } catch (error) {
      console.error('⚠️  خطأ في إضافة البيانات التجريبية:', error.message);
    }
    
    console.log('\n🎉 تم إعداد جداول الأمان بنجاح!');
    console.log('\n📋 الجداول المنشأة:');
    console.log('   • security_settings - إعدادات الأمان العامة');
    console.log('   • allowed_devices - الأجهزة المصرح لها');
    console.log('   • login_attempts - سجل محاولات تسجيل الدخول');
    console.log('   • security_audit_log - سجل الأحداث الأمنية');
    
    console.log('\n🔗 الروابط المفيدة:');
    console.log('   • صفحة إعدادات مدير النظام: http://localhost:9004/admin/settings');
    console.log('   • صفحة إدارة الصلاحيات: http://localhost:9004/admin/permissions');
    
  } catch (error) {
    console.error('❌ خطأ في إعداد جداول الأمان:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
if (require.main === module) {
  setupSecurityTables().catch(console.error);
}

module.exports = { setupSecurityTables };
