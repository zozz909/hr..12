import { executeQuery, formatDateForMySQL } from '../db';
import { generateId } from '../utils';

export interface Compensation {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeePhotoUrl?: string;
  type: 'deduction' | 'reward';
  amount: number;
  reason: string;
  date: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class CompensationModel {
  // Create a new compensation
  static async create(data: Omit<Compensation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Compensation> {
    const id = generateId('comp');
    const query = `
      INSERT INTO compensations (
        id, employee_id, type, amount, reason, date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      data.employeeId,
      data.type,
      data.amount,
      data.reason,
      formatDateForMySQL(data.date),
      data.createdBy || null
    ];

    await executeQuery(query, values);
    return await this.findById(id) as Compensation;
  }

  // Find compensation by ID with employee details
  static async findById(id: string): Promise<Compensation | null> {
    const query = `
      SELECT 
        c.*,
        e.name as employee_name,
        e.photo_url as employee_photo_url
      FROM compensations c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE c.id = ?
    `;

    const results = await executeQuery(query, [id]);
    if (results.length === 0) return null;

    const row = results[0];
    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      employeePhotoUrl: row.employee_photo_url,
      type: row.type,
      amount: parseFloat(row.amount),
      reason: row.reason,
      date: row.date,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Find all compensations with optional filters
  static async findAll(filters: {
    employeeId?: string;
    institutionId?: string;
    branchId?: string;
    type?: 'deduction' | 'reward';
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Compensation[]> {
    let query = `
      SELECT 
        c.*,
        e.name as employee_name,
        e.photo_url as employee_photo_url
      FROM compensations c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE 1=1
    `;
    const values: any[] = [];

    if (filters.employeeId) {
      query += ' AND c.employee_id = ?';
      values.push(filters.employeeId);
    }

    if (filters.institutionId) {
      query += ' AND e.institution_id = ?';
      values.push(filters.institutionId);
    }

    if (filters.branchId) {
      query += ' AND e.branch_id = ?';
      values.push(filters.branchId);
    }

    if (filters.type) {
      query += ' AND c.type = ?';
      values.push(filters.type);
    }

    if (filters.startDate) {
      query += ' AND c.date >= ?';
      values.push(formatDateForMySQL(filters.startDate));
    }

    if (filters.endDate) {
      query += ' AND c.date <= ?';
      values.push(formatDateForMySQL(filters.endDate));
    }

    query += ' ORDER BY c.date DESC, c.created_at DESC';

    const results = await executeQuery(query, values);
    return results.map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      employeePhotoUrl: row.employee_photo_url,
      type: row.type,
      amount: parseFloat(row.amount),
      reason: row.reason,
      date: row.date,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  // Update compensation
  static async update(id: string, data: Partial<Omit<Compensation, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.employeeId !== undefined) {
      updates.push('employee_id = ?');
      values.push(data.employeeId);
    }

    if (data.type !== undefined) {
      updates.push('type = ?');
      values.push(data.type);
    }

    if (data.amount !== undefined) {
      updates.push('amount = ?');
      values.push(data.amount);
    }

    if (data.reason !== undefined) {
      updates.push('reason = ?');
      values.push(data.reason);
    }

    if (data.date !== undefined) {
      updates.push('date = ?');
      values.push(formatDateForMySQL(data.date));
    }

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE compensations SET ${updates.join(', ')} WHERE id = ?`;
    const result = await executeQuery(query, values);
    return result.affectedRows > 0;
  }

  // Delete compensation
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM compensations WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Get compensation statistics
  static async getStats(filters: {
    institutionId?: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    totalRewards: number;
    totalDeductions: number;
    rewardCount: number;
    deductionCount: number;
    netAmount: number;
  }> {
    let query = `
      SELECT 
        SUM(CASE WHEN type = 'reward' THEN amount ELSE 0 END) as total_rewards,
        SUM(CASE WHEN type = 'deduction' THEN amount ELSE 0 END) as total_deductions,
        COUNT(CASE WHEN type = 'reward' THEN 1 END) as reward_count,
        COUNT(CASE WHEN type = 'deduction' THEN 1 END) as deduction_count
      FROM compensations c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE 1=1
    `;
    const values: any[] = [];

    if (filters.institutionId) {
      query += ' AND e.institution_id = ?';
      values.push(filters.institutionId);
    }

    if (filters.branchId) {
      query += ' AND e.branch_id = ?';
      values.push(filters.branchId);
    }

    if (filters.startDate) {
      query += ' AND c.date >= ?';
      values.push(formatDateForMySQL(filters.startDate));
    }

    if (filters.endDate) {
      query += ' AND c.date <= ?';
      values.push(formatDateForMySQL(filters.endDate));
    }

    const results = await executeQuery(query, values);
    const row = results[0] || {};

    const totalRewards = parseFloat(row.total_rewards || 0);
    const totalDeductions = parseFloat(row.total_deductions || 0);

    return {
      totalRewards,
      totalDeductions,
      rewardCount: parseInt(row.reward_count || 0),
      deductionCount: parseInt(row.deduction_count || 0),
      netAmount: totalRewards - totalDeductions
    };
  }

  // Get monthly compensation summary
  static async getMonthlySummary(year: number, filters: {
    institutionId?: string;
    branchId?: string;
  } = {}): Promise<Array<{
    month: string;
    totalRewards: number;
    totalDeductions: number;
    netAmount: number;
  }>> {
    let query = `
      SELECT 
        DATE_FORMAT(c.date, '%Y-%m') as month,
        SUM(CASE WHEN type = 'reward' THEN amount ELSE 0 END) as total_rewards,
        SUM(CASE WHEN type = 'deduction' THEN amount ELSE 0 END) as total_deductions
      FROM compensations c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE YEAR(c.date) = ?
    `;
    const values: any[] = [year];

    if (filters.institutionId) {
      query += ' AND e.institution_id = ?';
      values.push(filters.institutionId);
    }

    if (filters.branchId) {
      query += ' AND e.branch_id = ?';
      values.push(filters.branchId);
    }

    query += ' GROUP BY DATE_FORMAT(c.date, \'%Y-%m\') ORDER BY month';

    const results = await executeQuery(query, values);
    return results.map((row: any) => {
      const totalRewards = parseFloat(row.total_rewards || 0);
      const totalDeductions = parseFloat(row.total_deductions || 0);
      return {
        month: row.month,
        totalRewards,
        totalDeductions,
        netAmount: totalRewards - totalDeductions
      };
    });
  }
}
