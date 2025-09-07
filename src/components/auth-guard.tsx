'use client';
import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AuthNavbar } from '@/components/auth-navbar';
import { ClientNavbar } from '@/components/client-navbar';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // إذا لم يكن مصادق ولم يكن في صفحة تسجيل الدخول
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }

    // إذا كان مصادق وفي صفحة تسجيل الدخول، إعادة توجيه إلى الصفحة الرئيسية
    if (!isLoading && isAuthenticated && pathname === '/login') {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // عرض شاشة تحميل أثناء التحقق من المصادقة
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري التحقق من المصادقة...</p>
        </div>
      </div>
    );
  }

  // إذا لم يكن مصادق ولم يكن في صفحة تسجيل الدخول، عرض شاشة تحميل
  if (!isAuthenticated && pathname !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري إعادة التوجيه...</p>
        </div>
      </div>
    );
  }

  // إذا كان مصادق وفي صفحة تسجيل الدخول، لا تعرض شيء (سيتم إعادة التوجيه)
  if (isAuthenticated && pathname === '/login') {
    return null;
  }

  // إذا كان في صفحة تسجيل الدخول، عرض المحتوى بدون navbar
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // عرض layout العادي مع navbar للصفحات الأخرى
  return (
    <>
      <AuthNavbar />
      <div className="flex min-h-screen">
        <ClientNavbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
