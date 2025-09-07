import { executeQuery, formatDateForMySQL } from '../db';
import { generateId } from '../utils';

export interface Advance {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeePhotoUrl?: string;
  amount: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  installments: number;
  paidAmount: number;
  remainingAmount: number;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class AdvanceModel {
  // Create a new advance request
  static async create(data: Omit<Advance, 'id' | 'paidAmount' | 'remainingAmount' | 'createdAt' | 'updatedAt'>): Promise<Advance> {
    const id = generateId('adv');
    const query = `
      INSERT INTO advances (
        id, employee_id, amount, request_date, status, installments, 
        paid_amount, remaining_amount, approved_by, approved_date, rejection_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      data.employeeId,
      data.amount,
      data.requestDate ? formatDateForMySQL(data.requestDate) : null,
      data.status || 'pending',
      data.installments || 1,
      0, // paid_amount starts at 0
      data.amount, // remaining_amount starts as full amount
      data.approvedBy || null,
      data.approvedDate ? formatDateForMySQL(data.approvedDate) : null,
      data.rejectionReason || null
    ];

    await executeQuery(query, values);
    return await this.findById(id) as Advance;
  }

  // Find advance by ID with employee details
  static async findById(id: string): Promise<Advance | null> {
    const query = `
      SELECT 
        a.*,
        e.name as employee_name,
        e.photo_url as employee_photo_url
      FROM advances a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE a.id = ?
    `;

    const results = await executeQuery(query, [id]);
    if (results.length === 0) return null;

    const row = results[0];
    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      employeePhotoUrl: row.employee_photo_url,
      amount: parseFloat(row.amount),
      requestDate: row.request_date,
      status: row.status,
      installments: row.installments,
      paidAmount: parseFloat(row.paid_amount || 0),
      remainingAmount: parseFloat(row.remaining_amount || 0),
      approvedBy: row.approved_by,
      approvedDate: row.approved_date,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Find all advances with optional filters
  static async findAll(filters: {
    employeeId?: string;
    institutionId?: string;
    branchId?: string;
    status?: 'pending' | 'approved' | 'paid' | 'rejected';
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Advance[]> {
    let query = `
      SELECT 
        a.*,
        e.name as employee_name,
        e.photo_url as employee_photo_url
      FROM advances a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const values: any[] = [];

    if (filters.employeeId) {
      query += ' AND a.employee_id = ?';
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

    if (filters.status) {
      query += ' AND a.status = ?';
      values.push(filters.status);
    }

    if (filters.startDate) {
      query += ' AND DATE(a.request_date) >= ?';
      values.push(formatDateForMySQL(filters.startDate));
    }

    if (filters.endDate) {
      query += ' AND DATE(a.request_date) <= ?';
      values.push(formatDateForMySQL(filters.endDate));
    }

    query += ' ORDER BY a.request_date DESC, a.created_at DESC';

    const results = await executeQuery(query, values);
    return results.map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      employeePhotoUrl: row.employee_photo_url,
      amount: parseFloat(row.amount),
      requestDate: row.request_date,
      status: row.status,
      installments: row.installments,
      paidAmount: parseFloat(row.paid_amount || 0),
      remainingAmount: parseFloat(row.remaining_amount || 0),
      approvedBy: row.approved_by,
      approvedDate: row.approved_date,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  // Update advance
  static async update(id: string, data: Partial<Omit<Advance, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.employeeId !== undefined) {
      updates.push('employee_id = ?');
      values.push(data.employeeId);
    }

    if (data.amount !== undefined) {
      updates.push('amount = ?');
      values.push(data.amount);
      // Update remaining amount if total amount changes
      updates.push('remaining_amount = amount - paid_amount');
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }

    if (data.installments !== undefined) {
      updates.push('installments = ?');
      values.push(data.installments);
    }

    if (data.paidAmount !== undefined) {
      updates.push('paid_amount = ?');
      values.push(data.paidAmount);
      updates.push('remaining_amount = amount - ?');
      values.push(data.paidAmount);
    }

    if (data.approvedBy !== undefined) {
      updates.push('approved_by = ?');
      values.push(data.approvedBy);
    }

    if (data.approvedDate !== undefined) {
      updates.push('approved_date = ?');
      values.push(data.approvedDate ? formatDateForMySQL(data.approvedDate) : null);
    }

    if (data.rejectionReason !== undefined) {
      updates.push('rejection_reason = ?');
      values.push(data.rejectionReason);
    }

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE advances SET ${updates.join(', ')} WHERE id = ?`;
    const result = await executeQuery(query, values);
    return result.affectedRows > 0;
  }

  // Delete advance
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM advances WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Approve advance
  static async approve(id: string, approvedBy: string): Promise<boolean> {
    const query = `
      UPDATE advances 
      SET status = 'approved', 
          approved_by = ?, 
          approved_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = await executeQuery(query, [approvedBy, id]);
    return result.affectedRows > 0;
  }

  // Reject advance
  static async reject(id: string, reason: string): Promise<boolean> {
    const query = `
      UPDATE advances 
      SET status = 'rejected', 
          rejection_reason = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = await executeQuery(query, [reason, id]);
    return result.affectedRows > 0;
  }

  // Mark advance as paid
  static async markAsPaid(id: string): Promise<boolean> {
    const query = `
      UPDATE advances 
      SET status = 'paid',
          paid_amount = amount,
          remaining_amount = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Get advance statistics
  static async getStats(filters: {
    institutionId?: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    totalAdvances: number;
    totalPaid: number;
    totalRemaining: number;
    pendingCount: number;
    approvedCount: number;
    paidCount: number;
    rejectedCount: number;
  }> {
    let query = `
      SELECT
        SUM(a.amount) as total_advances,
        SUM(a.paid_amount) as total_paid,
        SUM(a.remaining_amount) as total_remaining,
        COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN a.status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected_count
      FROM advances a
      LEFT JOIN employees e ON a.employee_id = e.id
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
      query += ' AND DATE(a.request_date) >= ?';
      values.push(formatDateForMySQL(filters.startDate));
    }

    if (filters.endDate) {
      query += ' AND DATE(a.request_date) <= ?';
      values.push(formatDateForMySQL(filters.endDate));
    }

    const results = await executeQuery(query, values);
    const row = results[0] || {};

    return {
      totalAdvances: parseFloat(row.total_advances || 0),
      totalPaid: parseFloat(row.total_paid || 0),
      totalRemaining: parseFloat(row.total_remaining || 0),
      pendingCount: parseInt(row.pending_count || 0),
      approvedCount: parseInt(row.approved_count || 0),
      paidCount: parseInt(row.paid_count || 0),
      rejectedCount: parseInt(row.rejected_count || 0)
    };
  }
}
