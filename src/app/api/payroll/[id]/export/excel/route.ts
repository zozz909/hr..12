import { NextRequest, NextResponse } from 'next/server';
import { PayrollModel } from '@/lib/models/Payroll';
import * as XLSX from 'xlsx';

// GET /api/payroll/[id]/export/excel - Export payroll run to Excel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get payroll run and entries
    const response = await PayrollModel.findRunById(id);
    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Payroll run not found' },
        { status: 404 }
      );
    }

    const entries = await PayrollModel.getPayrollEntries(id);
    
    // Prepare data for Excel
    const excelData = entries.map((entry, index) => ({
      'الرقم': index + 1,
      'اسم الموظف': entry.employeeName || 'غير محدد',
      'الراتب الأساسي': entry.baseSalary,
      'المكافآت': entry.rewards,
      'الخصومات': entry.deductions,
      'خصم السلف': entry.advanceDeduction,
      'الراتب الإجمالي': entry.grossPay,
      'صافي الراتب': entry.netPay,
      'تاريخ الإنشاء': new Date(entry.createdAt || '').toLocaleDateString('ar-SA')
    }));

    // Add summary row
    const totalRow = {
      'الرقم': '',
      'اسم الموظف': 'الإجمالي',
      'الراتب الأساسي': entries.reduce((sum, e) => sum + e.baseSalary, 0),
      'المكافآت': entries.reduce((sum, e) => sum + e.rewards, 0),
      'الخصومات': entries.reduce((sum, e) => sum + e.deductions, 0),
      'خصم السلف': entries.reduce((sum, e) => sum + e.advanceDeduction, 0),
      'الراتب الإجمالي': entries.reduce((sum, e) => sum + e.grossPay, 0),
      'صافي الراتب': entries.reduce((sum, e) => sum + e.netPay, 0),
      'تاريخ الإنشاء': ''
    };

    excelData.push(totalRow);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Create main sheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const columnWidths = [
      { wch: 8 },  // الرقم
      { wch: 25 }, // اسم الموظف
      { wch: 15 }, // الراتب الأساسي
      { wch: 12 }, // المكافآت
      { wch: 12 }, // الخصومات
      { wch: 12 }, // خصم السلف
      { wch: 15 }, // الراتب الإجمالي
      { wch: 15 }, // صافي الراتب
      { wch: 15 }  // تاريخ الإنشاء
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'مسير الرواتب');

    // Create summary sheet
    const summaryData = [
      { 'البيان': 'شهر المسير', 'القيمة': response.month },
      { 'البيان': 'المؤسسة', 'القيمة': response.institutionName || 'جميع المؤسسات' },
      { 'البيان': 'تاريخ التنفيذ', 'القيمة': new Date(response.runDate).toLocaleDateString('ar-SA') },
      { 'البيان': 'عدد الموظفين', 'القيمة': response.totalEmployees },
      { 'البيان': 'إجمالي الرواتب', 'القيمة': response.totalGross },
      { 'البيان': 'إجمالي الخصومات', 'القيمة': response.totalDeductions },
      { 'البيان': 'صافي الرواتب', 'القيمة': response.totalNet },
      { 'البيان': 'الحالة', 'القيمة': response.status === 'completed' ? 'مكتمل' : response.status }
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص المسير');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      bookSST: false 
    });

    // Format month for filename
    const [year, month] = response.month.split('-');
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const monthName = monthNames[parseInt(month) - 1];
    const institutionName = response.institutionName || 'جميع_المؤسسات';
    
    const filename = `مسير_الرواتب_${monthName}_${year}_${institutionName}.xlsx`;

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export to Excel' },
      { status: 500 }
    );
  }
}
