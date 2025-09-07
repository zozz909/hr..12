import { executeQuery, formatDateForMySQL, getDocumentStatus } from '../db';
import { generateId } from '../utils';

export interface Employee {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  fileNumber: string;
  nationality: string;
  position?: string;
  branchId?: string | null;
  branchName?: string;
  photoUrl?: string;
  iqamaNumber?: string;
  iqamaExpiry?: string;
  workPermitExpiry?: string;
  contractExpiry?: string;
  healthInsuranceExpiry?: string;
  healthCertExpiry?: string;
  institutionId?: string | null;
  institutionName?: string;
  salary?: number;
  status: 'active' | 'archived';
  unsponsoredReason?: 'transferred' | 'new' | 'temporary_hold' | null;
  lastStatusUpdate?: string;
  archiveReason?: 'resignation' | 'termination' | 'retirement' | 'transfer' | 'contract_end' | 'medical_leave' | 'disciplinary' | 'other' | null;
  archivedAt?: string;
  archiveDate?: string;
  hireDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: 'iqama' | 'passport' | 'contract' | 'health_certificate' | 'insurance' | 'work_permit' | 'other';
  fileName: string;
  filePath?: string;
  fileUrl?: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'expiring_soon';
  uploadDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class EmployeeModel {
  // Create a new employee
  static async create(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const id = generateId('emp');
    const query = `
      INSERT INTO employees (
        id, name, mobile, email, file_number, nationality, position, branch_id,
        photo_url, iqama_number, iqama_expiry, work_permit_expiry, contract_expiry,
        insurance_expiry, health_cert_expiry, institution_id, salary, status, unsponsored_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      data.name,
      data.mobile,
      data.email || null,
      data.fileNumber,
      data.nationality,
      data.position || null,
      data.branchId || null,
      data.photoUrl || null,
      data.iqamaNumber || null,
      formatDateForMySQL(data.iqamaExpiry || null),
      formatDateForMySQL(data.workPermitExpiry || null),
      formatDateForMySQL(data.contractExpiry || null),
      formatDateForMySQL(data.healthInsuranceExpiry || null),
      formatDateForMySQL(data.healthCertExpiry || null),
      data.institutionId || null,
      data.salary || 0,
      data.status || 'active',
      data.unsponsoredReason || null
    ];

    await executeQuery(query, values);
    return await this.findById(id) as Employee;
  }

  // Find employee by ID
  static async findById(id: string): Promise<Employee | null> {
    const query = `
      SELECT
        e.id, e.name, e.mobile, e.email, e.file_number as fileNumber, e.nationality, e.position,
        e.branch_id as branchId, e.photo_url as photoUrl, e.iqama_number as iqamaNumber,
        e.iqama_expiry as iqamaExpiry, e.work_permit_expiry as workPermitExpiry,
        e.contract_expiry as contractExpiry, e.insurance_expiry as healthInsuranceExpiry,
        e.health_cert_expiry as healthCertExpiry, e.institution_id as institutionId, e.salary, e.hire_date as hireDate, e.status,
        e.unsponsored_reason as unsponsoredReason, e.last_status_update as lastStatusUpdate,
        e.archive_reason as archiveReason, e.archived_at as archivedAt, e.archive_date as archiveDate,
        e.created_at as createdAt, e.updated_at as updatedAt,
        i.name as institutionName, b.name as branchName
      FROM employees e
      LEFT JOIN institutions i ON e.institution_id = i.id
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE e.id = ?
    `;

    const results = await executeQuery(query, [id]);
    if (results.length === 0) return null;

    return results[0];
  }

  // Find all active employees
  static async findAll(filters?: {
    institutionId?: string | null;
    branchId?: string | null;
    status?: 'active' | 'archived';
    search?: string;
  }): Promise<Employee[]> {
    let query = `
      SELECT
        e.id, e.name, e.mobile, e.email, e.file_number as fileNumber, e.nationality, e.position,
        e.branch_id as branchId, e.photo_url as photoUrl, e.iqama_number as iqamaNumber,
        e.iqama_expiry as iqamaExpiry, e.work_permit_expiry as workPermitExpiry,
        e.contract_expiry as contractExpiry, e.insurance_expiry as healthInsuranceExpiry,
        e.health_cert_expiry as healthCertExpiry, e.institution_id as institutionId, e.salary, e.hire_date as hireDate, e.status,
        e.unsponsored_reason as unsponsoredReason, e.last_status_update as lastStatusUpdate,
        e.archive_reason as archiveReason, e.archived_at as archivedAt, e.archive_date as archiveDate,
        e.created_at as createdAt, e.updated_at as updatedAt,
        i.name as institutionName, b.name as branchName
      FROM employees e
      LEFT JOIN institutions i ON e.institution_id = i.id
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE 1=1
    `;

    const values: any[] = [];

    if (filters?.institutionId !== undefined) {
      if (filters.institutionId === null) {
        query += ' AND e.institution_id IS NULL';
      } else {
        query += ' AND e.institution_id = ?';
        values.push(filters.institutionId);
      }
    }

    if (filters?.branchId !== undefined) {
      if (filters.branchId === null) {
        query += ' AND e.branch_id IS NULL';
      } else {
        query += ' AND e.branch_id = ?';
        values.push(filters.branchId);
      }
    }

    if (filters?.status) {
      query += ' AND e.status = ?';
      values.push(filters.status);
    } else {
      query += ' AND e.status = "active"';
    }

    if (filters?.search) {
      query += ' AND (e.name LIKE ? OR e.iqama_number LIKE ? OR e.file_number LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY e.created_at DESC';

    return await executeQuery(query, values);
  }

  // Get employees by institution ID
  static async getByInstitutionId(institutionId: string): Promise<Employee[]> {
    const query = `
      SELECT
        e.id, e.name, e.mobile, e.email, e.file_number as fileNumber, e.nationality, e.position,
        e.branch_id as branchId, e.photo_url as photoUrl, e.iqama_number as iqamaNumber,
        e.iqama_expiry as iqamaExpiry, e.work_permit_expiry as workPermitExpiry,
        e.contract_expiry as contractExpiry, e.insurance_expiry as healthInsuranceExpiry,
        e.health_cert_expiry as healthCertExpiry, e.institution_id as institutionId, e.salary, e.hire_date as hireDate, e.status,
        e.unsponsored_reason as unsponsoredReason, e.archive_reason as archiveReason,
        e.archived_at as archivedAt, e.archive_date as archiveDate,
        e.created_at as createdAt, e.updated_at as updatedAt,
        i.name as institutionName, b.name as branchName
      FROM employees e
      LEFT JOIN institutions i ON e.institution_id = i.id
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE e.institution_id = ? AND e.status = 'active'
      ORDER BY e.name ASC
    `;

    const results = await executeQuery(query, [institutionId]);
    return results as Employee[];
  }

  // Find unsponsored employees (not linked to any institution)
  static async findUnsponsored(): Promise<Employee[]> {
    const query = `
      SELECT
        e.id, e.name, e.mobile, e.email, e.file_number as fileNumber, e.nationality, e.position,
        e.branch_id as branchId, e.photo_url as photoUrl, e.iqama_number as iqamaNumber,
        e.iqama_expiry as iqamaExpiry, e.work_permit_expiry as workPermitExpiry,
        e.contract_expiry as contractExpiry, e.insurance_expiry as healthInsuranceExpiry,
        e.institution_id as institutionId, e.salary, e.hire_date as hireDate, e.status,
        e.unsponsored_reason as unsponsoredReason, e.last_status_update as lastStatusUpdate,
        e.archive_reason as archiveReason, e.archived_at as archivedAt, e.archive_date as archiveDate,
        e.created_at as createdAt, e.updated_at as updatedAt,
        b.name as branchName
      FROM employees e
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE e.institution_id IS NULL AND e.status = 'active'
      ORDER BY e.created_at DESC
    `;

    return await executeQuery(query);
  }

  // Update employee
  static async update(id: string, data: Partial<Employee>): Promise<Employee | null> {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      values.push(data.name);
    }
    if (data.photoUrl !== undefined) {
      updateFields.push('photo_url = ?');
      values.push(data.photoUrl);
    }
    if (data.mobile !== undefined) {
      updateFields.push('mobile = ?');
      values.push(data.mobile);
    }
    if (data.email !== undefined) {
      updateFields.push('email = ?');
      values.push(data.email);
    }
    if (data.nationality !== undefined) {
      updateFields.push('nationality = ?');
      values.push(data.nationality);
    }
    if (data.position !== undefined) {
      updateFields.push('position = ?');
      values.push(data.position);
    }
    if (data.iqamaNumber !== undefined) {
      updateFields.push('iqama_number = ?');
      values.push(data.iqamaNumber);
    }
    if (data.iqamaExpiry !== undefined) {
      updateFields.push('iqama_expiry = ?');
      values.push(formatDateForMySQL(data.iqamaExpiry));
    }
    if (data.workPermitExpiry !== undefined) {
      updateFields.push('work_permit_expiry = ?');
      values.push(formatDateForMySQL(data.workPermitExpiry));
    }
    if (data.healthInsuranceExpiry !== undefined) {
      updateFields.push('insurance_expiry = ?');
      values.push(formatDateForMySQL(data.healthInsuranceExpiry));
    }
    if (data.healthCertExpiry !== undefined) {
      updateFields.push('health_cert_expiry = ?');
      values.push(formatDateForMySQL(data.healthCertExpiry));
    }
    if (data.contractExpiry !== undefined) {
      updateFields.push('contract_expiry = ?');
      values.push(formatDateForMySQL(data.contractExpiry));
    }
    if (data.institutionId !== undefined) {
      updateFields.push('institution_id = ?');
      values.push(data.institutionId);
    }
    if (data.salary !== undefined) {
      updateFields.push('salary = ?');
      values.push(data.salary);
    }
    if (data.fileNumber !== undefined) {
      updateFields.push('file_number = ?');
      values.push(data.fileNumber);
    }
    if (data.status !== undefined) {
      updateFields.push('status = ?');
      values.push(data.status);

      // If reactivating (changing to active), clear archive data
      if (data.status === 'active') {
        updateFields.push('archive_reason = NULL');
        updateFields.push('archived_at = NULL');
        updateFields.push('archive_date = NULL');
      }
    }
    if (data.unsponsoredReason !== undefined) {
      updateFields.push('unsponsored_reason = ?');
      values.push(data.unsponsoredReason);
    }
    if (data.archiveReason !== undefined) {
      updateFields.push('archive_reason = ?');
      values.push(data.archiveReason);
    }
    if (data.archivedAt !== undefined) {
      updateFields.push('archived_at = ?');
      values.push(formatDateForMySQL(data.archivedAt));
    }
    if (data.archiveDate !== undefined) {
      updateFields.push('archive_date = ?');
      values.push(formatDateForMySQL(data.archiveDate));
    }
    if (data.hireDate !== undefined) {
      updateFields.push('hire_date = ?');
      values.push(formatDateForMySQL(data.hireDate));
    }

    if (updateFields.length === 0) {
      return await this.findById(id);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE employees SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(query, values);

    return await this.findById(id);
  }

  // Archive employee (soft delete)
  static async archive(id: string, reason: 'resignation' | 'termination' | 'retirement' | 'transfer' | 'contract_end' | 'medical_leave' | 'disciplinary' | 'other' | 'terminated' | 'final_exit'): Promise<boolean> {
    const query = `
      UPDATE employees
      SET status = 'archived',
          archive_reason = ?,
          archive_date = CURDATE(),
          archived_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = await executeQuery(query, [reason, id]);
    return result.affectedRows > 0;
  }

  // Delete employee permanently (hard delete)
  static async delete(id: string): Promise<boolean> {
    // First, delete related documents
    await executeQuery('DELETE FROM employee_documents WHERE employee_id = ?', [id]);

    // Then delete the employee
    const query = 'DELETE FROM employees WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Transfer employee to another institution
  static async transfer(employeeId: string, newInstitutionId: string | null, reason?: string): Promise<boolean> {
    const query = `
      UPDATE employees
      SET institution_id = ?, unsponsored_reason = ?, last_status_update = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = await executeQuery(query, [newInstitutionId, reason || null, employeeId]);
    return result.affectedRows > 0;
  }

  // Get employees with expiring documents
  static async getExpiringDocuments(days: number = 30): Promise<Employee[]> {
    const query = `
      SELECT DISTINCT
        e.id, e.name, e.mobile, e.email, e.file_number as fileNumber, e.nationality, e.position,
        e.branch_id as branchId, e.photo_url as photoUrl, e.iqama_number as iqamaNumber,
        e.iqama_expiry as iqamaExpiry, e.work_permit_expiry as workPermitExpiry,
        e.contract_expiry as contractExpiry, e.insurance_expiry as healthInsuranceExpiry,
        e.health_cert_expiry as healthCertExpiry, e.institution_id as institutionId, e.salary, e.hire_date as hireDate, e.status,
        i.name as institutionName, b.name as branchName
      FROM employees e
      LEFT JOIN institutions i ON e.institution_id = i.id
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE e.status = 'active'
      AND (
        (e.iqama_expiry IS NOT NULL AND e.iqama_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY))
        OR (e.work_permit_expiry IS NOT NULL AND e.work_permit_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY))
        OR (e.contract_expiry IS NOT NULL AND e.contract_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY))
        OR (e.insurance_expiry IS NOT NULL AND e.insurance_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY))
        OR (e.health_cert_expiry IS NOT NULL AND e.health_cert_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY))
      )
      ORDER BY
        CASE
          WHEN e.iqama_expiry IS NOT NULL AND e.iqama_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY) THEN e.iqama_expiry
          WHEN e.work_permit_expiry IS NOT NULL AND e.work_permit_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY) THEN e.work_permit_expiry
          WHEN e.contract_expiry IS NOT NULL AND e.contract_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY) THEN e.contract_expiry
          WHEN e.insurance_expiry IS NOT NULL AND e.insurance_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY) THEN e.insurance_expiry
          WHEN e.health_cert_expiry IS NOT NULL AND e.health_cert_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY) THEN e.health_cert_expiry
        END ASC
    `;

    return await executeQuery(query, [days, days, days, days, days, days, days, days, days, days]);
  }

  // Add document to employee
  static async addDocument(employeeId: string, document: Omit<EmployeeDocument, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>): Promise<EmployeeDocument> {
    const id = generateId('edoc');
    const status = document.expiryDate ? getDocumentStatus(document.expiryDate) : 'active';

    const query = `
      INSERT INTO employee_documents (
        id, employee_id, document_type, file_name, file_path, file_url, expiry_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      employeeId,
      document.documentType,
      document.fileName,
      document.filePath || null,
      document.fileUrl || null,
      formatDateForMySQL(document.expiryDate || null),
      status
    ];

    await executeQuery(query, values);

    const docQuery = `
      SELECT
        id, employee_id as employeeId, document_type as documentType, file_name as fileName,
        file_path as filePath, file_url as fileUrl, expiry_date as expiryDate, status,
        upload_date as uploadDate, created_at as createdAt, updated_at as updatedAt
      FROM employee_documents
      WHERE id = ?
    `;

    const result = await executeQuery(docQuery, [id]);
    return result[0];
  }

  // Get employee documents
  static async getDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    const query = `
      SELECT
        id, employee_id as employeeId, document_type as documentType, file_name as fileName,
        file_path as filePath, file_url as fileUrl, expiry_date as expiryDate, status,
        upload_date as uploadDate, created_at as createdAt, updated_at as updatedAt
      FROM employee_documents
      WHERE employee_id = ?
      ORDER BY created_at DESC
    `;

    return await executeQuery(query, [employeeId]);
  }
}