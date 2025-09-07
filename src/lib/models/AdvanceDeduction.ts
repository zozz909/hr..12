import { executeQuery, formatDateForMySQL } from '../db';
import { AdvanceModel } from './Advance';

export interface AdvanceDeduction {
  id: string;
  advanceId: string;
  employeeId: string;
  payrollRunId: string;
  deductionAmount: number;
  remainingAmount: number;
  deductionDate: string;
  createdAt?: string;
}

export class AdvanceDeductionModel {
  // Calculate monthly deduction for an advance
  static calculateMonthlyDeduction(totalAmount: number, installments: number): number {
    return Math.round((totalAmount / installments) * 100) / 100; // Round to 2 decimal places
  }

  // Get all active advances that need deduction for a specific employee
  static async getActiveAdvancesForEmployee(employeeId: string): Promise<{
    advanceId: string;
    totalAmount: number;
    remainingAmount: number;
    installments: number;
    monthlyDeduction: number;
  }[]> {
    const query = `
      SELECT 
        id as advance_id,
        amount as total_amount,
        remaining_amount,
        installments
      FROM advances 
      WHERE employee_id = ? 
        AND status = 'approved' 
        AND remaining_amount > 0
      ORDER BY approved_date ASC
    `;

    const results = await executeQuery(query, [employeeId]);
    
    return results.map((row: any) => ({
      advanceId: row.advance_id,
      totalAmount: parseFloat(row.total_amount),
      remainingAmount: parseFloat(row.remaining_amount),
      installments: row.installments,
      monthlyDeduction: this.calculateMonthlyDeduction(
        parseFloat(row.total_amount), 
        row.installments
      )
    }));
  }

  // Calculate total monthly advance deduction for an employee
  static async calculateTotalMonthlyDeduction(employeeId: string): Promise<number> {
    const activeAdvances = await this.getActiveAdvancesForEmployee(employeeId);
    
    let totalDeduction = 0;
    for (const advance of activeAdvances) {
      const monthlyDeduction = Math.min(advance.monthlyDeduction, advance.remainingAmount);
      totalDeduction += monthlyDeduction;
    }
    
    return Math.round(totalDeduction * 100) / 100;
  }

  // Process advance deductions for a payroll run
  static async processAdvanceDeductions(payrollRunId: string, employeeId: string): Promise<{
    totalDeduction: number;
    deductions: AdvanceDeduction[];
  }> {
    const activeAdvances = await this.getActiveAdvancesForEmployee(employeeId);
    const deductions: AdvanceDeduction[] = [];
    let totalDeduction = 0;

    for (const advance of activeAdvances) {
      const monthlyDeduction = Math.min(advance.monthlyDeduction, advance.remainingAmount);
      
      if (monthlyDeduction > 0) {
        // Create deduction record
        const deductionId = `ded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const deduction: AdvanceDeduction = {
          id: deductionId,
          advanceId: advance.advanceId,
          employeeId: employeeId,
          payrollRunId: payrollRunId,
          deductionAmount: monthlyDeduction,
          remainingAmount: advance.remainingAmount - monthlyDeduction,
          deductionDate: new Date().toISOString()
        };

        // Insert deduction record
        await this.createDeductionRecord(deduction);

        // Update advance remaining amount
        await this.updateAdvanceRemainingAmount(
          advance.advanceId, 
          advance.remainingAmount - monthlyDeduction
        );

        deductions.push(deduction);
        totalDeduction += monthlyDeduction;
      }
    }

    return { totalDeduction, deductions };
  }

  // Create deduction record
  static async createDeductionRecord(deduction: AdvanceDeduction): Promise<void> {
    const query = `
      INSERT INTO advance_deductions (
        id, advance_id, employee_id, payroll_run_id, 
        deduction_amount, remaining_amount, deduction_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      deduction.id,
      deduction.advanceId,
      deduction.employeeId,
      deduction.payrollRunId,
      deduction.deductionAmount,
      deduction.remainingAmount,
      formatDateForMySQL(deduction.deductionDate)
    ];

    await executeQuery(query, values);
  }

  // Update advance remaining amount and status
  static async updateAdvanceRemainingAmount(advanceId: string, newRemainingAmount: number): Promise<void> {
    const newStatus = newRemainingAmount <= 0 ? 'paid' : 'approved';
    const paidAmount = newRemainingAmount <= 0 ? 
      `(SELECT amount FROM advances WHERE id = ?)` : 
      `(SELECT amount - ? FROM advances WHERE id = ?)`;

    let query: string;
    let values: any[];

    if (newRemainingAmount <= 0) {
      query = `
        UPDATE advances 
        SET remaining_amount = 0,
            paid_amount = amount,
            status = 'paid',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      values = [advanceId];
    } else {
      query = `
        UPDATE advances 
        SET remaining_amount = ?,
            paid_amount = amount - ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      values = [newRemainingAmount, newRemainingAmount, newStatus, advanceId];
    }

    await executeQuery(query, values);
  }

  // Get deduction history for an advance
  static async getDeductionHistory(advanceId: string): Promise<AdvanceDeduction[]> {
    const query = `
      SELECT 
        ad.*,
        pr.month as payroll_month
      FROM advance_deductions ad
      LEFT JOIN payroll_runs pr ON ad.payroll_run_id = pr.id
      WHERE ad.advance_id = ?
      ORDER BY ad.deduction_date DESC
    `;

    const results = await executeQuery(query, [advanceId]);
    
    return results.map((row: any) => ({
      id: row.id,
      advanceId: row.advance_id,
      employeeId: row.employee_id,
      payrollRunId: row.payroll_run_id,
      deductionAmount: parseFloat(row.deduction_amount),
      remainingAmount: parseFloat(row.remaining_amount),
      deductionDate: row.deduction_date,
      createdAt: row.created_at
    }));
  }

  // Get employee's advance deductions for a specific payroll run
  static async getEmployeeDeductionsForPayroll(employeeId: string, payrollRunId: string): Promise<AdvanceDeduction[]> {
    const query = `
      SELECT * FROM advance_deductions 
      WHERE employee_id = ? AND payroll_run_id = ?
      ORDER BY deduction_date DESC
    `;

    const results = await executeQuery(query, [employeeId, payrollRunId]);
    
    return results.map((row: any) => ({
      id: row.id,
      advanceId: row.advance_id,
      employeeId: row.employee_id,
      payrollRunId: row.payroll_run_id,
      deductionAmount: parseFloat(row.deduction_amount),
      remainingAmount: parseFloat(row.remaining_amount),
      deductionDate: row.deduction_date,
      createdAt: row.created_at
    }));
  }

  // Reverse advance deductions (in case payroll is cancelled)
  static async reverseDeductions(payrollRunId: string): Promise<boolean> {
    try {
      // Get all deductions for this payroll run
      const deductionsQuery = `
        SELECT advance_id, deduction_amount 
        FROM advance_deductions 
        WHERE payroll_run_id = ?
      `;
      const deductions = await executeQuery(deductionsQuery, [payrollRunId]);

      // Restore remaining amounts for each advance
      for (const deduction of deductions) {
        await executeQuery(`
          UPDATE advances 
          SET remaining_amount = remaining_amount + ?,
              paid_amount = paid_amount - ?,
              status = CASE 
                WHEN remaining_amount + ? > 0 THEN 'approved'
                ELSE status 
              END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          deduction.deduction_amount,
          deduction.deduction_amount,
          deduction.deduction_amount,
          deduction.advance_id
        ]);
      }

      // Delete deduction records
      await executeQuery(`
        DELETE FROM advance_deductions 
        WHERE payroll_run_id = ?
      `, [payrollRunId]);

      return true;
    } catch (error) {
      console.error('Error reversing advance deductions:', error);
      return false;
    }
  }
}
