import { executeQuery, formatDateForMySQL } from '../db';
import { generateId } from '../utils';

export interface AdminForm {
  id: string;
  title: string;
  description?: string;
  category: 'hr' | 'finance' | 'general';
  iconName?: string; // Icon name for display
  iconColor?: string; // Icon color
  filePath?: string; // Path to uploaded form file
  fileUrl?: string; // URL to access the file
  fileName?: string; // Original file name
  fileSize?: number; // File size in bytes
  mimeType?: string; // File MIME type
  downloadCount?: number; // Number of downloads
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormFilters {
  category?: 'hr' | 'finance' | 'general';
  isActive?: boolean;
  search?: string;
}

export class FormModel {
  // Get all forms with optional filtering
  static async findAll(filters: FormFilters = {}): Promise<AdminForm[]> {
    let query = `
      SELECT
        id, title, description, category, form_data as formData,
        is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM forms
      WHERE 1=1
    `;
    const values: any[] = [];

    if (filters.category) {
      query += ' AND category = ?';
      values.push(filters.category);
    }

    if (filters.isActive !== undefined) {
      query += ' AND is_active = ?';
      values.push(filters.isActive);
    }

    if (filters.search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      values.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY category, title';

    const results = await executeQuery(query, values);
    return results.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      iconName: 'FileText', // قيمة افتراضية
      iconColor: '#3b82f6', // قيمة افتراضية
      filePath: null, // غير موجود في الجدول
      fileUrl: null, // غير موجود في الجدول
      fileName: null, // غير موجود في الجدول
      fileSize: null, // غير موجود في الجدول
      mimeType: null, // غير موجود في الجدول
      downloadCount: 0, // غير موجود في الجدول
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  // Get form by ID
  static async findById(id: string): Promise<AdminForm | null> {
    const query = `
      SELECT
        id, title, description, category, form_data as formData,
        is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM forms
      WHERE id = ?
    `;

    const results = await executeQuery(query, [id]);
    if (results.length === 0) return null;

    const row = results[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      iconName: 'FileText', // قيمة افتراضية
      iconColor: '#3b82f6', // قيمة افتراضية
      filePath: undefined, // غير موجود في الجدول
      fileUrl: undefined, // غير موجود في الجدول
      fileName: undefined, // غير موجود في الجدول
      fileSize: undefined, // غير موجود في الجدول
      mimeType: undefined, // غير موجود في الجدول
      downloadCount: 0, // غير موجود في الجدول
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  // Create new form
  static async create(data: Omit<AdminForm, 'id' | 'downloadCount' | 'createdAt' | 'updatedAt'>): Promise<AdminForm> {
    const id = generateId('form');
    const query = `
      INSERT INTO forms (
        id, title, description, category, form_data, is_active
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      data.title,
      data.description || null,
      data.category,
      null, // form_data
      data.isActive
    ];

    await executeQuery(query, values);
    return await this.findById(id) as AdminForm;
  }

  // Update form
  static async update(id: string, data: Partial<Omit<AdminForm, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AdminForm | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }

    if (data.category !== undefined) {
      updates.push('category = ?');
      values.push(data.category);
    }

    // تم إزالة الحقول غير الموجودة في الجدول (iconName, iconColor, filePath, fileUrl, fileName, fileSize, mimeType)

    if (data.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(data.isActive);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE forms SET ${updates.join(', ')} WHERE id = ?`;
    await executeQuery(query, values);

    return await this.findById(id);
  }

  // Delete form
  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM forms WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // Increment download count
  static async incrementDownloadCount(id: string): Promise<void> {
    const query = `
      UPDATE forms 
      SET download_count = COALESCE(download_count, 0) + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await executeQuery(query, [id]);
  }

  // Get forms statistics
  static async getStats(): Promise<{
    totalForms: number;
    activeFormsCount: number;
    totalDownloads: number;
    categoryCounts: { [key: string]: number };
  }> {
    // Get basic stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_forms,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_forms,
        SUM(COALESCE(download_count, 0)) as total_downloads
      FROM forms
    `;
    const statsResults = await executeQuery(statsQuery);
    const stats = statsResults[0] || {};

    // Get category counts
    const categoryQuery = `
      SELECT category, COUNT(*) as count
      FROM forms
      WHERE is_active = 1
      GROUP BY category
    `;
    const categoryResults = await executeQuery(categoryQuery);
    const categoryCounts: { [key: string]: number } = {};
    
    categoryResults.forEach((row: any) => {
      categoryCounts[row.category] = row.count;
    });

    return {
      totalForms: parseInt(stats.total_forms || 0),
      activeFormsCount: parseInt(stats.active_forms || 0),
      totalDownloads: parseInt(stats.total_downloads || 0),
      categoryCounts
    };
  }
}
