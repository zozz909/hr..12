const mysql = require('mysql2/promise');

async function updateEmployeesTable() {
  let connection;
  
  try {
    // إنشاء الاتصال بقاعدة البيانات
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // إضافة الحقول الجديدة إلى جدول الموظفين
    const alterQueries = [
      // إضافة رقم الملف
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS file_number VARCHAR(50) UNIQUE AFTER id`,
      
      // إضافة الجنسية
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) AFTER email`,
      
      // إضافة المؤسسة/الكفيل
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS institution VARCHAR(255) AFTER position`,
      
      // إضافة تاريخ انتهاء التأمين الصحي
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS health_insurance_expiry_date DATE AFTER contract_end_date`,
      
      // إضافة تاريخ انتهاء الشهادة الحية
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS life_certificate_expiry_date DATE AFTER health_insurance_expiry_date`,
      
      // تعديل حقل الهاتف ليكون مطلوب
      `ALTER TABLE employees MODIFY COLUMN phone VARCHAR(20) NOT NULL`,
      
      // إعادة تسمية بعض الحقول لتتطابق مع النظام الجديد
      `ALTER TABLE employees CHANGE COLUMN contract_end_date contract_expiry_date DATE`
    ];

    for (const query of alterQueries) {
      try {
        await connection.execute(query);
        console.log(`✅ تم تنفيذ: ${query.substring(0, 50)}...`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log(`⚠️  الحقل موجود بالفعل: ${query.substring(0, 50)}...`);
        } else {
          console.error(`❌ خطأ في تنفيذ: ${query.substring(0, 50)}...`, error.message);
        }
      }
    }

    // تحديث البيانات الموجودة
    console.log('\n📝 تحديث البيانات الموجودة...');

    // إضافة أرقام ملفات للموظفين الموجودين
    const [existingEmployees] = await connection.execute(`
      SELECT id, name FROM employees WHERE file_number IS NULL OR file_number = ''
    `);

    for (let i = 0; i < existingEmployees.length; i++) {
      const employee = existingEmployees[i];
      const fileNumber = `EMP-${String(i + 1).padStart(3, '0')}`;
      
      await connection.execute(`
        UPDATE employees SET file_number = ? WHERE id = ?
      `, [fileNumber, employee.id]);
      
      console.log(`📄 تم إضافة رقم ملف ${fileNumber} للموظف ${employee.name}`);
    }

    // إضافة جنسيات افتراضية للموظفين الموجودين
    await connection.execute(`
      UPDATE employees SET nationality = 'سعودي' 
      WHERE nationality IS NULL OR nationality = ''
    `);

    // إضافة أرقام هواتف افتراضية للموظفين الذين لا يملكون أرقام
    const [employeesWithoutPhone] = await connection.execute(`
      SELECT id, name FROM employees WHERE phone IS NULL OR phone = ''
    `);

    for (let i = 0; i < employeesWithoutPhone.length; i++) {
      const employee = employeesWithoutPhone[i];
      const defaultPhone = `05${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
      
      await connection.execute(`
        UPDATE employees SET phone = ? WHERE id = ?
      `, [defaultPhone, employee.id]);
      
      console.log(`📱 تم إضافة رقم هاتف افتراضي ${defaultPhone} للموظف ${employee.name}`);
    }

    // إضافة بيانات تجريبية جديدة
    console.log('\n➕ إضافة موظفين تجريبيين جدد...');

    const sampleEmployees = [
      {
        name: 'عبدالله محمد الأحمد',
        fileNumber: 'EMP-NEW-001',
        phone: '0551234567',
        email: 'abdullah@example.com',
        nationality: 'سعودي',
        position: 'مدير مشروع',
        institution: 'شركة التطوير الحديث',
        salary: 15000,
        iqamaExpiryDate: '2025-06-15',
        workPermitExpiryDate: '2025-04-20',
        contractExpiryDate: '2026-12-31',
        healthInsuranceExpiryDate: '2025-03-10',
        lifeCertificateExpiryDate: '2025-08-25'
      },
      {
        name: 'نورا سالم العتيبي',
        fileNumber: 'EMP-NEW-002',
        phone: '0559876543',
        email: 'nora@example.com',
        nationality: 'سعودي',
        position: 'محللة بيانات',
        institution: 'مؤسسة التقنية المتقدمة',
        salary: 9500,
        iqamaExpiryDate: '2025-09-30',
        workPermitExpiryDate: '2025-07-15',
        contractExpiryDate: '2026-06-30',
        healthInsuranceExpiryDate: '2025-01-05',
        lifeCertificateExpiryDate: '2025-11-18'
      },
      {
        name: 'أحمد علي المطيري',
        fileNumber: 'EMP-NEW-003',
        phone: '0567891234',
        email: 'ahmed.ali@example.com',
        nationality: 'كويتي',
        position: 'مطور تطبيقات',
        institution: 'شركة الحلول الذكية',
        salary: 11000,
        iqamaExpiryDate: '2025-02-28',
        workPermitExpiryDate: '2025-12-10',
        contractExpiryDate: '2026-03-15',
        healthInsuranceExpiryDate: '2024-12-20',
        lifeCertificateExpiryDate: '2025-05-30'
      }
    ];

    for (const emp of sampleEmployees) {
      const empId = `emp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      await connection.execute(`
        INSERT INTO employees (
          id, name, file_number, phone, email, nationality, position, 
          institution, salary, iqama_expiry_date, work_permit_expiry_date, 
          contract_expiry_date, health_insurance_expiry_date, 
          life_certificate_expiry_date, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        empId, emp.name, emp.fileNumber, emp.phone, emp.email, emp.nationality,
        emp.position, emp.institution, emp.salary, emp.iqamaExpiryDate,
        emp.workPermitExpiryDate, emp.contractExpiryDate, emp.healthInsuranceExpiryDate,
        emp.lifeCertificateExpiryDate
      ]);
      
      console.log(`👤 تم إضافة الموظف: ${emp.name} (${emp.fileNumber})`);
    }

    // عرض إحصائيات نهائية
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN nationality = 'سعودي' THEN 1 END) as saudi,
        COUNT(CASE WHEN nationality != 'سعودي' THEN 1 END) as non_saudi,
        AVG(salary) as avg_salary
      FROM employees
    `);

    console.log('\n📊 إحصائيات الموظفين:');
    console.log(`إجمالي الموظفين: ${stats[0].total}`);
    console.log(`سعوديين: ${stats[0].saudi}`);
    console.log(`غير سعوديين: ${stats[0].non_saudi}`);
    console.log(`متوسط الراتب: ${Math.round(stats[0].avg_salary || 0)} ريال`);

    console.log('\n🎉 تم تحديث جدول الموظفين بنجاح!');

  } catch (error) {
    console.error('خطأ في تحديث جدول الموظفين:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
updateEmployeesTable();
