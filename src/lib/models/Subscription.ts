import { executeQuery, formatDateForMySQL, getDocumentStatus } from '../db';
import { generateId } from '../utils';

export interface Subscription {
  id: string;
  institutionId: string;
  name: string;
  icon: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'expiring_soon';
  createdAt?: string;
  updatedAt?: string;
}

export class SubscriptionModel {
  // Create a new subscription
  static async create(data: Omit<Subscription, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const id = generateId('sub');
    const status = data.expiryDate ? getDocumentStatus(data.expiryDate) : 'active';

    const query = `
      INSERT INTO subscriptions (
        id, institution_id, name, icon, expiry_date, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    await executeQuery(query, [
      id,
      data.institutionId,
      data.name,
      data.icon,
      data.expiryDate ? formatDateForMySQL(data.expiryDate) : null,
      status
    ]);

    return await this.findById(id) as Subscription;
  }

  // Find subscription by ID
  static async findById(id: string): Promise<Subscription | null> {
    const query = `
      SELECT 
        id, institution_id as institutionId, name, icon, expiry_date as expiryDate,
        status, created_at as createdAt, updated_at as updatedAt
      FROM subscriptions 
      WHERE id = ?
    `;

    const results = await executeQuery(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  // Get all subscriptions for an institution
  static async findByInstitutionId(institutionId: string): Promise<Subscription[]> {
    const query = `
      SELECT 
        id, institution_id as institutionId, name, icon, expiry_date as expiryDate,
        status, created_at as createdAt, updated_at as updatedAt
      FROM subscriptions 
      WHERE institution_id = ?
      ORDER BY created_at DESC
    `;

    return await executeQuery(query, [institutionId]);
  }

  // Update subscription
  static async update(id: string, data: Partial<Subscription>): Promise<Subscription | null> {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      values.push(data.name);
    }
    if (data.icon !== undefined) {
      updateFields.push('icon = ?');
      values.push(data.icon);
    }
    if (data.expiryDate !== undefined) {
      updateFields.push('expiry_date = ?');
      values.push(data.expiryDate ? formatDateForMySQL(data.expiryDate) : null);
      
      // Update status based on expiry date
      const status = data.expiryDate ? getDocumentStatus(data.expiryDate) : 'active';
      updateFields.push('status = ?');
      values.push(status);
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

    const query = `UPDATE subscriptions SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(query, values);

    return await this.findById(id);
  }

  // Delete subscription
  static async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM subscriptions WHERE id = ?`;
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Get expiring subscriptions
  static async getExpiring(days: number = 30): Promise<Subscription[]> {
    const query = `
      SELECT 
        s.id, s.institution_id as institutionId, s.name, s.icon, s.expiry_date as expiryDate,
        s.status, s.created_at as createdAt, s.updated_at as updatedAt,
        i.name as institutionName
      FROM subscriptions s
      LEFT JOIN institutions i ON s.institution_id = i.id
      WHERE s.expiry_date IS NOT NULL 
        AND s.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND s.expiry_date >= CURDATE()
      ORDER BY s.expiry_date ASC
    `;

    return await executeQuery(query, [days]);
  }
}
