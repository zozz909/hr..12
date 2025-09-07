const mysql = require('mysql2/promise');

async function addSampleInstitutions() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // Sample institutions
    const sampleInstitutions = [
      {
        name: 'شركة التقنية المتقدمة',
        cr_number: 'CR-TECH-2024',
        cr_expiry_date: '2026-12-31',
        license_number: 'LIC-TECH-2024',
        license_expiry: '2025-12-31',
        phone: '0501234567',
        email: 'info@advanced-tech.com',
        address: 'الرياض، المملكة العربية السعودية'
      },
      {
        name: 'مؤسسة المالية الحديثة',
        cr_number: 'CR-FIN-2024',
        cr_expiry_date: '2026-06-30',
        license_number: 'LIC-FIN-2024',
        license_expiry: '2025-06-30',
        phone: '0509876543',
        email: 'contact@modern-finance.com',
        address: 'جدة، المملكة العربية السعودية'
      },
      {
        name: 'شركة الإنشاءات الكبرى',
        cr_number: 'CR-CONST-2024',
        cr_expiry_date: '2026-09-15',
        license_number: 'LIC-CONST-2024',
        license_expiry: '2025-09-15',
        phone: '0551122334',
        email: 'projects@major-construction.com',
        address: 'الدمام، المملكة العربية السعودية'
      },
      {
        name: 'وكالة الإبداع الرقمي',
        cr_number: 'CR-DIGITAL-2024',
        cr_expiry_date: '2026-03-20',
        license_number: 'LIC-DIGITAL-2024',
        license_expiry: '2025-03-20',
        phone: '0543216789',
        email: 'hello@digital-creative.com',
        address: 'مكة المكرمة، المملكة العربية السعودية'
      },
      {
        name: 'شركة الاتصالات المتقدمة',
        cr_number: 'CR-TELECOM-2024',
        cr_expiry_date: '2026-11-10',
        license_number: 'LIC-TELECOM-2024',
        license_expiry: '2025-11-10',
        phone: '0512345678',
        email: 'support@advanced-telecom.com',
        address: 'المدينة المنورة، المملكة العربية السعودية'
      }
    ];

    for (const institution of sampleInstitutions) {
      const institutionId = `inst-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      try {
        await connection.execute(`
          INSERT INTO institutions (
            id, name, cr_number, cr_expiry_date, license_number, license_expiry,
            phone, email, address, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          institutionId,
          institution.name,
          institution.cr_number,
          institution.cr_expiry_date,
          institution.license_number,
          institution.license_expiry,
          institution.phone,
          institution.email,
          institution.address
        ]);
        
        console.log(`✅ تم إضافة المؤسسة: ${institution.name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  المؤسسة موجودة بالفعل: ${institution.name}`);
        } else {
          console.error(`❌ خطأ في إضافة المؤسسة ${institution.name}:`, error.message);
        }
      }
    }

    // Display statistics
    const [stats] = await connection.execute(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN license_expiry > CURDATE() THEN 1 END) as valid_license,
        COUNT(CASE WHEN cr_expiry_date > CURDATE() THEN 1 END) as valid_cr
      FROM institutions
    `);

    console.log('\n📊 إحصائيات المؤسسات:');
    console.log('='.repeat(50));
    console.log(`إجمالي المؤسسات: ${stats[0].total}`);
    console.log(`نشطة: ${stats[0].active}`);
    console.log(`رخص سارية: ${stats[0].valid_license}`);
    console.log(`سجلات تجارية سارية: ${stats[0].valid_cr}`);

    // Display sample institutions
    const [institutions] = await connection.execute(`
      SELECT name, cr_number, phone, email
      FROM institutions
      WHERE status = 'active'
      ORDER BY name
      LIMIT 10
    `);

    if (institutions.length > 0) {
      console.log('\n🏢 المؤسسات المتاحة:');
      console.log('='.repeat(50));
      institutions.forEach(inst => {
        console.log(`${inst.name} | ${inst.cr_number} | ${inst.phone} | ${inst.email}`);
      });
    }

    console.log('\n🎉 تم إضافة المؤسسات التجريبية بنجاح!');

  } catch (error) {
    console.error('خطأ في إضافة المؤسسات التجريبية:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nتم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
addSampleInstitutions();
