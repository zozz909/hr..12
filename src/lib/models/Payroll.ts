import { executeQuery, formatDateForMySQL } from '../db';
import { generateId } from '../utils';
import { AdvanceDeductionModel } from './AdvanceDeduction';
import { CompensationModel } from './Compensation';

export interface PayrollRun {
  id: string;
  month: string; // Format: YYYY-MM
  runDate: string;
  institutionId?: string | null;
  institutionName?: string;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollEntry {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName?: string;
  employeePhotoUrl?: string;
  baseSalary: number;
  rewards: number; // From compensations table
  deductions: number; // From compensations table
  advanceDeduction: number; // From advances table
  grossPay: number; // baseSalary + rewards
  netPay: number; // grossPay - deductions - advanceDeduction
  createdAt?: string;
}

export interface PayrollCalculation {
  employeeId: string;
  employeeName: string;
  employeePhotoUrl?: string;
  baseSalary: number;
  rewards: number;
  deductions: number;
  advanceDeduction: number;
  grossPay: number;
  netPay: number;
  rewardsDetails: Array<{
    id: string;
    amount: number;
    reason: string;
    date: string;
  }>;
  deductionsDetails: Array<{
    id: string;
    amount: number;
    reason: string;
    date: string;
  }>;
  advanceDetails: Array<{
    advanceId: string;
    deductionAmount: number;
    remainingAmount: number;
  }>;
}

export class PayrollModel {
  // Create a new payroll run
  static async createRun(data: {
    month: string;
    institutionId?: string | null;
  }): Promise<PayrollRun> {
    const id = generateId('payroll');
    const query = `
      INSERT INTO payroll_runs (
        id, month, institution_id, total_employees, total_gross, total_deductions, total_net, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      data.month,
      data.institutionId || null,
      0, // Will be updated after processing
      0, // Will be updated after processing
      0, // Will be updated after processing
      0, // Will be updated after processing
      'pending'
    ];

    await executeQuery(query, values);
    return await this.findRunById(id) as PayrollRun;
  }

  // Calculate payroll for all employees in an institution
  static async calculatePayroll(month: string, institutionId?: string): Promise<PayrollCalculation[]> {
    // Get active employees
    let employeesQuery = `
      SELECT 
        e.id, e.name, e.photo_url, e.salary,
        i.name as institution_name
      FROM employees e
      LEFT JOIN institutions i ON e.institution_id = i.id
      WHERE e.status = 'active' AND e.salary > 0
    `;
    const employeesValues: any[] = [];

    if (institutionId) {
      employeesQuery += ' AND e.institution_id = ?';
      employeesValues.push(institutionId);
    }

    employeesQuery += ' ORDER BY e.name';

    const employees = await executeQuery(employeesQuery, employeesValues);
    const calculations: PayrollCalculation[] = [];

    for (const employee of employees) {
      const calculation = await this.calculateEmployeePayroll(employee.id, month);
      calculation.employeeName = employee.name;
      calculation.employeePhotoUrl = employee.photo_url;
      calculation.baseSalary = parseFloat(employee.salary);
      
      calculations.push(calculation);
    }

    return calculations;
  }

  // Calculate payroll for a specific employee
  static async calculateEmployeePayroll(employeeId: string, month: string): Promise<PayrollCalculation> {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    // Get employee basic info
    const employeeQuery = `
      SELECT id, name, photo_url, salary 
      FROM employees 
      WHERE id = ? AND status = 'active'
    `;
    const employeeResult = await executeQuery(employeeQuery, [employeeId]);
    const employee = employeeResult[0];

    if (!employee) {
      throw new Error('Employee not found or inactive');
    }

    const baseSalary = parseFloat(employee.salary || 0);

    // Get rewards for the month
    const rewardsQuery = `
      SELECT id, amount, reason, date
      FROM compensations 
      WHERE employee_id = ? 
        AND type = 'reward' 
        AND DATE(date) BETWEEN ? AND ?
      ORDER BY date DESC
    `;
    const rewardsResult = await executeQuery(rewardsQuery, [employeeId, startDate, endDate]);
    const rewards = rewardsResult.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);

    // Get deductions for the month
    const deductionsQuery = `
      SELECT id, amount, reason, date
      FROM compensations 
      WHERE employee_id = ? 
        AND type = 'deduction' 
        AND DATE(date) BETWEEN ? AND ?
      ORDER BY date DESC
    `;
    const deductionsResult = await executeQuery(deductionsQuery, [employeeId, startDate, endDate]);
    const deductions = deductionsResult.reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0);

    // Calculate advance deduction
    const advanceDeduction = await AdvanceDeductionModel.calculateTotalMonthlyDeduction(employeeId);
    const advanceDetails = await AdvanceDeductionModel.getActiveAdvancesForEmployee(employeeId);

    // Calculate totals
    const grossPay = baseSalary + rewards;
    const netPay = grossPay - deductions - advanceDeduction;

    return {
      employeeId,
      employeeName: employee.name,
      employeePhotoUrl: employee.photo_url,
      baseSalary,
      rewards,
      deductions,
      advanceDeduction,
      grossPay,
      netPay,
      rewardsDetails: rewardsResult.map((r: any) => ({
        id: r.id,
        amount: parseFloat(r.amount),
        reason: r.reason,
        date: r.date
      })),
      deductionsDetails: deductionsResult.map((d: any) => ({
        id: d.id,
        amount: parseFloat(d.amount),
        reason: d.reason,
        date: d.date
      })),
      advanceDetails: advanceDetails.map(a => ({
        advanceId: a.advanceId,
        deductionAmount: a.monthlyDeduction,
        remainingAmount: a.remainingAmount
      }))
    };
  }

  // Process payroll run (create entries and apply deductions)
  static async processPayrollRun(payrollRunId: string): Promise<{
    success: boolean;
    totalEmployees: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    entries: PayrollEntry[];
  }> {
    try {
      // Get payroll run details
      const run = await this.findRunById(payrollRunId);
      if (!run) {
        throw new Error('Payroll run not found');
      }

      // Calculate payroll for all employees
      const calculations = await this.calculatePayroll(run.month, run.institutionId);
      
      let totalEmployees = 0;
      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;
      const entries: PayrollEntry[] = [];

      for (const calc of calculations) {
        // Create payroll entry
        const entryId = generateId('payentry');
        const entry: PayrollEntry = {
          id: entryId,
          payrollRunId,
          employeeId: calc.employeeId,
          employeeName: calc.employeeName,
          employeePhotoUrl: calc.employeePhotoUrl,
          baseSalary: calc.baseSalary,
          rewards: calc.rewards,
          deductions: calc.deductions,
          advanceDeduction: calc.advanceDeduction,
          grossPay: calc.grossPay,
          netPay: calc.netPay
        };

        // Insert payroll entry
        await this.createPayrollEntry(entry);

        // Process advance deductions
        if (calc.advanceDeduction > 0) {
          await AdvanceDeductionModel.processAdvanceDeductions(payrollRunId, calc.employeeId);
        }

        entries.push(entry);
        totalEmployees++;
        totalGross += calc.grossPay;
        totalDeductions += calc.deductions + calc.advanceDeduction;
        totalNet += calc.netPay;
      }

      // Update payroll run totals
      await this.updateRunTotals(payrollRunId, {
        totalEmployees,
        totalGross,
        totalDeductions,
        totalNet,
        status: 'completed'
      });

      return {
        success: true,
        totalEmployees,
        totalGross,
        totalDeductions,
        totalNet,
        entries
      };

    } catch (error) {
      // Mark payroll run as failed
      await this.updateRunStatus(payrollRunId, 'failed');
      throw error;
    }
  }

  // Create payroll entry
  static async createPayrollEntry(entry: PayrollEntry): Promise<void> {
    const query = `
      INSERT INTO payroll_entries (
        id, payroll_run_id, employee_id, base_salary, rewards, deductions, 
        advance_deduction, gross_pay, net_pay
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      entry.id,
      entry.payrollRunId,
      entry.employeeId,
      entry.baseSalary,
      entry.rewards,
      entry.deductions,
      entry.advanceDeduction,
      entry.grossPay,
      entry.netPay
    ];

    await executeQuery(query, values);
  }

  // Find payroll run by ID
  static async findRunById(id: string): Promise<PayrollRun | null> {
    const query = `
      SELECT 
        pr.*,
        i.name as institution_name
      FROM payroll_runs pr
      LEFT JOIN institutions i ON pr.institution_id = i.id
      WHERE pr.id = ?
    `;

    const results = await executeQuery(query, [id]);
    if (results.length === 0) return null;

    const row = results[0];
    return {
      id: row.id,
      month: row.month,
      runDate: row.run_date,
      institutionId: row.institution_id,
      institutionName: row.institution_name,
      totalEmployees: row.total_employees,
      totalGross: parseFloat(row.total_gross),
      totalDeductions: parseFloat(row.total_deductions),
      totalNet: parseFloat(row.total_net),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Update payroll run totals
  static async updateRunTotals(id: string, data: {
    totalEmployees: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    status: 'completed' | 'pending' | 'failed';
  }): Promise<void> {
    const query = `
      UPDATE payroll_runs 
      SET total_employees = ?, total_gross = ?, total_deductions = ?, total_net = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      data.totalEmployees,
      data.totalGross,
      data.totalDeductions,
      data.totalNet,
      data.status,
      id
    ];

    await executeQuery(query, values);
  }

  // Update payroll run status
  static async updateRunStatus(id: string, status: 'completed' | 'pending' | 'failed'): Promise<void> {
    const query = `
      UPDATE payroll_runs 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await executeQuery(query, [status, id]);
  }

  // Get all payroll runs with optional filters
  static async findAllRuns(filters: {
    institutionId?: string;
    status?: 'completed' | 'pending' | 'failed';
    startMonth?: string;
    endMonth?: string;
  } = {}): Promise<PayrollRun[]> {
    let query = `
      SELECT 
        pr.*,
        i.name as institution_name
      FROM payroll_runs pr
      LEFT JOIN institutions i ON pr.institution_id = i.id
      WHERE 1=1
    `;
    const values: any[] = [];

    if (filters.institutionId) {
      query += ' AND pr.institution_id = ?';
      values.push(filters.institutionId);
    }

    if (filters.status) {
      query += ' AND pr.status = ?';
      values.push(filters.status);
    }

    if (filters.startMonth) {
      query += ' AND pr.month >= ?';
      values.push(filters.startMonth);
    }

    if (filters.endMonth) {
      query += ' AND pr.month <= ?';
      values.push(filters.endMonth);
    }

    query += ' ORDER BY pr.month DESC, pr.created_at DESC';

    const results = await executeQuery(query, values);
    return results.map((row: any) => ({
      id: row.id,
      month: row.month,
      runDate: row.run_date,
      institutionId: row.institution_id,
      institutionName: row.institution_name,
      totalEmployees: row.total_employees,
      totalGross: parseFloat(row.total_gross),
      totalDeductions: parseFloat(row.total_deductions),
      totalNet: parseFloat(row.total_net),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  // Get payroll entries for a specific run
  static async getPayrollEntries(payrollRunId: string): Promise<PayrollEntry[]> {
    const query = `
      SELECT 
        pe.*,
        e.name as employee_name,
        e.photo_url as employee_photo_url
      FROM payroll_entries pe
      LEFT JOIN employees e ON pe.employee_id = e.id
      WHERE pe.payroll_run_id = ?
      ORDER BY e.name
    `;

    const results = await executeQuery(query, [payrollRunId]);
    return results.map((row: any) => ({
      id: row.id,
      payrollRunId: row.payroll_run_id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      employeePhotoUrl: row.employee_photo_url,
      baseSalary: parseFloat(row.base_salary),
      rewards: parseFloat(row.rewards),
      deductions: parseFloat(row.deductions),
      advanceDeduction: parseFloat(row.advance_deduction),
      grossPay: parseFloat(row.gross_pay),
      netPay: parseFloat(row.net_pay),
      createdAt: row.created_at
    }));
  }

  // Delete payroll run and all its entries
  static async deleteRun(id: string): Promise<boolean> {
    try {
      // First reverse any advance deductions
      await AdvanceDeductionModel.reverseDeductions(id);
      
      // Delete payroll entries (will cascade)
      const deleteQuery = 'DELETE FROM payroll_runs WHERE id = ?';
      const result = await executeQuery(deleteQuery, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting payroll run:', error);
      return false;
    }
  }

  // Get payroll statistics
  static async getStats(filters: {
    institutionId?: string;
    startMonth?: string;
    endMonth?: string;
  } = {}): Promise<{
    totalRuns: number;
    totalEmployees: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    averageNetPay: number;
  }> {
    let query = `
      SELECT 
        COUNT(*) as total_runs,
        SUM(total_employees) as total_employees,
        SUM(total_gross) as total_gross,
        SUM(total_deductions) as total_deductions,
        SUM(total_net) as total_net
      FROM payroll_runs pr
      WHERE status = 'completed'
    `;
    const values: any[] = [];

    if (filters.institutionId) {
      query += ' AND pr.institution_id = ?';
      values.push(filters.institutionId);
    }

    if (filters.startMonth) {
      query += ' AND pr.month >= ?';
      values.push(filters.startMonth);
    }

    if (filters.endMonth) {
      query += ' AND pr.month <= ?';
      values.push(filters.endMonth);
    }

    const results = await executeQuery(query, values);
    const row = results[0] || {};

    const totalEmployees = parseInt(row.total_employees || 0);
    const totalNet = parseFloat(row.total_net || 0);

    return {
      totalRuns: parseInt(row.total_runs || 0),
      totalEmployees,
      totalGross: parseFloat(row.total_gross || 0),
      totalDeductions: parseFloat(row.total_deductions || 0),
      totalNet,
      averageNetPay: totalEmployees > 0 ? totalNet / totalEmployees : 0
    };
  }
}
