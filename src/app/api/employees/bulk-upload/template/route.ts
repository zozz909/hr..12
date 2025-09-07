import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Excel file generator using xlsx library
function createExcelBuffer(data: any[][]): Buffer {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths for better display
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

  // Add some styling to header row
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  // Style the header row (row 3 which contains the actual headers)
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 2, c: col }); // Row 3 (0-indexed)
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: "4472C4" } },
        font: { color: { rgb: "FFFFFF" }, bold: true },
        alignment: { horizontal: "center" }
      };
    }
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قالب الموظفين');

  // Generate Excel buffer
  const excelBuffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
    compression: true
  });

  return excelBuffer;
}

export async function GET(request: NextRequest) {
  try {
    // Create Excel template data with clear formatting
    const templateData = [
      // Instructions row
      [
        '📋 تعليمات مهمة: الحقول المطلوبة مميزة بـ (*) - لا تتركها فارغة',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      // Institution note row
      [
        '🏢 ملاحظة: اتركه فارغاً أو اكتب "غير مكفول" للموظفين غير المكفولين',
        '',
        '',
        '',
        '',
        '',
        'يمكن تعديل المؤسسة من المعاينة',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      // Empty row for spacing
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
      // Headers with clear formatting
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
      // Format examples row
      [
        'مثال: أحمد محمد علي',
        'مثال: EMP-001',
        'مثال: 0501234567',
        'مثال: ahmed@company.com',
        'مثال: سعودي',
        'مثال: مطور برمجيات',
        'مثال: شركة التقنية',
        'مثال: 8000',
        'مثال: 12/31/2025',
        'مثال: 06/30/2025',
        'مثال: 12/31/2026',
        'مثال: 03/15/2025',
        'مثال: 09/20/2025'
      ],
      // Empty row for spacing
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
      // Sample data row 1
      [
        'أحمد محمد علي الأحمد',
        'EMP-001',
        '0501234567',
        'ahmed.mohammed@company.com',
        'سعودي',
        'مطور برمجيات أول',
        'شركة التقنية المتقدمة',
        '8000',
        '12/31/2025',
        '06/30/2025',
        '12/31/2026',
        '03/15/2025',
        '09/20/2025'
      ],
      // Sample data row 2
      [
        'فاطمة أحمد سالم العتيبي',
        'EMP-002',
        '0509876543',
        'fatima.ahmed@company.com',
        'مصري',
        'محاسبة قانونية',
        'مؤسسة المالية الحديثة',
        '6500',
        '08/15/2025',
        '03/20/2025',
        '01/31/2026',
        '11/10/2024',
        '07/05/2025'
      ],
      // Sample data row 3
      [
        'محمد عبدالله الشهري',
        'EMP-003',
        '0551122334',
        'mohammed.abdullah@company.com',
        'يمني',
        'مهندس مدني',
        'شركة الإنشاءات الكبرى',
        '12000',
        '04/22/2025',
        '10/15/2025',
        '05/30/2026',
        '01/20/2025',
        '12/12/2024'
      ],
      // Sample data row 4
      [
        'نورا سالم القحطاني',
        'EMP-004',
        '0543216789',
        'nora.salem@company.com',
        'سعودي',
        'مصممة جرافيك',
        'وكالة الإبداع الرقمي',
        '7500',
        '11/20/2025',
        '08/30/2025',
        '09/15/2026',
        '04/25/2025',
        '12/10/2025'
      ],
      // Sample data row 5
      [
        'خالد عبدالعزيز المطيري',
        'EMP-005',
        '0512345678',
        'khalid.abdulaziz@company.com',
        'كويتي',
        'مهندس شبكات',
        'شركة الاتصالات المتقدمة',
        '13500',
        '05/10/2025',
        '03/25/2025',
        '08/20/2026',
        '02/15/2025',
        '07/05/2025'
      ]
    ];

    // Create Excel file buffer
    const excelBuffer = createExcelBuffer(templateData);

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="employee-template.xlsx"',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في إنشاء القالب' },
      { status: 500 }
    );
  }
}
