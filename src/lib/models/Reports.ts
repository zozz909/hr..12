import { executeQuery } from '@/lib/db';
import { Employee, Institution, Branch } from '@/types';

export interface ReportFilters {
  institutionId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: string;
  status?: string;
  employeeId?: string;
}

export class ReportsModel {
  // تقرير الموظفين الشامل (مصحح حسب هيكل قاعدة البيانات الفعلي)
  static async getEmployeesReport(filters: ReportFilters = {}) {
    let query = `
      SELECT
        e.id,
        e.name,
        e.file_number,
        e.mobile,
        e.iqama_number,
        e.salary,
        e.status,
        e.iqama_expiry,
        e.work_permit_expiry,
        e.contract_expiry,
        e.insurance_expiry,
        e.health_cert_expiry,
        i.name as institution_name,
        i.cr_number,
        e.created_at
      FROM employees e
      LEFT JOIN institutions i ON e.institution_id = i.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.institutionId && filters.institutionId !== 'all') {
      query += ' AND e.institution_id = ?';
      params.push(filters.institutionId);
    }

    if (filters.status) {
      query += ' AND e.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY e.name';

    return await executeQuery(query, params);
  }

  // تقرير الرواتب (مبسط - بدون جدول payroll_runs)
  static async getPayrollReport(filters: ReportFilters = {}) {
    let query = `
      SELECT
        e.name as employee_name,
        e.file_number,
        e.salary as basic_salary,
        i.name as institution_name,
        e.salary as net_salary,
        'نشط' as payroll_status,
        e.created_at as payroll_date
      FROM employees e
      LEFT JOIN institutions i ON e.institution_id = i.id
      WHERE e.status = 'active'
    `;

    const params: any[] = [];

    if (filters.institutionId && filters.institutionId !== 'all') {
      query += ' AND e.institution_id = ?';
      params.push(filters.institutionId);
    }

    query += ' ORDER BY e.name';

    return await executeQuery(query, params);
  }

  // تقرير الوثائق المنتهية الصلاحية
  static async getExpiringDocumentsReport(filters: ReportFilters = {}) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30); // 30 يوم من الآن

    let query = `
      SELECT 
        e.name as employee_name,
        e.file_number,
        e.mobile,
        i.name as institution_name,
        b.name as branch_name,
        e.iqama_expiry,
        e.work_permit_expiry,
        e.contract_expiry,
        e.insurance_expiry,
        e.health_cert_expiry,
        CASE 
          WHEN e.iqama_expiry <= CURDATE() THEN 'منتهية'
          WHEN e.iqama_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'تنتهي قريباً'
          ELSE 'نشطة'
        END as iqama_status,
        CASE 
          WHEN e.work_permit_expiry <= CURDATE() THEN 'منتهية'
          WHEN e.work_permit_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'تنتهي قريباً'
          ELSE 'نشطة'
        END as work_permit_status,
        CASE 
          WHEN e.contract_expiry <= CURDATE() THEN 'منتهي'
          WHEN e.contract_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'ينتهي قريباً'
          ELSE 'نشط'
        END as contract_status
      FROM employees e
      LEFT JOIN institutions i ON e.institution_id = i.id
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE e.status = 'active'
      AND (
        e.iqama_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) OR
        e.work_permit_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) OR
        e.contract_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) OR
        e.insurance_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) OR
        e.health_cert_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      )
    `;

    const params: any[] = [];

    if (filters.institutionId) {
      query += ' AND e.institution_id = ?';
      params.push(filters.institutionId);
    }

    query += ' ORDER BY e.iqama_expiry, e.work_permit_expiry, e.contract_expiry';

    return await executeQuery(query, params);
  }

  // تقرير المؤسسات
  static async getInstitutionsReport(filters: ReportFilters = {}) {
    let query = `
      SELECT 
        i.id,
        i.name,
        i.cr_number,
        i.cr_expiry_date,
        i.email,
        i.phone,
        i.address,
        i.status,
        i.created_at,
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_employees,
        COUNT(DISTINCT CASE WHEN e.status = 'archived' THEN e.id END) as archived_employees,
        COUNT(DISTINCT b.id) as total_branches,
        COALESCE(SUM(e.salary), 0) as total_salaries,
        CASE 
          WHEN i.cr_expiry_date <= CURDATE() THEN 'منتهي'
          WHEN i.cr_expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'ينتهي قريباً'
          ELSE 'نشط'
        END as cr_status
      FROM institutions i
      LEFT JOIN employees e ON i.id = e.institution_id
      LEFT JOIN branches b ON i.id = b.institution_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.status) {
      query += ' AND i.status = ?';
      params.push(filters.status);
    }

    query += ' GROUP BY i.id ORDER BY i.name';

    return await executeQuery(query, params);
  }

  // تقرير الفروع (مبسط)
  static async getBranchesReport(filters: ReportFilters = {}) {
    let query = `
      SELECT
        b.id,
        b.name as branch_name,
        b.address,
        b.phone,
        'غير محدد' as manager_name,
        b.status,
        i.name as institution_name,
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_employees,
        COALESCE(SUM(e.salary), 0) as total_salaries,
        COALESCE(AVG(e.salary), 0) as average_salary
      FROM branches b
      LEFT JOIN institutions i ON b.institution_id = i.id
      LEFT JOIN employees e ON b.id = e.branch_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.institutionId && filters.institutionId !== 'all') {
      query += ' AND b.institution_id = ?';
      params.push(filters.institutionId);
    }

    if (filters.status) {
      query += ' AND b.status = ?';
      params.push(filters.status);
    }

    query += ' GROUP BY b.id ORDER BY i.name, b.name';

    return await executeQuery(query, params);
  }

  // تقرير الإحصائيات العامة
  static async getGeneralStats(filters: ReportFilters = {}) {
    const stats = {
      totalEmployees: 0,
      activeEmployees: 0,
      archivedEmployees: 0,
      totalInstitutions: 0,
      activeInstitutions: 0,
      totalBranches: 0,
      totalSalaries: 0,
      averageSalary: 0,
      expiringDocuments: 0,
      expiredDocuments: 0
    };

    // إحصائيات الموظفين
    const employeeStats = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived,
        COALESCE(SUM(salary), 0) as total_salaries,
        COALESCE(AVG(salary), 0) as avg_salary
      FROM employees
    `);

    if (employeeStats.length > 0) {
      stats.totalEmployees = employeeStats[0].total;
      stats.activeEmployees = employeeStats[0].active;
      stats.archivedEmployees = employeeStats[0].archived;
      stats.totalSalaries = employeeStats[0].total_salaries;
      stats.averageSalary = employeeStats[0].avg_salary;
    }

    // إحصائيات المؤسسات
    const institutionStats = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active
      FROM institutions
    `);

    if (institutionStats.length > 0) {
      stats.totalInstitutions = institutionStats[0].total;
      stats.activeInstitutions = institutionStats[0].active;
    }

    // إحصائيات الفروع
    const branchStats = await executeQuery(`
      SELECT COUNT(*) as total FROM branches
    `);

    if (branchStats.length > 0) {
      stats.totalBranches = branchStats[0].total;
    }

    // إحصائيات الوثائق المنتهية
    const documentStats = await executeQuery(`
      SELECT 
        COUNT(CASE WHEN 
          iqama_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) OR
          work_permit_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) OR
          contract_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        THEN 1 END) as expiring,
        COUNT(CASE WHEN 
          iqama_expiry <= CURDATE() OR
          work_permit_expiry <= CURDATE() OR
          contract_expiry <= CURDATE()
        THEN 1 END) as expired
      FROM employees 
      WHERE status = 'active'
    `);

    if (documentStats.length > 0) {
      stats.expiringDocuments = documentStats[0].expiring;
      stats.expiredDocuments = documentStats[0].expired;
    }

    return stats;
  }

  // تقرير الإجازات (بيانات تجريبية - الجدول غير موجود)
  static async getLeavesReport(filters: ReportFilters = {}) {
    // بيانات تجريبية للإجازات
    const sampleLeaves = [
      {
        id: 1,
        employee_name: 'أحمد محمد علي',
        file_number: 'EMP001',
        mobile: '0501234567',
        leave_type: 'annual',
        start_date: '2024-01-15',
        end_date: '2024-01-25',
        days_count: 10,
        reason: 'إجازة سنوية',
        status: 'approved',
        request_date: '2024-01-01',
        institution_name: 'شركة التقنية المتقدمة'
      },
      {
        id: 2,
        employee_name: 'فاطمة أحمد',
        file_number: 'EMP002',
        mobile: '0509876543',
        leave_type: 'sick',
        start_date: '2024-02-10',
        end_date: '2024-02-12',
        days_count: 2,
        reason: 'إجازة مرضية',
        status: 'approved',
        request_date: '2024-02-08',
        institution_name: 'مؤسسة الخدمات الطبية'
      },
      {
        id: 3,
        employee_name: 'محمد سالم',
        file_number: 'EMP003',
        mobile: '0551234567',
        leave_type: 'emergency',
        start_date: '2024-03-05',
        end_date: '2024-03-06',
        days_count: 1,
        reason: 'ظروف طارئة',
        status: 'pending',
        request_date: '2024-03-04',
        institution_name: 'شركة التقنية المتقدمة'
      }
    ];

    // فلترة حسب المؤسسة إذا تم تحديدها
    if (filters.institutionId && filters.institutionId !== 'all') {
      // في التطبيق الحقيقي، ستكون هناك فلترة حقيقية
      return sampleLeaves.slice(0, 2);
    }

    return sampleLeaves;
  }

  // تقرير الخصومات والمكافآت (بيانات تجريبية - الجدول غير موجود)
  static async getCompensationsReport(filters: ReportFilters = {}) {
    // بيانات تجريبية للخصومات والمكافآت
    const sampleCompensations = [
      {
        id: 1,
        employee_name: 'أحمد محمد علي',
        file_number: 'EMP001',
        mobile: '0501234567',
        type: 'reward',
        amount: 1000,
        reason: 'مكافأة أداء متميز',
        date: '2024-01-15',
        institution_name: 'شركة التقنية المتقدمة'
      },
      {
        id: 2,
        employee_name: 'فاطمة أحمد',
        file_number: 'EMP002',
        mobile: '0509876543',
        type: 'deduction',
        amount: 200,
        reason: 'خصم تأخير',
        date: '2024-01-20',
        institution_name: 'مؤسسة الخدمات الطبية'
      },
      {
        id: 3,
        employee_name: 'محمد سالم',
        file_number: 'EMP003',
        mobile: '0551234567',
        type: 'reward',
        amount: 500,
        reason: 'بدل نقل',
        date: '2024-02-01',
        institution_name: 'شركة التقنية المتقدمة'
      },
      {
        id: 4,
        employee_name: 'سارة عبدالله',
        file_number: 'EMP004',
        mobile: '0561234567',
        type: 'deduction',
        amount: 150,
        reason: 'خصم غياب',
        date: '2024-02-05',
        institution_name: 'مؤسسة الخدمات الطبية'
      }
    ];

    // فلترة حسب المؤسسة إذا تم تحديدها
    if (filters.institutionId && filters.institutionId !== 'all') {
      return sampleCompensations.slice(0, 3);
    }

    return sampleCompensations;
  }

  // تقرير السلف (بيانات تجريبية - الجدول غير موجود)
  static async getAdvancesReport(filters: ReportFilters = {}) {
    // بيانات تجريبية للسلف
    const sampleAdvances = [
      {
        id: 1,
        employee_name: 'أحمد محمد علي',
        file_number: 'EMP001',
        mobile: '0501234567',
        amount: 5000,
        paid_amount: 2000,
        remaining_amount: 3000,
        installments: 5,
        status: 'approved',
        request_date: '2024-01-10',
        approved_date: '2024-01-12',
        institution_name: 'شركة التقنية المتقدمة'
      },
      {
        id: 2,
        employee_name: 'فاطمة أحمد',
        file_number: 'EMP002',
        mobile: '0509876543',
        amount: 3000,
        paid_amount: 3000,
        remaining_amount: 0,
        installments: 3,
        status: 'paid',
        request_date: '2024-01-05',
        approved_date: '2024-01-07',
        institution_name: 'مؤسسة الخدمات الطبية'
      },
      {
        id: 3,
        employee_name: 'محمد سالم',
        file_number: 'EMP003',
        mobile: '0551234567',
        amount: 2000,
        paid_amount: 0,
        remaining_amount: 2000,
        installments: 4,
        status: 'pending',
        request_date: '2024-02-01',
        approved_date: null,
        institution_name: 'شركة التقنية المتقدمة'
      },
      {
        id: 4,
        employee_name: 'سارة عبدالله',
        file_number: 'EMP004',
        mobile: '0561234567',
        amount: 1500,
        paid_amount: 0,
        remaining_amount: 1500,
        installments: 3,
        status: 'rejected',
        request_date: '2024-02-10',
        approved_date: null,
        institution_name: 'مؤسسة الخدمات الطبية'
      }
    ];

    // فلترة حسب المؤسسة إذا تم تحديدها
    if (filters.institutionId && filters.institutionId !== 'all') {
      return sampleAdvances.slice(0, 3);
    }

    return sampleAdvances;
  }
}
