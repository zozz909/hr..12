import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { ReportsModel, ReportFilters } from '@/lib/models/Reports';

export async function POST(request: NextRequest) {
  try {
    const { reportType, filters } = await request.json();

    let data: any[] = [];
    let headers: string[] = [];
    let filename = '';

    // تحويل الفلاتر إلى النوع المطلوب
    const reportFilters: ReportFilters = {
      institutionId: filters?.institution || filters?.institutionId,
      branchId: filters?.branch || filters?.branchId,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      month: filters?.month,
      year: filters?.year,
      status: filters?.status,
      employeeId: filters?.employeeId
    };

    switch (reportType) {
      case 'تقرير الرواتب الشهري':
      case 'تقرير الرواتب':
        filename = 'payroll_report';
        headers = ['اسم الموظف', 'رقم الملف', 'الراتب الأساسي', 'البدلات', 'الخصومات', 'صافي الراتب', 'الشهر', 'السنة', 'المؤسسة', 'الفرع'];
        data = await generatePayrollReport(reportFilters);
        break;

      case 'تقرير الفروع':
        filename = 'branches_report';
        headers = ['اسم الفرع', 'المؤسسة', 'العنوان', 'المدير', 'عدد الموظفين', 'الموظفين النشطين', 'إجمالي الرواتب', 'متوسط الراتب', 'الحالة'];
        data = await generateBranchesReport(reportFilters);
        break;

      case 'تقرير جميع الموظفين':
        filename = 'all_employees_report';
        headers = ['الاسم', 'رقم الملف', 'الجوال', 'البريد الإلكتروني', 'الجنسية', 'المنصب', 'الراتب', 'تاريخ التوظيف', 'الحالة', 'المؤسسة', 'الفرع', 'رقم الإقامة', 'انتهاء الإقامة', 'انتهاء تصريح العمل', 'انتهاء العقد'];
        data = await generateAllEmployeesReport(reportFilters);
        break;

      case 'تقرير الوثائق':
      case 'تقرير الوثائق المنتهية':
        filename = 'documents_report';
        headers = ['اسم الموظف', 'رقم الملف', 'الجوال', 'المؤسسة', 'الفرع', 'انتهاء الإقامة', 'حالة الإقامة', 'انتهاء تصريح العمل', 'حالة تصريح العمل', 'انتهاء العقد', 'حالة العقد'];
        data = await generateDocumentsReport(reportFilters);
        break;

      case 'تقرير المؤسسات':
        filename = 'institutions_report';
        headers = ['اسم المؤسسة', 'رقم السجل التجاري', 'انتهاء السجل التجاري', 'حالة السجل', 'البريد الإلكتروني', 'الهاتف', 'العنوان', 'عدد الموظفين', 'الموظفين النشطين', 'الموظفين المؤرشفين', 'عدد الفروع', 'إجمالي الرواتب', 'الحالة'];
        data = await generateInstitutionsReport(reportFilters);
        break;

      case 'تقرير الإجازات':
        filename = 'leaves_report';
        headers = ['اسم الموظف', 'رقم الملف', 'نوع الإجازة', 'تاريخ البداية', 'تاريخ النهاية', 'عدد الأيام', 'السبب', 'الحالة', 'تاريخ الطلب', 'المؤسسة'];
        data = await generateLeavesReport(reportFilters);
        break;

      case 'الخصومات والمكافآت':
        filename = 'compensations_report';
        headers = ['اسم الموظف', 'رقم الملف', 'النوع', 'المبلغ', 'السبب', 'التاريخ', 'المؤسسة'];
        data = await generateCompensationsReport(reportFilters);
        break;

      case 'تقرير السلف':
        filename = 'advances_report';
        headers = ['اسم الموظف', 'رقم الملف', 'مبلغ السلفة', 'المبلغ المدفوع', 'المبلغ المتبقي', 'عدد الأقساط', 'الحالة', 'تاريخ الطلب', 'تاريخ الموافقة', 'المؤسسة'];
        data = await generateAdvancesReport(reportFilters);
        break;

      default:
        return NextResponse.json({ error: 'نوع تقرير غير صحيح' }, { status: 400 });
    }

    // إنشاء ملف Excel
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير');

    // تحويل إلى buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // إرجاع الملف
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('خطأ في توليد التقرير:', error);
    return NextResponse.json({ error: 'خطأ في توليد التقرير' }, { status: 500 });
  }
}

// دوال مساعدة لتوليد البيانات الحقيقية من قاعدة البيانات
async function generatePayrollReport(filters: ReportFilters) {
  try {
    const payrollData = await ReportsModel.getPayrollReport(filters);
    return payrollData.map((row: any) => [
      row.employee_name || 'غير محدد',
      row.file_number || 'غير محدد',
      row.basic_salary || 0,
      row.allowances || 0,
      row.deductions || 0,
      row.net_salary || 0,
      row.month || 'غير محدد',
      row.year || 'غير محدد',
      row.institution_name || 'غير محدد',
      row.branch_name || 'غير محدد'
    ]);
  } catch (error) {
    console.error('خطأ في توليد تقرير الرواتب:', error);
    return [['لا توجد بيانات متاحة', '', '', '', '', '', '', '', '', '']];
  }
}

async function generateBranchesReport(filters: ReportFilters) {
  try {
    const branchesData = await ReportsModel.getBranchesReport(filters);
    return branchesData.map((row: any) => [
      row.branch_name || 'غير محدد',
      row.institution_name || 'غير محدد',
      row.address || 'غير محدد',
      row.manager_name || 'غير محدد',
      row.total_employees || 0,
      row.active_employees || 0,
      row.total_salaries || 0,
      Math.round(row.average_salary || 0),
      row.status || 'غير محدد'
    ]);
  } catch (error) {
    console.error('خطأ في توليد تقرير الفروع:', error);
    return [['لا توجد بيانات متاحة', '', '', '', '', '', '', '', '']];
  }
}

async function generateAllEmployeesReport(filters: ReportFilters) {
  try {
    const employeesData = await ReportsModel.getEmployeesReport(filters);
    return employeesData.map((row: any) => [
      row.name || 'غير محدد',
      row.file_number || 'غير محدد',
      row.mobile || 'غير محدد',
      row.email || 'غير محدد',
      row.nationality || 'غير محدد',
      row.position || 'غير محدد',
      row.salary || 0,
      row.hire_date ? new Date(row.hire_date).toLocaleDateString('ar-SA') : 'غير محدد',
      row.status === 'active' ? 'نشط' : 'مؤرشف',
      row.institution_name || 'غير محدد',
      row.branch_name || 'غير محدد',
      row.iqama_number || 'غير محدد',
      row.iqama_expiry ? new Date(row.iqama_expiry).toLocaleDateString('ar-SA') : 'غير محدد',
      row.work_permit_expiry ? new Date(row.work_permit_expiry).toLocaleDateString('ar-SA') : 'غير محدد',
      row.contract_expiry ? new Date(row.contract_expiry).toLocaleDateString('ar-SA') : 'غير محدد'
    ]);
  } catch (error) {
    console.error('خطأ في توليد تقرير الموظفين:', error);
    return [['لا توجد بيانات متاحة', '', '', '', '', '', '', '', '', '', '', '', '', '', '']];
  }
}

async function generateDocumentsReport(filters: ReportFilters) {
  try {
    const documentsData = await ReportsModel.getExpiringDocumentsReport(filters);
    return documentsData.map((row: any) => [
      row.employee_name || 'غير محدد',
      row.file_number || 'غير محدد',
      row.mobile || 'غير محدد',
      row.institution_name || 'غير محدد',
      row.branch_name || 'غير محدد',
      row.iqama_expiry ? new Date(row.iqama_expiry).toLocaleDateString('ar-SA') : 'غير محدد',
      row.iqama_status || 'غير محدد',
      row.work_permit_expiry ? new Date(row.work_permit_expiry).toLocaleDateString('ar-SA') : 'غير محدد',
      row.work_permit_status || 'غير محدد',
      row.contract_expiry ? new Date(row.contract_expiry).toLocaleDateString('ar-SA') : 'غير محدد',
      row.contract_status || 'غير محدد'
    ]);
  } catch (error) {
    console.error('خطأ في توليد تقرير الوثائق:', error);
    return [['لا توجد بيانات متاحة', '', '', '', '', '', '', '', '', '', '']];
  }
}

async function generateInstitutionsReport(filters: ReportFilters) {
  try {
    const institutionsData = await ReportsModel.getInstitutionsReport(filters);
    return institutionsData.map((row: any) => [
      row.name || 'غير محدد',
      row.cr_number || 'غير محدد',
      row.cr_expiry_date ? new Date(row.cr_expiry_date).toLocaleDateString('ar-SA') : 'غير محدد',
      row.cr_status || 'غير محدد',
      row.email || 'غير محدد',
      row.phone || 'غير محدد',
      row.address || 'غير محدد',
      row.total_employees || 0,
      row.active_employees || 0,
      row.archived_employees || 0,
      row.total_branches || 0,
      row.total_salaries || 0,
      row.status === 'active' ? 'نشط' : 'غير نشط'
    ]);
  } catch (error) {
    console.error('خطأ في توليد تقرير المؤسسات:', error);
    return [['لا توجد بيانات متاحة', '', '', '', '', '', '', '', '', '', '', '', '']];
  }
}

async function generateLeavesReport(filters: ReportFilters) {
  try {
    const leavesData = await ReportsModel.getLeavesReport(filters);
    return leavesData.map((row: any) => [
      row.employee_name || 'غير محدد',
      row.file_number || 'غير محدد',
      row.leave_type === 'annual' ? 'سنوية' :
      row.leave_type === 'sick' ? 'مرضية' :
      row.leave_type === 'emergency' ? 'طارئة' : 'بدون راتب',
      row.start_date ? new Date(row.start_date).toLocaleDateString('ar-SA') : 'غير محدد',
      row.end_date ? new Date(row.end_date).toLocaleDateString('ar-SA') : 'غير محدد',
      row.days_count || 0,
      row.reason || 'غير محدد',
      row.status === 'approved' ? 'موافق عليها' :
      row.status === 'rejected' ? 'مرفوضة' : 'معلقة',
      row.request_date ? new Date(row.request_date).toLocaleDateString('ar-SA') : 'غير محدد',
      row.institution_name || 'غير محدد'
    ]);
  } catch (error) {
    console.error('خطأ في توليد تقرير الإجازات:', error);
    return [['لا توجد بيانات متاحة', '', '', '', '', '', '', '', '', '']];
  }
}

async function generateCompensationsReport(filters: ReportFilters) {
  try {
    const compensationsData = await ReportsModel.getCompensationsReport(filters);
    return compensationsData.map((row: any) => [
      row.employee_name || 'غير محدد',
      row.file_number || 'غير محدد',
      row.type === 'reward' ? 'مكافأة' : 'خصم',
      row.amount || 0,
      row.reason || 'غير محدد',
      row.date ? new Date(row.date).toLocaleDateString('ar-SA') : 'غير محدد',
      row.institution_name || 'غير محدد'
    ]);
  } catch (error) {
    console.error('خطأ في توليد تقرير الخصومات والمكافآت:', error);
    return [['لا توجد بيانات متاحة', '', '', '', '', '', '']];
  }
}

async function generateAdvancesReport(filters: ReportFilters) {
  try {
    const advancesData = await ReportsModel.getAdvancesReport(filters);
    return advancesData.map((row: any) => [
      row.employee_name || 'غير محدد',
      row.file_number || 'غير محدد',
      row.amount || 0,
      row.paid_amount || 0,
      row.remaining_amount || 0,
      row.installments || 1,
      row.status === 'paid' ? 'مدفوعة' :
      row.status === 'approved' ? 'موافق عليها' :
      row.status === 'rejected' ? 'مرفوضة' : 'معلقة',
      row.request_date ? new Date(row.request_date).toLocaleDateString('ar-SA') : 'غير محدد',
      row.approved_date ? new Date(row.approved_date).toLocaleDateString('ar-SA') : 'غير محدد',
      row.institution_name || 'غير محدد'
    ]);
  } catch (error) {
    console.error('خطأ في توليد تقرير السلف:', error);
    return [['لا توجد بيانات متاحة', '', '', '', '', '', '', '', '', '']];
  }
}
