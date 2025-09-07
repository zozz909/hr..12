import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { SimplePermissionChecker, SimpleUser, AVAILABLE_PERMISSIONS } from './permissions/simple-system';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export interface AuthUser {
  userId: string;
  role: 'admin' | 'employee';
  permissions: string[];
}

/**
 * التحقق من صحة التوكن واستخراج بيانات المستخدم
 */
export async function verifyAuthToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    return {
      userId: decoded.userId,
      role: decoded.role,
      permissions: decoded.permissions || []
    };
  } catch (error) {
    return null;
  }
}

/**
 * التحقق من وجود صلاحية محددة للمستخدم (مبسط وآمن)
 */
export function hasPermission(user: AuthUser, requiredPermission: string): boolean {
  return SimplePermissionChecker.hasPermission(user as SimpleUser, requiredPermission);
}

/**
 * التحقق من وجود أي من الصلاحيات المطلوبة
 */
export function hasAnyPermission(user: AuthUser, requiredPermissions: string[]): boolean {
  return SimplePermissionChecker.hasAnyPermission(user as SimpleUser, requiredPermissions);
}

/**
 * التحقق من وجود جميع الصلاحيات المطلوبة
 */
export function hasAllPermissions(user: AuthUser, requiredPermissions: string[]): boolean {
  return SimplePermissionChecker.hasAllPermissions(user as SimpleUser, requiredPermissions);
}

/**
 * التحقق من المصادقة والصلاحية معاً
 */
export async function requirePermission(
  request: NextRequest, 
  requiredPermission: string
): Promise<{ user: AuthUser | null; hasPermission: boolean }> {
  const user = await verifyAuthToken(request);
  
  if (!user) {
    return { user: null, hasPermission: false };
  }

  const permission = hasPermission(user, requiredPermission);
  return { user, hasPermission: permission };
}

/**
 * التحقق من المصادقة والصلاحيات المتعددة معاً
 */
export async function requireAnyPermission(
  request: NextRequest, 
  requiredPermissions: string[]
): Promise<{ user: AuthUser | null; hasPermission: boolean }> {
  const user = await verifyAuthToken(request);
  
  if (!user) {
    return { user: null, hasPermission: false };
  }

  const permission = hasAnyPermission(user, requiredPermissions);
  return { user, hasPermission: permission };
}

/**
 * إرجاع استجابة خطأ عدم وجود صلاحية
 */
export function unauthorizedResponse(message: string = 'ليس لديك صلاحية لتنفيذ هذا الإجراء') {
  return Response.json(
    { success: false, error: message },
    { status: 403 }
  );
}

/**
 * إرجاع استجابة خطأ عدم المصادقة
 */
export function unauthenticatedResponse(message: string = 'غير مصرح لك بالوصول') {
  return Response.json(
    { success: false, error: message },
    { status: 401 }
  );
}

/**
 * التحقق الصارم من الصلاحية - لا استثناءات
 */
export async function requireStrictPermission(
  request: NextRequest,
  requiredPermission: string
): Promise<{ user: AuthUser | null; hasPermission: boolean }> {
  const user = await verifyAuthToken(request);

  if (!user) {
    return { user: null, hasPermission: false };
  }

  // حتى المدير يجب أن يكون لديه الصلاحية صراحة للعمليات الحساسة
  const permission = AVAILABLE_PERMISSIONS.find(p => p.id === requiredPermission);
  if (permission?.isHigh && user.role === 'admin') {
    // للعمليات عالية الخطورة، حتى المدير يحتاج الصلاحية صراحة
    return {
      user,
      hasPermission: user.permissions.includes(requiredPermission)
    };
  }

  const hasPermission = SimplePermissionChecker.hasPermission(user as SimpleUser, requiredPermission);
  return { user, hasPermission };
}
