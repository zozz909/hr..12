import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
// import { IPWhitelistManager } from '@/lib/security/ip-whitelist';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// المسارات التي لا تحتاج إلى مصادقة
const publicPaths = [
  '/',
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/favicon.ico',
  '/_next',
  '/static',
  '/api/test',
  '/api/setup-admin',
  '/api/institutions',
  '/api/employees',
  '/api/documents',
  '/api/institutions-public',
  '/api/employees-public',
  '/setup-admin.html'
];



// المسارات التي تحتاج إلى صلاحيات خاصة
const protectedPaths = {
  '/settings': ['manage_users', 'system_settings'],
  '/settings/roles': ['manage_users'],
  '/settings/audit': ['view_audit'],
  '/api/users': ['manage_users'],
  '/api/roles': ['manage_users'],
  '/api/security': ['system_settings']
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get client IP
  const clientIP = request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Check IP whitelist for protected routes (temporarily disabled for debugging)
  // if (!pathname.startsWith('/api/auth/') && !pathname.startsWith('/_next')) {
  //   try {
  //     const isAllowed = await IPWhitelistManager.isIPAllowed(clientIP);
  //     if (!isAllowed) {
  //       // تسجيل محاولة الوصول المرفوضة
  //       await IPWhitelistManager.logSecurityEvent(
  //         'BLOCKED_IP_ACCESS',
  //         null,
  //         clientIP,
  //         `محاولة وصول مرفوضة من عنوان IP غير مصرح: ${pathname}`,
  //         'high',
  //         { pathname, userAgent: request.headers.get('user-agent') }
  //       );
  //
  //       return new NextResponse('Access Denied - IP not in whitelist', { status: 403 });
  //     }
  //   } catch (error) {
  //     console.error('Error checking IP whitelist:', error);
  //     // في حالة الخطأ، السماح بالوصول لتجنب قفل النظام
  //   }
  // }

  // السماح بالمسارات العامة
  if (publicPaths.some(path => pathname.startsWith(path))) {
    const response = NextResponse.next();

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  }

  // الحصول على التوكن
  const token = request.cookies.get('auth-token')?.value;

  // إذا لم يكن هناك توكن، إعادة توجيه إلى صفحة تسجيل الدخول
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // التحقق من الصلاحيات للمسارات المحمية
    for (const [path, requiredPermissions] of Object.entries(protectedPaths)) {
      if (pathname.startsWith(path)) {
        const userPermissions = decoded.permissions || [];
        const hasPermission = requiredPermissions.some(permission => 
          userPermissions.includes(permission) || decoded.role === 'admin'
        );

        if (!hasPermission) {
          return NextResponse.json(
            { success: false, error: 'ليس لديك صلاحية للوصول إلى هذه الصفحة' },
            { status: 403 }
          );
        }
      }
    }

    // إضافة بيانات المستخدم إلى الهيدر للاستخدام في API routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', decoded.userId);
    response.headers.set('x-user-role', decoded.role);
    response.headers.set('x-user-permissions', JSON.stringify(decoded.permissions));

    return response;

  } catch (error) {
    // التوكن غير صالح، إعادة توجيه إلى صفحة تسجيل الدخول
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
