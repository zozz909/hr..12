const XLSX = require('xlsx');
const mysql = require('mysql2/promise');

async function createTestWithRealInstitutions() {
  let connection;
  
  try {
    // Connect to database to get real institutions
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123',
      database: 'hr_system'
    });

    // Get active institutions
    const [institutions] = await connection.execute(`
      SELECT name FROM institutions WHERE status = 'active' ORDER BY name
    `);

    console.log('🏢 المؤسسات المتاحة:');
    institutions.forEach((inst, index) => {
      console.log(`${index + 1}. ${inst.name}`);
    });

    // Create test data with real institution names
    const data = [
      // Headers
      [
        'اسم الموظف *',
        'رقم الملف *',
        'رقم الجوال *',
        'البريد الإلكتروني',
        'الجنسية *',
        'المنصب',
        'المؤسسة / الكفيل',
        'راتب',
        'انتهاء الإقامة',
        'انتهاء رخصة العمل',
        'انتهاء العقد',
        'انتهاء التأمين الصحي',
        'انتهاء الشهادة الحية'
      ],
      // Test data with real institutions
      [
        'أحمد محمد علي الأحمد',
        'EMP-REAL-001',
        '0501234567',
        'ahmed@test.com',
        'سعودي',
        'مطور برمجيات أول',
        institutions[0]?.name || 'غير مكفول', // First institution
        8000,
        '12/31/2025',
        '06/30/2025',
        '12/31/2026',
        '03/15/2025',
        '09/20/2025'
      ],
      [
        'فاطمة أحمد سالم العتيبي',
        'EMP-REAL-002',
        '0509876543',
        'fatima@test.com',
        'مصري',
        'محاسبة قانونية',
        institutions[1]?.name || 'غير مكفول', // Second institution
        6500,
        '08/15/2025',
        '03/20/2025',
        '01/31/2026',
        '11/10/2024',
        '07/05/2025'
      ],
      [
        'محمد عبدالله الشهري',
        'EMP-REAL-003',
        '0551122334',
        'mohammed@test.com',
        'يمني',
        'مهندس مدني',
        institutions[2]?.name || 'غير مكفول', // Third institution
        12000,
        '04/22/2025',
        '10/15/2025',
        '05/30/2026',
        '01/20/2025',
        '12/12/2024'
      ],
      [
        'نورا سالم القحطاني',
        'EMP-REAL-004',
        '0543216789',
        'nora@test.com',
        'سعودي',
        'مصممة جرافيك',
        'غير مكفول', // Explicitly unsponsored
        7500,
        '11/20/2025',
        '08/30/2025',
        '09/15/2026',
        '04/25/2025',
        '12/10/2025'
      ],
      [
        'خالد عبدالعزيز المطيري',
        'EMP-REAL-005',
        '0512345678',
        'khalid@test.com',
        'كويتي',
        'مهندس شبكات',
        '', // Empty - should default to "غير مكفول"
        13500,
        '05/10/2025',
        '03/25/2025',
        '08/20/2026',
        '02/15/2025',
        '07/05/2025'
      ],
      [
        'مريم عبدالله الدوسري',
        'EMP-REAL-006',
        '0598765432',
        'mariam@test.com',
        'سعودي',
        'محاسبة',
        'مؤسسة غير موجودة', // This should trigger validation error
        8500,
        '07/18/2025',
        '05/12/2025',
        '11/30/2026',
        '06/08/2025',
        '09/22/2025'
      ]
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // اسم الموظف
      { wch: 15 }, // رقم الملف
      { wch: 15 }, // رقم الجوال
      { wch: 25 }, // البريد الإلكتروني
      { wch: 12 }, // الجنسية
      { wch: 20 }, // المنصب
      { wch: 30 }, // المؤسسة
      { wch: 10 }, // راتب
      { wch: 15 }, // انتهاء الإقامة
      { wch: 15 }, // انتهاء رخصة العمل
      { wch: 15 }, // انتهاء العقد
      { wch: 15 }, // انتهاء التأمين الصحي
      { wch: 15 }, // انتهاء الشهادة الحية
    ];

    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'اختبار المؤسسات');

    // Write to file
    XLSX.writeFile(workbook, 'test-employees-with-real-institutions.xlsx');
    console.log('\n✅ تم إنشاء ملف test-employees-with-real-institutions.xlsx بنجاح!');
    
    console.log('\n📋 محتويات الملف:');
    console.log('='.repeat(50));
    console.log('✅ موظف مع مؤسسة صحيحة (يجب أن يُربط)');
    console.log('✅ موظف مع مؤسسة صحيحة أخرى (يجب أن يُربط)');
    console.log('✅ موظف مع "غير مكفول" (يجب أن يُحفظ كغير مكفول)');
    console.log('✅ موظف بحقل فارغ (يجب أن يُحول لغير مكفول)');
    console.log('❌ موظف مع مؤسسة غير موجودة (يجب أن يُظهر خطأ)');

  } catch (error) {
    console.error('خطأ في إنشاء ملف الاختبار:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTestWithRealInstitutions();
