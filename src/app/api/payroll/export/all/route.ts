import { NextRequest, NextResponse } from 'next/server';
import { PayrollModel } from '@/lib/models/Payroll';
import * as XLSX from 'xlsx';

// GET /api/payroll/export/all - Export all payroll runs to Excel
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');
    const startMonth = searchParams.get('start_month');
    const endMonth = searchParams.get('end_month');
    const format = searchParams.get('format') || 'excel'; // excel or summary

    const filters: any = {};
    if (institutionId) filters.institutionId = institutionId;
    if (startMonth) filters.startMonth = startMonth;
    if (endMonth) filters.endMonth = endMonth;

    // Get all payroll runs
    const payrollRuns = await PayrollModel.findAllRuns(filters);
    
    if (payrollRuns.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No payroll runs found' },
        { status: 404 }
      );
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    if (format === 'summary') {
      // Summary sheet only
      const summaryData = payrollRuns.map((run, index) => ({
        'الرقم': index + 1,
        'الشهر': formatMonth(run.month),
        'المؤسسة': run.institutionName || 'جميع المؤسسات',
        'عدد الموظفين': run.totalEmployees,
        'إجمالي الرواتب': run.totalGross,
        'إجمالي الخصومات': run.totalDeductions,
        'صافي الرواتب': run.totalNet,
        'تاريخ التنفيذ': new Date(run.runDate).toLocaleDateString('ar-SA'),
        'الحالة': run.status === 'completed' ? 'مكتمل' : run.status
      }));

      // Add totals row
      const totalsRow = {
        'الرقم': '',
        'الشهر': 'الإجمالي',
        'المؤسسة': '',
        'عدد الموظفين': payrollRuns.reduce((sum, r) => sum + r.totalEmployees, 0),
        'إجمالي الرواتب': payrollRuns.reduce((sum, r) => sum + r.totalGross, 0),
        'إجمالي الخصومات': payrollRuns.reduce((sum, r) => sum + r.totalDeductions, 0),
        'صافي الرواتب': payrollRuns.reduce((sum, r) => sum + r.totalNet, 0),
        'تاريخ التنفيذ': '',
        'الحالة': ''
      };

      summaryData.push(totalsRow);

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [
        { wch: 8 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, 
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص المسيرات');

    } else {
      // Detailed sheets for each payroll run
      for (const run of payrollRuns) {
        const entries = await PayrollModel.getPayrollEntries(run.id);
        
        const sheetData = entries.map((entry, index) => ({
          'الرقم': index + 1,
          'اسم الموظف': entry.employeeName || 'غير محدد',
          'الراتب الأساسي': entry.baseSalary,
          'المكافآت': entry.rewards,
          'الخصومات': entry.deductions,
          'خصم السلف': entry.advanceDeduction,
          'الراتب الإجمالي': entry.grossPay,
          'صافي الراتب': entry.netPay
        }));

        // Add summary row for this payroll run
        const runTotalRow = {
          'الرقم': '',
          'اسم الموظف': 'الإجمالي',
          'الراتب الأساسي': entries.reduce((sum, e) => sum + e.baseSalary, 0),
          'المكافآت': entries.reduce((sum, e) => sum + e.rewards, 0),
          'الخصومات': entries.reduce((sum, e) => sum + e.deductions, 0),
          'خصم السلف': entries.reduce((sum, e) => sum + e.advanceDeduction, 0),
          'الراتب الإجمالي': entries.reduce((sum, e) => sum + e.grossPay, 0),
          'صافي الراتب': entries.reduce((sum, e) => sum + e.netPay, 0)
        };

        sheetData.push(runTotalRow);

        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        worksheet['!cols'] = [
          { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, 
          { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
        ];
        
        const sheetName = formatMonth(run.month).substring(0, 31); // Excel sheet name limit
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      bookSST: false 
    });

    // Generate filename
    const dateRange = startMonth && endMonth 
      ? `${formatMonth(startMonth)}_إلى_${formatMonth(endMonth)}`
      : 'جميع_الفترات';
    
    const institutionName = institutionId ? 'مؤسسة_محددة' : 'جميع_المؤسسات';
    const filename = `مسيرات_الرواتب_${dateRange}_${institutionName}.xlsx`;

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
    console.error('Error exporting all payroll runs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export payroll runs' },
      { status: 500 }
    );
  }
}

// Helper function
function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}
