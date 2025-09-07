import { executeQuery } from '@/lib/db';
import { Branch } from '@/types';

// Generate unique ID with prefix
function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomStr}`;
}

export class BranchModel {
  // Find all branches
  static async findAll(institutionId?: string): Promise<Branch[]> {
    let query = `
      SELECT
        b.id, b.institution_id as institutionId, b.name, b.code, b.address, b.phone, b.email,
        b.manager_id as managerId, b.status, b.created_at as createdAt, b.updated_at as updatedAt,
        e.name as managerName, i.name as institutionName,
        COUNT(emp.id) as employeeCount
      FROM branches b
      LEFT JOIN employees e ON b.manager_id = e.id
      LEFT JOIN institutions i ON b.institution_id = i.id
      LEFT JOIN employees emp ON b.id = emp.branch_id AND emp.status = 'active'
      WHERE b.status = 'active'
    `;

    const params: any[] = [];

    if (institutionId) {
      if (institutionId === 'independent') {
        query += ' AND b.institution_id IS NULL';
      } else {
        query += ' AND b.institution_id = ?';
        params.push(institutionId);
      }
    }

    query += ' GROUP BY b.id ORDER BY b.created_at DESC';

    const results = await executeQuery(query, params);
    return results;
  }

  // Find branch by ID
  static async findById(id: string): Promise<Branch | null> {
    const query = `
      SELECT
        b.id, b.institution_id as institutionId, b.name, b.code, b.address, b.phone, b.email,
        b.manager_id as managerId, b.status, b.created_at as createdAt, b.updated_at as updatedAt,
        e.name as managerName, i.name as institutionName,
        COUNT(emp.id) as employeeCount
      FROM branches b
      LEFT JOIN employees e ON b.manager_id = e.id
      LEFT JOIN institutions i ON b.institution_id = i.id
      LEFT JOIN employees emp ON b.id = emp.branch_id AND emp.status = 'active'
      WHERE b.id = ? AND b.status = 'active'
      GROUP BY b.id
    `;

    const results = await executeQuery(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  // Create new branch
  static async create(branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<Branch> {
    const id = generateId('branch');
    const query = `
      INSERT INTO branches (
        id, institution_id, name, code, address, phone, email, manager_id, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    await executeQuery(query, [
      id,
      branchData.institutionId || null, // Allow null for independent branches
      branchData.name,
      branchData.code,
      branchData.address || null,
      branchData.phone || null,
      branchData.email || null,
      branchData.managerId || null,
      branchData.status || 'active'
    ]);

    const newBranch = await this.findById(id);
    if (!newBranch) {
      throw new Error('Failed to create branch');
    }

    return newBranch;
  }

  // Update branch
  static async update(id: string, branchData: Partial<Branch>): Promise<Branch | null> {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (branchData.institutionId !== undefined) {
      updateFields.push('institution_id = ?');
      values.push(branchData.institutionId);
    }
    if (branchData.name !== undefined) {
      updateFields.push('name = ?');
      values.push(branchData.name);
    }
    if (branchData.code !== undefined) {
      updateFields.push('code = ?');
      values.push(branchData.code);
    }
    if (branchData.address !== undefined) {
      updateFields.push('address = ?');
      values.push(branchData.address);
    }
    if (branchData.phone !== undefined) {
      updateFields.push('phone = ?');
      values.push(branchData.phone);
    }
    if (branchData.email !== undefined) {
      updateFields.push('email = ?');
      values.push(branchData.email);
    }
    if (branchData.managerId !== undefined) {
      updateFields.push('manager_id = ?');
      values.push(branchData.managerId);
    }
    if (branchData.status !== undefined) {
      updateFields.push('status = ?');
      values.push(branchData.status);
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE branches SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(query, values);

    return this.findById(id);
  }

  // Delete branch (hard delete - permanently remove from database)
  static async delete(id: string): Promise<boolean> {
    // First, move all employees to no branch (null)
    const updateEmployeesQuery = 'UPDATE employees SET branch_id = NULL WHERE branch_id = ?';
    await executeQuery(updateEmployeesQuery, [id]);

    // Then delete the branch permanently from database
    const query = 'DELETE FROM branches WHERE id = ?';
    const result = await executeQuery(query, [id]);

    return result.affectedRows > 0;
  }

  // Get employees by branch
  static async getEmployees(branchId: string): Promise<any[]> {
    const query = `
      SELECT
        e.id, e.name, e.file_number as fileNumber, e.mobile, e.nationality, e.position,
        e.salary, e.iqama_expiry as iqamaExpiry, e.work_permit_expiry as workPermitExpiry,
        e.contract_expiry as contractExpiry, e.status, e.created_at as createdAt,
        i.name as institutionName
      FROM employees e
      LEFT JOIN institutions i ON e.institution_id = i.id
      WHERE e.branch_id = ? AND e.status = 'active'
      ORDER BY e.name ASC
    `;

    const results = await executeQuery(query, [branchId]);
    return results;
  }

  // Transfer employee to branch
  static async transferEmployee(employeeId: string, branchId: string | null): Promise<boolean> {
    const query = 'UPDATE employees SET branch_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await executeQuery(query, [branchId, employeeId]);

    return result.affectedRows > 0;
  }
}