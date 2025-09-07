const mysql = require('mysql2/promise');

async function addSampleEmployees() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // إضافة موظفين تجريبيين جدد
    const sampleEmployees = [
      {
        name: 'عبدالرحمن محمد الغامدي',
        fileNumber: 'EMP-2025-001',
        mobile: '0551234567',
        email: 'abdulrahman@example.com',
        nationality: 'سعودي',
        position: 'مدير مشروع',
        institution: 'شركة التطوير الحديث',
        salary: 15000,
        iqamaExpiry: '2025-06-15',
        workPermitExpiry: '2025-04-20',
        contractExpiry: '2026-12-31',
        healthInsuranceExpiry: '2025-03-10',
        healthCertExpiry: '2025-08-25'
      },
      {
        name: 'فاطمة أحمد العتيبي',
        fileNumber: 'EMP-2025-002',
        mobile: '0559876543',
        email: 'fatima@example.com',
        nationality: 'سعودي',
        position: 'محللة بيانات',
        institution: 'مؤسسة التقنية المتقدمة',
        salary: 9500,
        iqamaExpiry: '2025-09-30',
        workPermitExpiry: '2025-07-15',
        contractExpiry: '2026-06-30',
        healthInsuranceExpiry: '2025-01-05',
        healthCertExpiry: '2025-11-18'
      },
      {
        name: 'محمد علي الشهري',
        fileNumber: 'EMP-2025-003',
        mobile: '0567891234',
        email: 'mohammed@example.com',
        nationality: 'يمني',
        position: 'مطور تطبيقات',
        institution: 'شركة الحلول الذكية',
        salary: 11000,
        iqamaExpiry: '2025-02-28',
        workPermitExpiry: '2025-12-10',
        contractExpiry: '2026-03-15',
        healthInsuranceExpiry: '2024-12-20',
        healthCertExpiry: '2025-05-30'
      },
      {
        name: 'نورا سالم القحطاني',
        fileNumber: 'EMP-2025-004',
        mobile: '0543216789',
        email: 'nora@example.com',
        nationality: 'سعودي',
        position: 'مصممة جرافيك',
        institution: 'وكالة الإبداع الرقمي',
        salary: 7500,
        iqamaExpiry: '2025-11-20',
        workPermitExpiry: '2025-08-30',
        contractExpiry: '2026-09-15',
        healthInsuranceExpiry: '2025-04-25',
        healthCertExpiry: '2025-12-10'
      },
      {
        name: 'أحمد خالد المطيري',
        fileNumber: 'EMP-2025-005',
        mobile: '0512345678',
        email: 'ahmed.khalid@example.com',
        nationality: 'كويتي',
        position: 'مهندس شبكات',
        institution: 'شركة الاتصالات المتقدمة',
        salary: 13500,
        iqamaExpiry: '2025-05-10',
        workPermitExpiry: '2025-03-25',
        contractExpiry: '2026-08-20',
        healthInsuranceExpiry: '2025-02-15',
        healthCertExpiry: '2025-07-05'
      },
      {
        name: 'مريم عبدالله الدوسري',
        fileNumber: 'EMP-2025-006',
        mobile: '0598765432',
        email: 'mariam@example.com',
        nationality: 'سعودي',
        position: 'محاسبة قانونية',
        institution: 'مكتب المحاسبة والمراجعة',
        salary: 8500,
        iqamaExpiry: '2025-07-18',
        workPermitExpiry: '2025-05-12',
        contractExpiry: '2026-11-30',
        healthInsuranceExpiry: '2025-06-08',
        healthCertExpiry: '2025-09-22'
      }
    ];

    for (const emp of sampleEmployees) {
      const empId = `emp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      try {
        await connection.execute(`
          INSERT INTO employees (
            id, name, file_number, mobile, email, nationality, position, 
            institution, salary, iqama_expiry, work_permit_expiry, 
            contract_expiry, health_insurance_expiry, health_cert_expiry, 
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          empId, emp.name, emp.fileNumber, emp.mobile, emp.email, emp.nationality,
          emp.position, emp.institution, emp.salary, emp.iqamaExpiry,
          emp.workPermitExpiry, emp.contractExpiry, emp.healthInsuranceExpiry,
          emp.healthCertExpiry
        ]);
        
        console.log(`✅ تم إضافة الموظف: ${emp.name} (${emp.fileNumber})`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  الموظف موجود بالفعل: ${emp.name} (${emp.fileNumber})`);
        } else {
          console.error(`❌ خطأ في إضافة الموظف ${emp.name}:`, error.message);
        }
      }
    }

    // تحديث الموظفين الموجودين بأرقام جوال
    const [employeesWithoutMobile] = await connection.execute(`
      SELECT id, name, file_number FROM employees WHERE mobile IS NULL OR mobile = ''
    `);

    console.log(`\n📱 تحديث أرقام الجوال للموظفين الموجودين (${employeesWithoutMobile.length} موظف)...`);

    for (let i = 0; i < employeesWithoutMobile.length; i++) {
      const employee = employeesWithoutMobile[i];
      const defaultMobile = `05${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
      
      await connection.execute(`
        UPDATE employees SET mobile = ? WHERE id = ?
      `, [defaultMobile, employee.id]);
      
      console.log(`📱 ${employee.name} (${employee.file_number}): ${defaultMobile}`);
    }

    // عرض إحصائيات نهائية
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN nationality = 'سعودي' THEN 1 END) as saudi,
        COUNT(CASE WHEN nationality != 'سعودي' AND nationality IS NOT NULL THEN 1 END) as non_saudi,
        COUNT(CASE WHEN mobile IS NOT NULL AND mobile != '' THEN 1 END) as with_mobile,
        AVG(salary) as avg_salary
      FROM employees
    `);

    console.log('\n📊 إحصائيات الموظفين المحدثة:');
    console.log('='.repeat(50));
    console.log(`إجمالي الموظفين: ${stats[0].total}`);
    console.log(`سعوديين: ${stats[0].saudi}`);
    console.log(`غير سعوديين: ${stats[0].non_saudi}`);
    console.log(`لديهم أرقام جوال: ${stats[0].with_mobile}`);
    console.log(`متوسط الراتب: ${Math.round(stats[0].avg_salary || 0)} ريال`);

    // عرض عينة من الموظفين الجدد
    const [newEmployees] = await connection.execute(`
      SELECT name, file_number, mobile, nationality, position, salary 
      FROM employees 
      WHERE file_number LIKE 'EMP-2025-%'
      ORDER BY file_number
    `);

    if (newEmployees.length > 0) {
      console.log('\n👥 الموظفون الجدد المضافون:');
      console.log('='.repeat(50));
      newEmployees.forEach(emp => {
        console.log(`${emp.name} | ${emp.file_number} | ${emp.mobile} | ${emp.nationality} | ${emp.position} | ${emp.salary} ريال`);
      });
    }

    console.log('\n🎉 تم إضافة الموظفين التجريبيين بنجاح!');

  } catch (error) {
    console.error('خطأ في إضافة الموظفين التجريبيين:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nتم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
addSampleEmployees();
