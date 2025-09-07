const mysql = require('mysql2/promise');

async function createSimpleTestEmployee() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // Check if test employee already exists
    const timestamp = Date.now();
    const fileNumber = `TEST-EDIT-${timestamp}`;
    
    const [existing] = await connection.execute(`
      SELECT id FROM employees WHERE file_number = ?
    `, [fileNumber]);

    if (existing.length > 0) {
      console.log('⚠️ موظف الاختبار موجود بالفعل');
      return;
    }

    // Get an institution for testing
    const [institutions] = await connection.execute(`
      SELECT id, name FROM institutions WHERE status = 'active' LIMIT 1
    `);

    const institutionId = institutions.length > 0 ? institutions[0].id : null;
    const institutionName = institutions.length > 0 ? institutions[0].name : 'غير مكفول';

    // Create test employee with minimal required fields first
    const testEmployee = {
      id: `emp-test-edit-${timestamp}`,
      name: 'أحمد محمد علي للاختبار',
      mobile: '0501234567',
      fileNumber: fileNumber,
      nationality: 'سعودي',
      status: 'active'
    };

    console.log('\n👤 إنشاء موظف اختبار بسيط:');
    console.log('='.repeat(50));
    console.log(`🆔 المعرف: ${testEmployee.id}`);
    console.log(`👤 الاسم: ${testEmployee.name}`);
    console.log(`📱 الجوال: ${testEmployee.mobile}`);
    console.log(`📄 رقم الملف: ${testEmployee.fileNumber}`);
    console.log(`🏳️ الجنسية: ${testEmployee.nationality}`);

    try {
      // Insert with minimal fields first
      const insertResult = await connection.execute(`
        INSERT INTO employees (
          id, name, mobile, file_number, nationality, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        testEmployee.id,
        testEmployee.name,
        testEmployee.mobile,
        testEmployee.fileNumber,
        testEmployee.nationality,
        testEmployee.status
      ]);

      console.log(`\n✅ تم إنشاء الموظف بنجاح! (${insertResult.affectedRows} صف)`);

      // Now update with additional fields
      const updateResult = await connection.execute(`
        UPDATE employees 
        SET 
          email = ?,
          position = ?,
          salary = ?,
          hire_date = ?,
          institution_id = ?,
          institution = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        'ahmed.test@example.com',
        'مطور برمجيات',
        8000,
        '2024-01-15',
        institutionId,
        institutionName,
        testEmployee.id
      ]);

      console.log(`✅ تم تحديث البيانات الإضافية! (${updateResult.affectedRows} صف)`);

      // Verify final data
      const [final] = await connection.execute(`
        SELECT id, name, mobile, email, nationality, position, salary, hire_date, institution, file_number
        FROM employees 
        WHERE id = ?
      `, [testEmployee.id]);

      if (final.length > 0) {
        const emp = final[0];
        console.log('\n📊 البيانات النهائية:');
        console.log('='.repeat(50));
        console.log(`🆔 المعرف: ${emp.id}`);
        console.log(`👤 الاسم: ${emp.name}`);
        console.log(`📱 الجوال: ${emp.mobile}`);
        console.log(`📧 البريد: ${emp.email}`);
        console.log(`🏳️ الجنسية: ${emp.nationality}`);
        console.log(`💼 المنصب: ${emp.position}`);
        console.log(`💰 الراتب: ${emp.salary} ريال`);
        console.log(`📅 تاريخ التوظيف: ${emp.hire_date}`);
        console.log(`🏢 المؤسسة: ${emp.institution}`);
        console.log(`📄 رقم الملف: ${emp.file_number}`);

        console.log('\n🎯 خطوات اختبار نموذج التعديل:');
        console.log('='.repeat(60));
        console.log('1. اذهب إلى: http://localhost:9004/employees');
        console.log(`2. ابحث عن: "${emp.name}"`);
        console.log('3. انقر على ⋮ (ثلاث نقاط) بجانب الموظف');
        console.log('4. اختر "تعديل" من القائمة');
        console.log('5. ستفتح نافذة التعديل مع الحقول التالية:');
        console.log('   ✅ الاسم (مطلوب)');
        console.log('   ✅ الجنسية (مطلوب)');
        console.log('   ✅ رقم الجوال (مطلوب)');
        console.log('   ✅ البريد الإلكتروني (اختياري)');
        console.log('   ✅ المنصب (اختياري)');
        console.log('   ✅ الراتب (اختياري)');
        console.log('   ✅ المؤسسة/الكفيل (قائمة منسدلة)');
        console.log('   ✅ تاريخ التوظيف (اختياري)');
        console.log('6. عدل أي حقل تريده');
        console.log('7. انقر "حفظ التغييرات"');
        console.log('8. تأكد من ظهور رسالة "تم التحديث بنجاح"');

        console.log('\n🔗 رابط مباشر لصفحة تفاصيل الموظف:');
        console.log(`http://localhost:9004/employees/${emp.id}`);

        console.log('\n💡 اختبارات مقترحة:');
        console.log('• غير الاسم إلى "أحمد محمد علي المحدث"');
        console.log('• غير الجنسية إلى "مصري"');
        console.log('• غير الجوال إلى "0509876543"');
        console.log('• غير البريد إلى "ahmed.updated@test.com"');
        console.log('• غير المنصب إلى "مطور برمجيات أول"');
        console.log('• غير الراتب إلى "9500"');
        console.log('• غير المؤسسة إلى مؤسسة أخرى أو "غير مكفول"');
        console.log('• غير تاريخ التوظيف إلى "2024-06-01"');

        console.log('\n🎉 موظف الاختبار جاهز للتعديل!');
      }
    } else {
      console.log('❌ فشل في إنشاء موظف الاختبار');
    }

  } catch (insertError) {
    console.error('خطأ في إدراج الموظف:', insertError);
    if (insertError.code === 'ER_DUP_ENTRY') {
      console.log('💡 المشكلة: رقم الملف مكرر. جرب تشغيل السكريبت مرة أخرى.');
    }

  } catch (error) {
    console.error('خطأ في إنشاء موظف الاختبار:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('💡 المشكلة: رقم الملف مكرر. جرب تشغيل السكريبت مرة أخرى.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nتم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
createSimpleTestEmployee();
