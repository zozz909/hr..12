import { executeQuery, generateId, formatDateForMySQL } from '../db';

export interface Institution {
  id: string;
  name: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  crNumber: string;
  crIssueDate?: string;
  crExpiryDate: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
  employeeCount?: number;
  documents?: InstitutionDocument[];
  subscriptions?: Subscription[];
}

export interface InstitutionDocument {
  id: string;
  institutionId: string;
  name: string;
  filePath?: string;
  fileUrl?: string;
  documentType: 'license' | 'commercial_record' | 'tax_certificate' | 'other';
  uploadDate?: string;
  createdAt?: string;
}

export interface Subscription {
  id: string;
  institutionId: string;
  name: string;
  icon?: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'expiring_soon';
  createdAt?: string;
  updatedAt?: string;
}

export class InstitutionModel {
  // Create a new institution
  static async create(data: Omit<Institution, 'id' | 'createdAt' | 'updatedAt'>): Promise<Institution> {
    const id = generateId('inst');
    const query = `
      INSERT INTO institutions (
        id, name, license_number, license_expiry, cr_number,
        cr_issue_date, cr_expiry_date, address, phone, email, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      data.name,
      data.licenseNumber || null,
      formatDateForMySQL(data.licenseExpiry || null),
      data.crNumber,
      formatDateForMySQL(data.crIssueDate || null),
      formatDateForMySQL(data.crExpiryDate),
      data.address || null,
      data.phone || null,
      data.email || null,
      data.status || 'active'
    ];

    await executeQuery(query, values);
    return await this.findById(id) as Institution;
  }

  // Find institution by ID
  static async findById(id: string): Promise<Institution | null> {
    const query = `
      SELECT
        id, name, license_number as licenseNumber, license_expiry as licenseExpiry,
        cr_number as crNumber, cr_issue_date as crIssueDate, cr_expiry_date as crExpiryDate,
        address, phone, email, status, created_at as createdAt, updated_at as updatedAt
      FROM institutions
      WHERE id = ?
    `;

    const results = await executeQuery(query, [id]);
    if (results.length === 0) return null;

    const institution = results[0];

    // Get employee count
    const countQuery = 'SELECT COUNT(*) as count FROM employees WHERE institution_id = ? AND status = "active"';
    const countResult = await executeQuery(countQuery, [id]);
    institution.employeeCount = countResult[0].count;

    return institution;
  }

  // Find all institutions
  static async findAll(): Promise<Institution[]> {
    const query = `
      SELECT
        i.id, i.name, i.license_number as licenseNumber, i.license_expiry as licenseExpiry,
        i.cr_number as crNumber, i.cr_issue_date as crIssueDate, i.cr_expiry_date as crExpiryDate,
        i.address, i.phone, i.email, i.status, i.created_at as createdAt, i.updated_at as updatedAt,
        COUNT(e.id) as employeeCount
      FROM institutions i
      LEFT JOIN employees e ON i.id = e.institution_id AND e.status = 'active'
      WHERE i.status != 'inactive'
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `;

    const results = await executeQuery(query);
    return results;
  }

  // Update institution
  static async update(id: string, data: Partial<Institution>): Promise<Institution | null> {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      values.push(data.name);
    }
    if (data.licenseNumber !== undefined) {
      updateFields.push('license_number = ?');
      values.push(data.licenseNumber);
    }
    if (data.licenseExpiry !== undefined) {
      updateFields.push('license_expiry = ?');
      values.push(formatDateForMySQL(data.licenseExpiry));
    }
    if (data.crNumber !== undefined) {
      updateFields.push('cr_number = ?');
      values.push(data.crNumber);
    }
    if (data.crExpiryDate !== undefined) {
      updateFields.push('cr_expiry_date = ?');
      values.push(formatDateForMySQL(data.crExpiryDate));
    }
    if (data.address !== undefined) {
      updateFields.push('address = ?');
      values.push(data.address);
    }
    if (data.phone !== undefined) {
      updateFields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      updateFields.push('email = ?');
      values.push(data.email);
    }
    if (data.status !== undefined) {
      updateFields.push('status = ?');
      values.push(data.status);
    }

    if (updateFields.length === 0) {
      return await this.findById(id);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE institutions SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(query, values);

    return await this.findById(id);
  }

  // Delete institution (hard delete - permanently remove from database)
  static async delete(id: string): Promise<boolean> {
    // First, delete related employees (or update their institution_id to null)
    const updateEmployeesQuery = 'UPDATE employees SET institution_id = NULL WHERE institution_id = ?';
    await executeQuery(updateEmployeesQuery, [id]);

    // Then delete the institution permanently
    const query = 'DELETE FROM institutions WHERE id = ?';
    const result = await executeQuery(query, [id]);

    return result.affectedRows > 0;
  }

  // Get institutions with expiring licenses
  static async getExpiringLicenses(days: number = 30): Promise<Institution[]> {
    const query = `
      SELECT
        id, name, license_number as licenseNumber, license_expiry as licenseExpiry,
        cr_number as crNumber, cr_expiry_date as crExpiryDate,
        status, created_at as createdAt, updated_at as updatedAt
      FROM institutions
      WHERE status = 'active'
      AND (
        (license_expiry IS NOT NULL AND license_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY))
        OR cr_expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      )
      ORDER BY
        CASE
          WHEN license_expiry IS NOT NULL THEN license_expiry
          ELSE cr_expiry_date
        END ASC
    `;

    return await executeQuery(query, [days, days]);
  }

  // Add document to institution
  static async addDocument(institutionId: string, document: Omit<InstitutionDocument, 'id' | 'institutionId' | 'createdAt'>): Promise<InstitutionDocument> {
    const id = generateId('doc');
    const query = `
      INSERT INTO institution_documents (
        id, institution_id, name, file_path, file_url, document_type
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      institutionId,
      document.name,
      document.filePath || null,
      document.fileUrl || null,
      document.documentType
    ];

    await executeQuery(query, values);

    const docQuery = `
      SELECT
        id, institution_id as institutionId, name, file_path as filePath,
        file_url as fileUrl, document_type as documentType,
        upload_date as uploadDate, created_at as createdAt
      FROM institution_documents
      WHERE id = ?
    `;

    const result = await executeQuery(docQuery, [id]);
    return result[0];
  }

  // Get institution documents
  static async getDocuments(institutionId: string): Promise<InstitutionDocument[]> {
    const query = `
      SELECT
        id, institution_id as institutionId, name, file_path as filePath,
        file_url as fileUrl, document_type as documentType,
        upload_date as uploadDate, created_at as createdAt
      FROM institution_documents
      WHERE institution_id = ?
      ORDER BY created_at DESC
    `;

    return await executeQuery(query, [institutionId]);
  }

  // Add subscription to institution
  static async addSubscription(institutionId: string, subscription: Omit<Subscription, 'id' | 'institutionId' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const id = generateId('sub');
    const query = `
      INSERT INTO subscriptions (
        id, institution_id, name, icon, expiry_date, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      institutionId,
      subscription.name,
      subscription.icon || null,
      formatDateForMySQL(subscription.expiryDate),
      subscription.status || 'active'
    ];

    await executeQuery(query, values);

    const subQuery = `
      SELECT
        id, institution_id as institutionId, name, icon,
        expiry_date as expiryDate, status,
        created_at as createdAt, updated_at as updatedAt
      FROM subscriptions
      WHERE id = ?
    `;

    const result = await executeQuery(subQuery, [id]);
    return result[0];
  }

  // Get institution subscriptions
  static async getSubscriptions(institutionId: string): Promise<Subscription[]> {
    const query = `
      SELECT
        id, institution_id as institutionId, name, icon,
        expiry_date as expiryDate, status,
        created_at as createdAt, updated_at as updatedAt
      FROM subscriptions
      WHERE institution_id = ?
      ORDER BY expiry_date ASC
    `;

    return await executeQuery(query, [institutionId]);
  }
}