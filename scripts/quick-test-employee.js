const mysql = require('mysql2/promise');

async function quickTestEmployee() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // Get existing employee for testing
    const [employees] = await connection.execute(`
      SELECT id, name, mobile, email, nationality, position, salary, hire_date, institution
      FROM employees 
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (employees.length === 0) {
      console.log('❌ لا يوجد موظفين للاختبار');
      return;
    }

    const employee = employees[0];
    console.log('\n👤 موظف متاح للاختبار:');
    console.log('='.repeat(50));
    console.log(`🆔 المعرف: ${employee.id}`);
    console.log(`👤 الاسم: ${employee.name}`);
    console.log(`📱 الجوال: ${employee.mobile || 'غير محدد'}`);
    console.log(`📧 البريد: ${employee.email || 'غير محدد'}`);
    console.log(`🏳️ الجنسية: ${employee.nationality || 'غير محدد'}`);
    console.log(`💼 المنصب: ${employee.position || 'غير محدد'}`);
    console.log(`💰 الراتب: ${employee.salary || 'غير محدد'} ريال`);
    console.log(`📅 تاريخ التوظيف: ${employee.hire_date || 'غير محدد'}`);
    console.log(`🏢 المؤسسة: ${employee.institution || 'غير مكفول'}`);

    console.log('\n🎯 خطوات اختبار نموذج التعديل:');
    console.log('='.repeat(60));
    console.log('1. اذهب إلى: http://localhost:9004/employees');
    console.log(`2. ابحث عن الموظف: "${employee.name}"`);
    console.log('3. انقر على ⋮ (ثلاث نقاط) بجانب الموظف');
    console.log('4. اختر "تعديل" من القائمة');
    console.log('5. ستفتح نافذة التعديل مع الحقول التالية:');
    console.log('   ✅ الاسم (مطلوب) - مملوء حالياً');
    console.log('   ✅ الجنسية (مطلوب) - مملوء حالياً');
    console.log('   ✅ رقم الجوال (مطلوب) - مملوء حالياً');
    console.log('   ✅ البريد الإلكتروني (اختياري)');
    console.log('   ✅ المنصب (اختياري)');
    console.log('   ✅ الراتب (اختياري)');
    console.log('   ✅ المؤسسة/الكفيل (قائمة منسدلة)');
    console.log('   ✅ تاريخ التوظيف (اختياري)');

    console.log('\n🔗 روابط مفيدة:');
    console.log(`📋 قائمة الموظفين: http://localhost:9004/employees`);
    console.log(`👤 تفاصيل الموظف: http://localhost:9004/employees/${employee.id}`);

    console.log('\n💡 اختبارات مقترحة:');
    console.log('• عدل الاسم وانقر حفظ');
    console.log('• عدل الجنسية من سعودي إلى مصري');
    console.log('• أضف بريد إلكتروني جديد');
    console.log('• عدل المنصب');
    console.log('• زد أو قلل الراتب');
    console.log('• غير المؤسسة');
    console.log('• أضف تاريخ توظيف');

    console.log('\n🎉 جاهز للاختبار!');

  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nتم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

quickTestEmployee();
