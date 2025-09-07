import { db } from '../db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'hr_manager' | 'employee' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  phone?: string;
  avatar_url?: string;
  last_login?: Date;
  login_attempts: number;
  locked_until?: Date;
  password_changed_at?: Date;
  email_verified: boolean;
  email_verification_token?: string;
  reset_password_token?: string;
  reset_password_expires?: Date;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'hr_manager' | 'employee' | 'viewer';
  permissions?: string[];
  phone?: string;
  created_by?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'admin' | 'hr_manager' | 'employee' | 'viewer';
  status?: 'active' | 'inactive' | 'suspended';
  permissions?: string[];
  phone?: string;
  avatar_url?: string;
  updated_by?: string;
}

export class UserModel {
  // الحصول على جميع المستخدمين
  static async getAll(): Promise<User[]> {
    try {
      const results = await db.query(`
        SELECT 
          id, name, email, role, status, 
          JSON_UNQUOTE(JSON_EXTRACT(permissions, '$')) as permissions_json,
          phone, avatar_url, last_login, login_attempts, 
          locked_until, password_changed_at, email_verified,
          two_factor_enabled, created_at, updated_at, created_by, updated_by
        FROM users 
        ORDER BY created_at DESC
      `);

      return (results as any[]).map((row: any) => ({
        ...row,
        permissions: row.permissions_json ? JSON.parse(row.permissions_json) : [],
        email_verified: Boolean(row.email_verified),
        two_factor_enabled: Boolean(row.two_factor_enabled)
      }));
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      throw new Error('فشل في جلب المستخدمين');
    }
  }

  // الحصول على مستخدم بالمعرف
  static async getById(id: string): Promise<User | null> {
    try {
      const results = await db.query(`
        SELECT 
          id, name, email, role, status, 
          JSON_UNQUOTE(JSON_EXTRACT(permissions, '$')) as permissions_json,
          phone, avatar_url, last_login, login_attempts, 
          locked_until, password_changed_at, email_verified,
          two_factor_enabled, created_at, updated_at, created_by, updated_by
        FROM users 
        WHERE id = ?
      `, [id]);

      if ((results as any[]).length === 0) return null;

      const user = (results as any[])[0];
      return {
        ...user,
        permissions: user.permissions_json ? JSON.parse(user.permissions_json) : [],
        email_verified: Boolean(user.email_verified),
        two_factor_enabled: Boolean(user.two_factor_enabled)
      };
    } catch (error) {
      console.error('خطأ في جلب المستخدم:', error);
      throw new Error('فشل في جلب المستخدم');
    }
  }

  // الحصول على مستخدم بالبريد الإلكتروني (للمصادقة)
  static async getByEmail(email: string): Promise<User | null> {
    try {
      const results = await db.query(`
        SELECT 
          id, name, email, password, role, status, 
          JSON_UNQUOTE(JSON_EXTRACT(permissions, '$')) as permissions_json,
          phone, avatar_url, last_login, login_attempts, 
          locked_until, password_changed_at, email_verified,
          email_verification_token, reset_password_token, reset_password_expires,
          two_factor_enabled, two_factor_secret, created_at, updated_at, created_by, updated_by
        FROM users 
        WHERE email = ?
      `, [email]);

      if ((results as any[]).length === 0) return null;

      const user = (results as any[])[0];
      return {
        ...user,
        permissions: user.permissions_json ? JSON.parse(user.permissions_json) : [],
        email_verified: Boolean(user.email_verified),
        two_factor_enabled: Boolean(user.two_factor_enabled)
      };
    } catch (error) {
      console.error('خطأ في جلب المستخدم بالبريد الإلكتروني:', error);
      throw new Error('فشل في جلب المستخدم');
    }
  }

  // إنشاء مستخدم جديد
  static async create(userData: CreateUserData): Promise<User> {
    try {
      const id = uuidv4();
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // الحصول على الصلاحيات الافتراضية للدور
      const defaultPermissions = userData.permissions || this.getRolePermissions(userData.role);

      await db.query(`
        INSERT INTO users (
          id, name, email, password, role, status, permissions, 
          phone, email_verified, created_by
        ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, FALSE, ?)
      `, [
        id, userData.name, userData.email, hashedPassword, userData.role,
        JSON.stringify(defaultPermissions), userData.phone, userData.created_by
      ]);

      const newUser = await this.getById(id);
      if (!newUser) throw new Error('فشل في إنشاء المستخدم');
      
      return newUser;
    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
      throw new Error('فشل في إنشاء المستخدم');
    }
  }

  // تحديث مستخدم
  static async update(id: string, userData: UpdateUserData): Promise<User | null> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (userData.name) {
        updateFields.push('name = ?');
        updateValues.push(userData.name);
      }
      if (userData.email) {
        updateFields.push('email = ?');
        updateValues.push(userData.email);
      }
      if (userData.role) {
        updateFields.push('role = ?');
        updateValues.push(userData.role);
      }
      if (userData.status) {
        updateFields.push('status = ?');
        updateValues.push(userData.status);
      }
      if (userData.permissions) {
        updateFields.push('permissions = ?');
        updateValues.push(JSON.stringify(userData.permissions));
      }
      if (userData.phone) {
        updateFields.push('phone = ?');
        updateValues.push(userData.phone);
      }
      if (userData.avatar_url) {
        updateFields.push('avatar_url = ?');
        updateValues.push(userData.avatar_url);
      }
      if (userData.updated_by) {
        updateFields.push('updated_by = ?');
        updateValues.push(userData.updated_by);
      }

      if (updateFields.length === 0) {
        throw new Error('لا توجد بيانات للتحديث');
      }

      updateValues.push(id);

      await db.query(`
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, updateValues);

      return await this.getById(id);
    } catch (error) {
      console.error('خطأ في تحديث المستخدم:', error);
      throw new Error('فشل في تحديث المستخدم');
    }
  }

  // حذف مستخدم
  static async delete(id: string): Promise<boolean> {
    try {
      // التحقق من وجود المستخدم
      const user = await this.getById(id);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // التحقق من أن المستخدم ليس مدير النظام الوحيد
      if (user.role === 'admin') {
        const adminCount = await db.query(`
          SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND status = 'active'
        `);

        if ((adminCount as any[])[0].count <= 1) {
          throw new Error('لا يمكن حذف مدير النظام الوحيد');
        }
      }

      // تنفيذ عملية الحذف
      const result = await db.query('DELETE FROM users WHERE id = ?', [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
      throw error;
    }
  }

  // عد المستخدمين حسب الدور
  static async countByRole(role: string): Promise<number> {
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM users WHERE role = ? AND status = "active"', [role]);
      return (result as any[])[0]?.count || 0;
    } catch (error) {
      console.error('خطأ في عد المستخدمين:', error);
      return 0;
    }
  }

  // تحديث كلمة المرور
  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      const result = await db.query(`
        UPDATE users 
        SET password = ?, password_changed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [hashedPassword, id]);

      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('خطأ في تحديث كلمة المرور:', error);
      throw new Error('فشل في تحديث كلمة المرور');
    }
  }

  // تحديث محاولات تسجيل الدخول
  static async updateLoginAttempts(email: string, attempts: number, lockUntil?: Date): Promise<void> {
    try {
      await db.query(`
        UPDATE users 
        SET login_attempts = ?, locked_until = ?, updated_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `, [attempts, lockUntil, email]);
    } catch (error) {
      console.error('خطأ في تحديث محاولات تسجيل الدخول:', error);
      throw new Error('فشل في تحديث محاولات تسجيل الدخول');
    }
  }

  // تحديث آخر تسجيل دخول
  static async updateLastLogin(id: string): Promise<void> {
    try {
      await db.query(`
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP, login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);
    } catch (error) {
      console.error('خطأ في تحديث آخر تسجيل دخول:', error);
      throw new Error('فشل في تحديث آخر تسجيل دخول');
    }
  }

  // التحقق من كلمة المرور
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('خطأ في التحقق من كلمة المرور:', error);
      return false;
    }
  }

  // الحصول على الصلاحيات الافتراضية للدور (مبسط)
  static getRolePermissions(role: string): string[] {
    const rolePermissions = {
      admin: [], // المدير لديه جميع الصلاحيات تلقائياً
      employee: [
        // صلاحيات أساسية للموظف
        'employees_view',
        'institutions_view',
        'leaves_view',
        'leaves_request',
        'advances_view',
        'advances_request',
        'compensations_view',
        'reports_view'
      ]
    };

    return rolePermissions[role as keyof typeof rolePermissions] || [];
  }

  // البحث في المستخدمين
  static async search(query: string, role?: string, status?: string): Promise<User[]> {
    try {
      let sql = `
        SELECT 
          id, name, email, role, status, 
          JSON_UNQUOTE(JSON_EXTRACT(permissions, '$')) as permissions_json,
          phone, avatar_url, last_login, login_attempts, 
          locked_until, password_changed_at, email_verified,
          two_factor_enabled, created_at, updated_at, created_by, updated_by
        FROM users 
        WHERE (name LIKE ? OR email LIKE ?)
      `;
      
      const params = [`%${query}%`, `%${query}%`];

      if (role) {
        sql += ' AND role = ?';
        params.push(role);
      }

      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }

      sql += ' ORDER BY created_at DESC';

      const results = await db.query(sql, params);

      return (results as any[]).map((row: any) => ({
        ...row,
        permissions: row.permissions_json ? JSON.parse(row.permissions_json) : [],
        email_verified: Boolean(row.email_verified),
        two_factor_enabled: Boolean(row.two_factor_enabled)
      }));
    } catch (error) {
      console.error('خطأ في البحث عن المستخدمين:', error);
      throw new Error('فشل في البحث عن المستخدمين');
    }
  }

  // التحقق من وجود البريد الإلكتروني
  static async emailExists(email: string, excludeId?: string): Promise<boolean> {
    try {
      let sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
      const params = [email];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const results = await db.query(sql, params);
      return (results as any[])[0].count > 0;
    } catch (error) {
      console.error('خطأ في التحقق من البريد الإلكتروني:', error);
      return false;
    }
  }

  // إحصائيات المستخدمين
  static async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    byRole: Record<string, number>;
  }> {
    try {
      const [totalResult, statusResult, roleResult] = await Promise.all([
        db.query('SELECT COUNT(*) as count FROM users'),
        db.query(`
          SELECT status, COUNT(*) as count 
          FROM users 
          GROUP BY status
        `),
        db.query(`
          SELECT role, COUNT(*) as count 
          FROM users 
          GROUP BY role
        `)
      ]);

      const statusCounts = (statusResult as any[]).reduce((acc: any, row: any) => {
        acc[row.status] = row.count;
        return acc;
      }, {});

      const roleCounts = (roleResult as any[]).reduce((acc: any, row: any) => {
        acc[row.role] = row.count;
        return acc;
      }, {});

      return {
        total: (totalResult as any[])[0].count,
        active: statusCounts.active || 0,
        inactive: statusCounts.inactive || 0,
        suspended: statusCounts.suspended || 0,
        byRole: roleCounts
      };
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المستخدمين:', error);
      throw new Error('فشل في جلب إحصائيات المستخدمين');
    }
  }
}
