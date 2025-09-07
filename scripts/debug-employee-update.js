const mysql = require('mysql2/promise');

async function debugEmployeeUpdate() {
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
      SELECT id, name, mobile, email, nationality, position, salary, hire_date
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
    console.log(`🆔 المعرف: ${employee.id}`);
    console.log(`👤 الاسم: ${employee.name}`);

    // Test simple update first
    console.log('\n🔄 اختبار تحديث بسيط (الاسم فقط):');
    
    try {
      const simpleResult = await connection.execute(`
        UPDATE employees 
        SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [employee.name + ' (تم التحديث)', employee.id]);

      console.log(`✅ نتيجة التحديث البسيط: ${simpleResult.affectedRows} صف تم تحديثه`);

      if (simpleResult.affectedRows > 0) {
        // Check updated data
        const [updated] = await connection.execute(`
          SELECT name, updated_at FROM employees WHERE id = ?
        `, [employee.id]);

        if (updated.length > 0) {
          console.log(`📝 الاسم الجديد: ${updated[0].name}`);
          console.log(`🕐 وقت التحديث: ${updated[0].updated_at}`);
        }
      }
    } catch (error) {
      console.error('❌ خطأ في التحديث البسيط:', error.message);
    }

    // Test email update
    console.log('\n📧 اختبار تحديث البريد الإلكتروني:');
    
    try {
      const emailResult = await connection.execute(`
        UPDATE employees 
        SET email = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, ['test-debug@example.com', employee.id]);

      console.log(`✅ نتيجة تحديث البريد: ${emailResult.affectedRows} صف تم تحديثه`);

      if (emailResult.affectedRows > 0) {
        const [updated] = await connection.execute(`
          SELECT email FROM employees WHERE id = ?
        `, [employee.id]);

        if (updated.length > 0) {
          console.log(`📧 البريد الجديد: ${updated[0].email}`);
        }
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث البريد:', error.message);
    }

    // Test hire_date update
    console.log('\n📅 اختبار تحديث تاريخ التوظيف:');
    
    try {
      const hireDateResult = await connection.execute(`
        UPDATE employees 
        SET hire_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, ['2024-01-15', employee.id]);

      console.log(`✅ نتيجة تحديث تاريخ التوظيف: ${hireDateResult.affectedRows} صف تم تحديثه`);

      if (hireDateResult.affectedRows > 0) {
        const [updated] = await connection.execute(`
          SELECT hire_date FROM employees WHERE id = ?
        `, [employee.id]);

        if (updated.length > 0) {
          console.log(`📅 تاريخ التوظيف الجديد: ${updated[0].hire_date}`);
        }
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث تاريخ التوظيف:', error.message);
    }

    // Test multiple fields update
    console.log('\n🔄 اختبار تحديث عدة حقول:');
    
    try {
      const multiResult = await connection.execute(`
        UPDATE employees 
        SET 
          nationality = ?,
          position = ?,
          salary = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, ['مصري', 'مطور برمجيات', 7500, employee.id]);

      console.log(`✅ نتيجة التحديث المتعدد: ${multiResult.affectedRows} صف تم تحديثه`);

      if (multiResult.affectedRows > 0) {
        const [updated] = await connection.execute(`
          SELECT nationality, position, salary FROM employees WHERE id = ?
        `, [employee.id]);

        if (updated.length > 0) {
          console.log(`🏳️ الجنسية الجديدة: ${updated[0].nationality}`);
          console.log(`💼 المنصب الجديد: ${updated[0].position}`);
          console.log(`💰 الراتب الجديد: ${updated[0].salary}`);
        }
      }
    } catch (error) {
      console.error('❌ خطأ في التحديث المتعدد:', error.message);
    }

    // Show final state
    console.log('\n📊 الحالة النهائية للموظف:');
    const [final] = await connection.execute(`
      SELECT name, mobile, email, nationality, position, salary, hire_date, updated_at
      FROM employees WHERE id = ?
    `, [employee.id]);

    if (final.length > 0) {
      const emp = final[0];
      console.log('='.repeat(50));
      console.log(`👤 الاسم: ${emp.name}`);
      console.log(`📱 الجوال: ${emp.mobile}`);
      console.log(`📧 البريد: ${emp.email}`);
      console.log(`🏳️ الجنسية: ${emp.nationality}`);
      console.log(`💼 المنصب: ${emp.position}`);
      console.log(`💰 الراتب: ${emp.salary}`);
      console.log(`📅 تاريخ التوظيف: ${emp.hire_date}`);
      console.log(`🕐 آخر تحديث: ${emp.updated_at}`);
    }

    console.log('\n🎉 انتهى اختبار التشخيص!');

  } catch (error) {
    console.error('خطأ في اختبار التشخيص:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nتم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الاختبار
debugEmployeeUpdate();
