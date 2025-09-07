import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Create template data
    const templateData = [
      // Instructions
      [
        '📋 تعليمات: الحقول المطلوبة مميزة بـ (*) - لا تتركها فارغة - استخدم تنسيق التواريخ mm/dd/yyyy',
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
      // Empty row
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
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
      // Format examples
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
      // Empty row
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
      // Sample data 1
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
      // Sample data 2
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
      // Sample data 3
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
      // Sample data 4
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
      // Sample data 5
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

    // Convert to TSV format (Tab Separated Values) - works better with Excel
    const tsvContent = templateData
      .map(row => row.join('\t'))
      .join('\n');

    // Add BOM for proper Arabic display in Excel
    const bom = '\uFEFF';
    const finalContent = bom + tsvContent;

    return new NextResponse(finalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/tab-separated-values; charset=utf-8',
        'Content-Disposition': 'attachment; filename="employee-template.txt"',
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
