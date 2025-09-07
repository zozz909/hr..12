import { executeQuery } from '@/lib/db';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeePhotoUrl?: string;
  leaveType: 'annual' | 'sick' | 'unpaid' | 'emergency';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  approvedBy?: string | null;
  approvedDate?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Generate unique ID with prefix
function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomStr}`;
}

// Format date for MySQL
function formatDateForMySQL(date: string | null): string | null {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
}

export class LeaveRequestModel {
  // Create new leave request
  static async create(data: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveRequest> {
    const id = generateId('leave');
    const query = `
      INSERT INTO leave_requests (
        id, employee_id, leave_type, start_date, end_date, reason, status,
        request_date, approved_by, approved_date, rejection_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      data.employeeId,
      data.leaveType,
      formatDateForMySQL(data.startDate),
      formatDateForMySQL(data.endDate),
      data.reason,
      data.status || 'pending',
      formatDateForMySQL(data.requestDate) || new Date().toISOString().split('T')[0],
      data.approvedBy || null,
      formatDateForMySQL(data.approvedDate || null),
      data.rejectionReason || null
    ];

    await executeQuery(query, values);
    return await this.findById(id) as LeaveRequest;
  }

  // Find leave request by ID
  static async findById(id: string): Promise<LeaveRequest | null> {
    const query = `
      SELECT
        lr.id, lr.employee_id as employeeId, lr.leave_type as leaveType,
        lr.start_date as startDate, lr.end_date as endDate, lr.reason, lr.status,
        lr.request_date as requestDate, lr.approved_by as approvedBy,
        lr.approved_date as approvedDate, lr.rejection_reason as rejectionReason,
        lr.created_at as createdAt, lr.updated_at as updatedAt,
        e.name as employeeName, e.photo_url as employeePhotoUrl
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      WHERE lr.id = ?
    `;

    const results = await executeQuery(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  // Find all leave requests with filters
  static async findAll(filters?: {
    employeeId?: string;
    institutionId?: string;
    branchId?: string;
    status?: 'pending' | 'approved' | 'rejected';
    leaveType?: 'annual' | 'sick' | 'unpaid' | 'emergency';
    startDate?: string;
    endDate?: string;
  }): Promise<LeaveRequest[]> {
    let query = `
      SELECT
        lr.id, lr.employee_id as employeeId, lr.leave_type as leaveType,
        lr.start_date as startDate, lr.end_date as endDate, lr.reason, lr.status,
        lr.request_date as requestDate, lr.approved_by as approvedBy,
        lr.approved_date as approvedDate, lr.rejection_reason as rejectionReason,
        lr.created_at as createdAt, lr.updated_at as updatedAt,
        e.name as employeeName, e.photo_url as employeePhotoUrl,
        i.name as institutionName, b.name as branchName
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN institutions i ON e.institution_id = i.id
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE 1=1
    `;

    const values: any[] = [];

    if (filters?.employeeId) {
      query += ' AND lr.employee_id = ?';
      values.push(filters.employeeId);
    }

    if (filters?.institutionId) {
      query += ' AND e.institution_id = ?';
      values.push(filters.institutionId);
    }

    if (filters?.branchId) {
      query += ' AND e.branch_id = ?';
      values.push(filters.branchId);
    }

    if (filters?.status) {
      query += ' AND lr.status = ?';
      values.push(filters.status);
    }

    if (filters?.leaveType) {
      query += ' AND lr.leave_type = ?';
      values.push(filters.leaveType);
    }

    if (filters?.startDate) {
      query += ' AND lr.start_date >= ?';
      values.push(formatDateForMySQL(filters.startDate));
    }

    if (filters?.endDate) {
      query += ' AND lr.end_date <= ?';
      values.push(formatDateForMySQL(filters.endDate));
    }

    query += ' ORDER BY lr.created_at DESC';

    return await executeQuery(query, values);
  }

  // Update leave request
  static async update(id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest | null> {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.leaveType !== undefined) {
      updateFields.push('leave_type = ?');
      values.push(data.leaveType);
    }

    if (data.startDate !== undefined) {
      updateFields.push('start_date = ?');
      values.push(formatDateForMySQL(data.startDate));
    }

    if (data.endDate !== undefined) {
      updateFields.push('end_date = ?');
      values.push(formatDateForMySQL(data.endDate));
    }

    if (data.reason !== undefined) {
      updateFields.push('reason = ?');
      values.push(data.reason);
    }

    if (data.status !== undefined) {
      updateFields.push('status = ?');
      values.push(data.status);
    }

    if (data.approvedBy !== undefined) {
      updateFields.push('approved_by = ?');
      values.push(data.approvedBy);
    }

    if (data.approvedDate !== undefined) {
      updateFields.push('approved_date = ?');
      values.push(formatDateForMySQL(data.approvedDate));
    }

    if (data.rejectionReason !== undefined) {
      updateFields.push('rejection_reason = ?');
      values.push(data.rejectionReason);
    }

    if (updateFields.length === 0) {
      return await this.findById(id);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE leave_requests SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(query, values);

    return await this.findById(id);
  }

  // Approve leave request
  static async approve(id: string, approvedBy: string): Promise<boolean> {
    const query = `
      UPDATE leave_requests 
      SET status = 'approved', approved_by = ?, approved_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = await executeQuery(query, [approvedBy, id]);
    return result.affectedRows > 0;
  }

  // Reject leave request
  static async reject(id: string, rejectionReason: string): Promise<boolean> {
    const query = `
      UPDATE leave_requests 
      SET status = 'rejected', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = await executeQuery(query, [rejectionReason, id]);
    return result.affectedRows > 0;
  }

  // Delete leave request
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM leave_requests WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Get leave statistics for an employee
  static async getEmployeeLeaveStats(employeeId: string, year?: number): Promise<any> {
    const currentYear = year || new Date().getFullYear();
    const query = `
      SELECT 
        leave_type as leaveType,
        COUNT(*) as requestCount,
        SUM(DATEDIFF(end_date, start_date) + 1) as totalDays
      FROM leave_requests 
      WHERE employee_id = ? 
        AND status = 'approved'
        AND YEAR(start_date) = ?
      GROUP BY leave_type
    `;

    return await executeQuery(query, [employeeId, currentYear]);
  }

  // Get pending leave requests count
  static async getPendingCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM leave_requests WHERE status = "pending"';
    const results = await executeQuery(query);
    return results[0]?.count || 0;
  }
}
