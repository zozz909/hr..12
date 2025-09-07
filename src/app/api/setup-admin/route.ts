import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // التحقق من وجود المستخدم الإداري
    const existingUsers = await executeQuery(
      'SELECT id, email FROM users WHERE email = ? OR email = ?',
      ['admin@example.com', 'admin@company.com']
    );

    if (existingUsers.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'المستخدم الإداري موجود بالفعل',
        user: existingUsers[0]
      });
    }

    // إنشاء كلمة مرور مشفرة
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // إنشاء المستخدم الإداري
    await executeQuery(`
      INSERT INTO users (id, name, email, password, role, status, permissions, email_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      'admin-setup',
      'مدير النظام',
      'admin@example.com',
      hashedPassword,
      'admin',
      'active',
      JSON.stringify([
        'institutions_view', 'institutions_add', 'institutions_edit', 'institutions_delete',
        'employees_view', 'employees_add', 'employees_edit', 'employees_delete',
        'documents_view', 'documents_add', 'documents_edit', 'documents_delete',
        'users_view', 'users_add', 'users_edit', 'users_delete',
        'payroll_view', 'payroll_add', 'payroll_edit', 'payroll_delete',
        'reports_view', 'system_settings'
      ]),
      true
    ]);

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المستخدم الإداري بنجاح',
      credentials: {
        email: 'admin@example.com',
        password: 'admin123'
      }
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في إنشاء المستخدم الإداري',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // التحقق من وجود المستخدمين
    const users = await executeQuery('SELECT id, email, role, status FROM users LIMIT 10');
    
    return NextResponse.json({
      success: true,
      message: 'قائمة المستخدمين الموجودين',
      users: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في جلب المستخدمين',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
