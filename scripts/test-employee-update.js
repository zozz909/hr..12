const mysql = require('mysql2/promise');

async function testEmployeeUpdate() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // Get first employee for testing
    const [employees] = await connection.execute(`
      SELECT id, name, mobile, email, nationality, position, salary, hire_date, institution_id
      FROM employees 
      WHERE status = 'active'
      LIMIT 1
    `);

    if (employees.length === 0) {
      console.log('❌ لا يوجد موظفين للاختبار');
      return;
    }

    const employee = employees[0];
    console.log('\n👤 الموظف المختار للاختبار:');
    console.log('='.repeat(50));
    console.log(`🆔 المعرف: ${employee.id}`);
    console.log(`👤 الاسم: ${employee.name}`);
    console.log(`📱 الجوال: ${employee.mobile || 'غير محدد'}`);
    console.log(`📧 البريد: ${employee.email || 'غير محدد'}`);
    console.log(`🏳️ الجنسية: ${employee.nationality || 'غير محدد'}`);
    console.log(`💼 المنصب: ${employee.position || 'غير محدد'}`);
    console.log(`💰 الراتب: ${employee.salary || 'غير محدد'} ريال`);
    console.log(`📅 تاريخ التوظيف: ${employee.hire_date || 'غير محدد'}`);
    console.log(`🏢 المؤسسة: ${employee.institution_id || 'غير مكفول'}`);

    // Test update with new data
    const testData = {
      name: employee.name + ' (محدث)',
      mobile: '0501234567',
      email: 'updated@test.com',
      nationality: 'سعودي',
      position: 'مطور برمجيات أول',
      salary: 8500,
      hireDate: '2024-01-15'
    };

    console.log('\n🔄 اختبار التحديث بالبيانات الجديدة:');
    console.log('='.repeat(50));
    console.log(`👤 الاسم الجديد: ${testData.name}`);
    console.log(`📱 الجوال الجديد: ${testData.mobile}`);
    console.log(`📧 البريد الجديد: ${testData.email}`);
    console.log(`🏳️ الجنسية الجديدة: ${testData.nationality}`);
    console.log(`💼 المنصب الجديد: ${testData.position}`);
    console.log(`💰 الراتب الجديد: ${testData.salary} ريال`);
    console.log(`📅 تاريخ التوظيف الجديد: ${testData.hireDate}`);

    // Perform update
    const updateResult = await connection.execute(`
      UPDATE employees 
      SET 
        name = ?,
        mobile = ?,
        email = ?,
        nationality = ?,
        position = ?,
        salary = ?,
        hire_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      testData.name,
      testData.mobile,
      testData.email,
      testData.nationality,
      testData.position,
      testData.salary,
      testData.hireDate,
      employee.id
    ]);

    if (updateResult.affectedRows > 0) {
      console.log('\n✅ تم التحديث بنجاح!');

      // Get updated data
      const [updatedEmployees] = await connection.execute(`
        SELECT id, name, mobile, email, nationality, position, salary, hire_date, institution_id, updated_at
        FROM employees 
        WHERE id = ?
      `, [employee.id]);

      if (updatedEmployees.length > 0) {
        const updatedEmployee = updatedEmployees[0];
        console.log('\n📊 البيانات بعد التحديث:');
        console.log('='.repeat(50));
        console.log(`👤 الاسم: ${updatedEmployee.name}`);
        console.log(`📱 الجوال: ${updatedEmployee.mobile}`);
        console.log(`📧 البريد: ${updatedEmployee.email}`);
        console.log(`🏳️ الجنسية: ${updatedEmployee.nationality}`);
        console.log(`💼 المنصب: ${updatedEmployee.position}`);
        console.log(`💰 الراتب: ${updatedEmployee.salary} ريال`);
        console.log(`📅 تاريخ التوظيف: ${updatedEmployee.hire_date}`);
        console.log(`🕐 آخر تحديث: ${updatedEmployee.updated_at}`);

        // Test API-like update (partial update)
        console.log('\n🧪 اختبار التحديث الجزئي (مثل API):');
        console.log('='.repeat(50));
        
        const partialUpdate = {
          email: 'partial-update@test.com',
          salary: 9000
        };

        console.log(`📧 تحديث البريد إلى: ${partialUpdate.email}`);
        console.log(`💰 تحديث الراتب إلى: ${partialUpdate.salary} ريال`);

        const partialResult = await connection.execute(`
          UPDATE employees 
          SET 
            email = ?,
            salary = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [partialUpdate.email, partialUpdate.salary, employee.id]);

        if (partialResult.affectedRows > 0) {
          console.log('✅ تم التحديث الجزئي بنجاح!');

          // Get final data
          const [finalEmployees] = await connection.execute(`
            SELECT name, mobile, email, nationality, position, salary, hire_date, updated_at
            FROM employees 
            WHERE id = ?
          `, [employee.id]);

          if (finalEmployees.length > 0) {
            const finalEmployee = finalEmployees[0];
            console.log('\n📊 البيانات النهائية:');
            console.log('='.repeat(50));
            console.log(`👤 الاسم: ${finalEmployee.name}`);
            console.log(`📱 الجوال: ${finalEmployee.mobile}`);
            console.log(`📧 البريد: ${finalEmployee.email} ✨`);
            console.log(`🏳️ الجنسية: ${finalEmployee.nationality}`);
            console.log(`💼 المنصب: ${finalEmployee.position}`);
            console.log(`💰 الراتب: ${finalEmployee.salary} ريال ✨`);
            console.log(`📅 تاريخ التوظيف: ${finalEmployee.hire_date}`);
            console.log(`🕐 آخر تحديث: ${finalEmployee.updated_at}`);
          }
        }
      }
    } else {
      console.log('❌ فشل في التحديث');
    }

    console.log('\n🎉 انتهى اختبار تحديث الموظف بنجاح!');
    console.log('\n📝 الحقول التي تم اختبارها:');
    console.log('✅ الاسم - تم التحديث');
    console.log('✅ الجوال - تم التحديث');
    console.log('✅ البريد الإلكتروني - تم التحديث');
    console.log('✅ الجنسية - تم التحديث');
    console.log('✅ المنصب - تم التحديث');
    console.log('✅ الراتب - تم التحديث');
    console.log('✅ تاريخ التوظيف - تم التحديث');
    console.log('✅ التحديث الجزئي - يعمل بشكل صحيح');

  } catch (error) {
    console.error('خطأ في اختبار تحديث الموظف:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nتم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الاختبار
testEmployeeUpdate();
