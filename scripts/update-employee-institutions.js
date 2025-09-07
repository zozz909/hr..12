const mysql = require('mysql2/promise');

async function updateEmployeeInstitutions() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // Get all institutions
    const [institutions] = await connection.execute(`
      SELECT id, name FROM institutions WHERE status = 'active'
    `);

    console.log(`\n🏢 تم العثور على ${institutions.length} مؤسسة نشطة`);

    // Get employees with institution names but no institution_id
    const [employees] = await connection.execute(`
      SELECT id, name, institution, file_number 
      FROM employees 
      WHERE institution IS NOT NULL 
      AND institution != '' 
      AND institution != 'غير مكفول'
      AND (institution_id IS NULL OR institution_id = '')
    `);

    console.log(`\n👥 تم العثور على ${employees.length} موظف يحتاج ربط بالمؤسسات`);

    let updated = 0;
    let notFound = 0;

    for (const employee of employees) {
      // Find matching institution
      const matchingInstitution = institutions.find(inst => 
        inst.name === employee.institution ||
        inst.name.includes(employee.institution) ||
        employee.institution.includes(inst.name)
      );

      if (matchingInstitution) {
        // Update employee with institution_id
        await connection.execute(`
          UPDATE employees 
          SET institution_id = ?, institution = ?
          WHERE id = ?
        `, [matchingInstitution.id, matchingInstitution.name, employee.id]);

        console.log(`✅ ${employee.name} (${employee.file_number}) -> ${matchingInstitution.name}`);
        updated++;
      } else {
        // Set as unsponsored
        await connection.execute(`
          UPDATE employees 
          SET institution = 'غير مكفول', institution_id = NULL, unsponsored_reason = 'new'
          WHERE id = ?
        `, [employee.id]);

        console.log(`⚠️  ${employee.name} (${employee.file_number}) -> غير مكفول (لم توجد مؤسسة مطابقة: ${employee.institution})`);
        notFound++;
      }
    }

    // Update employees with empty institution to "غير مكفول"
    const [emptyInstitutionEmployees] = await connection.execute(`
      UPDATE employees 
      SET institution = 'غير مكفول', unsponsored_reason = 'new'
      WHERE (institution IS NULL OR institution = '') 
      AND status = 'active'
    `);

    console.log(`\n📊 نتائج التحديث:`);
    console.log('='.repeat(50));
    console.log(`✅ تم ربط ${updated} موظف بمؤسساتهم`);
    console.log(`⚠️  تم تعيين ${notFound} موظف كـ "غير مكفول"`);
    console.log(`🔄 تم تحديث ${emptyInstitutionEmployees.affectedRows} موظف بحقول فارغة`);

    // Display final statistics
    const [finalStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN institution_id IS NOT NULL THEN 1 END) as sponsored,
        COUNT(CASE WHEN institution = 'غير مكفول' OR institution_id IS NULL THEN 1 END) as unsponsored,
        COUNT(CASE WHEN nationality = 'سعودي' THEN 1 END) as saudi,
        COUNT(CASE WHEN nationality != 'سعودي' AND nationality IS NOT NULL THEN 1 END) as non_saudi
      FROM employees 
      WHERE status = 'active'
    `);

    console.log(`\n📈 إحصائيات نهائية:`);
    console.log('='.repeat(50));
    console.log(`إجمالي الموظفين النشطين: ${finalStats[0].total}`);
    console.log(`مكفولين: ${finalStats[0].sponsored}`);
    console.log(`غير مكفولين: ${finalStats[0].unsponsored}`);
    console.log(`سعوديين: ${finalStats[0].saudi}`);
    console.log(`غير سعوديين: ${finalStats[0].non_saudi}`);

    // Show sample of updated employees
    const [sampleEmployees] = await connection.execute(`
      SELECT name, file_number, institution, nationality
      FROM employees 
      WHERE status = 'active'
      ORDER BY updated_at DESC
      LIMIT 10
    `);

    console.log(`\n👥 عينة من الموظفين المحدثين:`);
    console.log('='.repeat(50));
    sampleEmployees.forEach(emp => {
      const sponsorshipStatus = emp.institution === 'غير مكفول' ? '🔴' : '🟢';
      console.log(`${sponsorshipStatus} ${emp.name} (${emp.file_number}) | ${emp.institution} | ${emp.nationality}`);
    });

    console.log('\n🎉 تم تحديث ربط الموظفين بالمؤسسات بنجاح!');

  } catch (error) {
    console.error('خطأ في تحديث ربط الموظفين بالمؤسسات:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nتم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
updateEmployeeInstitutions();
