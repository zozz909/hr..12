import { NextRequest, NextResponse } from 'next/server';
import { ReportsModel } from '@/lib/models/Reports';

export async function POST(request: NextRequest) {
  try {
    const { reportType, institutionId } = await request.json();

    let data: any[] = [];
    const filters = { institutionId };

    switch (reportType) {
      case 'employees':
        data = await ReportsModel.getEmployeesReport(filters);
        break;

      case 'institutions':
        data = await ReportsModel.getInstitutionsReport(filters);
        break;

      case 'documents':
        data = await ReportsModel.getExpiringDocumentsReport(filters);
        break;

      case 'payroll':
        // للرواتب نأخذ الشهر الحالي
        const currentDate = new Date();
        const currentMonth = (currentDate.getMonth() + 1).toString();
        const currentYear = currentDate.getFullYear().toString();

        data = await ReportsModel.getPayrollReport({
          ...filters,
          month: currentMonth,
          year: currentYear
        });
        break;

      case 'leaves':
        data = await ReportsModel.getLeavesReport(filters);
        break;

      case 'compensations':
        data = await ReportsModel.getCompensationsReport(filters);
        break;

      case 'advances':
        data = await ReportsModel.getAdvancesReport(filters);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'نوع تقرير غير مدعوم' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      reportType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('خطأ في معاينة التقرير:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'حدث خطأ أثناء جلب بيانات التقرير',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    );
  }
}
