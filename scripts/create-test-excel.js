const XLSX = require('xlsx');
const fs = require('fs');

// Create test Excel file
function createTestExcel() {
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
    // Test data 1
    [
      'أحمد محمد علي الأحمد',
      'EMP-TEST-001',
      '0501234567',
      'ahmed@test.com',
      'سعودي',
      'مطور برمجيات',
      'شركة التقنية المتقدمة',
      8000,
      '12/31/2025',
      '06/30/2025',
      '12/31/2026',
      '03/15/2025',
      '09/20/2025'
    ],
    // Test data 2
    [
      'فاطمة أحمد سالم العتيبي',
      'EMP-TEST-002',
      '0509876543',
      'fatima@test.com',
      'مصري',
      'محاسبة قانونية',
      'مؤسسة المالية الحديثة',
      6500,
      '08/15/2025',
      '03/20/2025',
      '01/31/2026',
      '11/10/2024',
      '07/05/2025'
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
    { wch: 25 }, // المؤسسة
    { wch: 10 }, // راتب
    { wch: 15 }, // انتهاء الإقامة
    { wch: 15 }, // انتهاء رخصة العمل
    { wch: 15 }, // انتهاء العقد
    { wch: 15 }, // انتهاء التأمين الصحي
    { wch: 15 }, // انتهاء الشهادة الحية
  ];

  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الموظفين');

  // Write to file
  XLSX.writeFile(workbook, 'test-employees.xlsx');
  console.log('✅ تم إنشاء ملف test-employees.xlsx بنجاح!');
  
  // Also create a simple CSV version
  const csvData = data.map(row => row.join(',')).join('\n');
  fs.writeFileSync('test-employees-simple.csv', '\uFEFF' + csvData, 'utf8');
  console.log('✅ تم إنشاء ملف test-employees-simple.csv بنجاح!');
}

createTestExcel();
