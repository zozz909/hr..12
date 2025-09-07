// اختبار حذف الفرع
const mysql = require('mysql2/promise');

async function testBranchDelete() {
  let connection;
  
  try {
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    console.log('🔗 متصل بقاعدة البيانات...');

    // عرض جميع الفروع قبل الحذف
    console.log('\n📋 الفروع الموجودة قبل الحذف:');
    const [branchesBefore] = await connection.execute('SELECT id, name, status FROM branches ORDER BY name');
    branchesBefore.forEach(branch => {
      console.log(`   - ${branch.name} (${branch.id}) - ${branch.status}`);
    });

    if (branchesBefore.length === 0) {
      console.log('   لا توجد فروع في قاعدة البيانات');
      return;
    }

    // اختيار أول فرع للحذف
    const branchToDelete = branchesBefore[0];
    console.log(`\n🗑️ سيتم حذف الفرع: ${branchToDelete.name} (${branchToDelete.id})`);

    // تحديث الموظفين المرتبطين بالفرع
    console.log('📝 تحديث الموظفين المرتبطين بالفرع...');
    const [updateResult] = await connection.execute(
      'UPDATE employees SET branch_id = NULL WHERE branch_id = ?',
      [branchToDelete.id]
    );
    console.log(`   تم تحديث ${updateResult.affectedRows} موظف`);

    // حذف الفرع
    console.log('🗑️ حذف الفرع من قاعدة البيانات...');
    const [deleteResult] = await connection.execute(
      'DELETE FROM branches WHERE id = ?',
      [branchToDelete.id]
    );
    console.log(`   تم حذف ${deleteResult.affectedRows} فرع`);

    // عرض الفروع بعد الحذف
    console.log('\n📋 الفروع الموجودة بعد الحذف:');
    const [branchesAfter] = await connection.execute('SELECT id, name, status FROM branches ORDER BY name');
    if (branchesAfter.length === 0) {
      console.log('   لا توجد فروع في قاعدة البيانات');
    } else {
      branchesAfter.forEach(branch => {
        console.log(`   - ${branch.name} (${branch.id}) - ${branch.status}`);
      });
    }

    // التحقق من نجاح الحذف
    if (deleteResult.affectedRows > 0) {
      console.log('\n✅ تم حذف الفرع بنجاح من قاعدة البيانات!');
    } else {
      console.log('\n❌ فشل في حذف الفرع من قاعدة البيانات!');
    }

  } catch (error) {
    console.error('❌ خطأ في اختبار حذف الفرع:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الاختبار
testBranchDelete();
