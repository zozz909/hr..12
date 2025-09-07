const mysql = require('mysql2/promise');

async function createTestEmployeeForEdit() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // Get an institution for testing
    const [institutions] = await connection.execute(`
      SELECT id, name FROM institutions WHERE status = 'active' LIMIT 1
    `);

    const institutionId = institutions.length > 0 ? institutions[0].id : null;
    const institutionName = institutions.length > 0 ? institutions[0].name : 'غير مكفول';

    // Create test employee with all fields
    const testEmployee = {
      id: `emp-test-edit-${Date.now()}`,
      name: 'أحمد محمد علي للاختبار',
      mobile: '0501234567',
      email: 'ahmed.test@example.com',
      fileNumber: `TEST-EDIT-${Date.now()}`,
      nationality: 'سعودي',
      position: 'مطور برمجيات',
      salary: 8000,
      hireDate: '2024-01-15',
      institutionId: institutionId,
      institution: institutionName,
      status: 'active'
    };

    console.log('\n👤 إنشاء موظف اختبار للتعديل:');
    console.log('='.repeat(50));
    console.log(`🆔 المعرف: ${testEmployee.id}`);
    console.log(`👤 الاسم: ${testEmployee.name}`);
    console.log(`📱 الجوال: ${testEmployee.mobile}`);
    console.log(`📧 البريد: ${testEmployee.email}`);
    console.log(`🏳️ الجنسية: ${testEmployee.nationality}`);
    console.log(`💼 المنصب: ${testEmployee.position}`);
    console.log(`💰 الراتب: ${testEmployee.salary} ريال`);
    console.log(`📅 تاريخ التوظيف: ${testEmployee.hireDate}`);
    console.log(`🏢 المؤسسة: ${testEmployee.institution}`);

    // Insert test employee
    const insertResult = await connection.execute(`
      INSERT INTO employees (
        id, name, mobile, email, file_number, nationality, position, 
        salary, hire_date, institution_id, institution, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      testEmployee.id,
      testEmployee.name,
      testEmployee.mobile,
      testEmployee.email,
      testEmployee.fileNumber,
      testEmployee.nationality,
      testEmployee.position,
      testEmployee.salary,
      testEmployee.hireDate,
      testEmployee.institutionId,
      testEmployee.institution,
      testEmployee.status
    ]);

    if (insertResult.affectedRows > 0) {
      console.log('\n✅ تم إنشاء موظف الاختبار بنجاح!');

      // Verify the created employee
      const [created] = await connection.execute(`
        SELECT id, name, mobile, email, nationality, position, salary, hire_date, institution
        FROM employees 
        WHERE id = ?
      `, [testEmployee.id]);

      if (created.length > 0) {
        const emp = created[0];
        console.log('\n📊 تأكيد البيانات المحفوظة:');
        console.log('='.repeat(50));
        console.log(`👤 الاسم: ${emp.name}`);
        console.log(`📱 الجوال: ${emp.mobile}`);
        console.log(`📧 البريد: ${emp.email}`);
        console.log(`🏳️ الجنسية: ${emp.nationality}`);
        console.log(`💼 المنصب: ${emp.position}`);
        console.log(`💰 الراتب: ${emp.salary} ريال`);
        console.log(`📅 تاريخ التوظيف: ${emp.hire_date}`);
        console.log(`🏢 المؤسسة: ${emp.institution}`);

        console.log('\n🎯 خطوات الاختبار:');
        console.log('='.repeat(50));
        console.log('1. اذهب إلى صفحة الموظفين: http://localhost:9004/employees');
        console.log('2. ابحث عن الموظف: "أحمد محمد علي للاختبار"');
        console.log('3. انقر على ⋮ بجانب الموظف');
        console.log('4. اختر "تعديل"');
        console.log('5. جرب تعديل جميع الحقول:');
        console.log('   • الاسم');
        console.log('   • الجنسية');
        console.log('   • رقم الجوال');
        console.log('   • البريد الإلكتروني');
        console.log('   • المنصب');
        console.log('   • الراتب');
        console.log('   • المؤسسة');
        console.log('   • تاريخ التوظيف');
        console.log('6. انقر "حفظ التغييرات"');
        console.log('7. تأكد من حفظ التغييرات بنجاح');

        console.log('\n🔗 رابط مباشر لصفحة تفاصيل الموظف:');
        console.log(`http://localhost:9004/employees/${testEmployee.id}`);

        console.log('\n💡 نصائح للاختبار:');
        console.log('• جرب تعديل حقل واحد فقط');
        console.log('• جرب تعديل عدة حقول معاً');
        console.log('• جرب ترك بعض الحقول فارغة');
        console.log('• جرب تغيير المؤسسة من وإلى "غير مكفول"');
        console.log('• تأكد من رسائل النجاح والخطأ');
      }
    } else {
      console.log('❌ فشل في إنشاء موظف الاختبار');
    }

  } catch (error) {
    console.error('خطأ في إنشاء موظف الاختبار:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nتم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
createTestEmployeeForEdit();
