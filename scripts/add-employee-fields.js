const mysql = require('mysql2/promise');

async function addEmployeeFields() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // Check current table structure
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM employees
    `);

    console.log('\n📋 الأعمدة الحالية في جدول employees:');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check if hire_date column exists
    const hireDateExists = columns.some(col => col.Field === 'hire_date');
    
    if (!hireDateExists) {
      console.log('\n➕ إضافة عمود hire_date...');
      await connection.execute(`
        ALTER TABLE employees 
        ADD COLUMN hire_date DATE NULL AFTER salary
      `);
      console.log('✅ تم إضافة عمود hire_date بنجاح');
    } else {
      console.log('\n✅ عمود hire_date موجود بالفعل');
    }

    // Check if email column exists (should already exist)
    const emailExists = columns.some(col => col.Field === 'email');
    if (!emailExists) {
      console.log('\n➕ إضافة عمود email...');
      await connection.execute(`
        ALTER TABLE employees 
        ADD COLUMN email VARCHAR(255) NULL AFTER mobile
      `);
      console.log('✅ تم إضافة عمود email بنجاح');
    } else {
      console.log('✅ عمود email موجود بالفعل');
    }

    // Check if nationality column exists (should already exist)
    const nationalityExists = columns.some(col => col.Field === 'nationality');
    if (!nationalityExists) {
      console.log('\n➕ إضافة عمود nationality...');
      await connection.execute(`
        ALTER TABLE employees 
        ADD COLUMN nationality VARCHAR(100) NOT NULL DEFAULT 'غير محدد' AFTER email
      `);
      console.log('✅ تم إضافة عمود nationality بنجاح');
    } else {
      console.log('✅ عمود nationality موجود بالفعل');
    }

    // Check if position column exists (should already exist)
    const positionExists = columns.some(col => col.Field === 'position');
    if (!positionExists) {
      console.log('\n➕ إضافة عمود position...');
      await connection.execute(`
        ALTER TABLE employees 
        ADD COLUMN position VARCHAR(255) NULL AFTER nationality
      `);
      console.log('✅ تم إضافة عمود position بنجاح');
    } else {
      console.log('✅ عمود position موجود بالفعل');
    }

    // Show updated table structure
    const [updatedColumns] = await connection.execute(`
      SHOW COLUMNS FROM employees
    `);

    console.log('\n📋 بنية الجدول المحدثة:');
    console.log('='.repeat(60));
    updatedColumns.forEach((col, index) => {
      const required = col.Null === 'NO' ? '(مطلوب)' : '(اختياري)';
      const defaultVal = col.Default ? ` - افتراضي: ${col.Default}` : '';
      console.log(`${index + 1}. ${col.Field} - ${col.Type} ${required}${defaultVal}`);
    });

    // Test with sample data
    console.log('\n🧪 اختبار تحديث بيانات موظف...');
    
    // Get first employee
    const [employees] = await connection.execute(`
      SELECT id, name, email, nationality, position, hire_date 
      FROM employees 
      LIMIT 1
    `);

    if (employees.length > 0) {
      const employee = employees[0];
      console.log(`\n👤 الموظف: ${employee.name}`);
      console.log(`📧 البريد: ${employee.email || 'غير محدد'}`);
      console.log(`🏳️ الجنسية: ${employee.nationality || 'غير محدد'}`);
      console.log(`💼 المنصب: ${employee.position || 'غير محدد'}`);
      console.log(`📅 تاريخ التوظيف: ${employee.hire_date || 'غير محدد'}`);

      // Test update
      const testUpdate = await connection.execute(`
        UPDATE employees 
        SET 
          email = COALESCE(email, 'test@example.com'),
          nationality = COALESCE(nationality, 'سعودي'),
          position = COALESCE(position, 'موظف'),
          hire_date = COALESCE(hire_date, CURDATE())
        WHERE id = ?
      `, [employee.id]);

      if (testUpdate.affectedRows > 0) {
        console.log('✅ تم اختبار التحديث بنجاح');
        
        // Get updated data
        const [updated] = await connection.execute(`
          SELECT email, nationality, position, hire_date 
          FROM employees 
          WHERE id = ?
        `, [employee.id]);

        if (updated.length > 0) {
          const updatedEmployee = updated[0];
          console.log('\n📊 البيانات المحدثة:');
          console.log(`📧 البريد: ${updatedEmployee.email}`);
          console.log(`🏳️ الجنسية: ${updatedEmployee.nationality}`);
          console.log(`💼 المنصب: ${updatedEmployee.position}`);
          console.log(`📅 تاريخ التوظيف: ${updatedEmployee.hire_date}`);
        }
      }
    }

    console.log('\n🎉 تم تحديث جدول الموظفين بنجاح!');
    console.log('\n📝 الحقول المتاحة الآن للتعديل:');
    console.log('✅ الاسم (name)');
    console.log('✅ الجوال (mobile)');
    console.log('✅ البريد الإلكتروني (email)');
    console.log('✅ الجنسية (nationality)');
    console.log('✅ المنصب (position)');
    console.log('✅ الراتب (salary)');
    console.log('✅ المؤسسة (institution_id)');
    console.log('✅ تاريخ التوظيف (hire_date)');

  } catch (error) {
    console.error('خطأ في تحديث جدول الموظفين:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nتم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
addEmployeeFields();
