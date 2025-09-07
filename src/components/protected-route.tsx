'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  requiredRole,
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, hasPermission, hasRole } = useAuth();
  const router = useRouter();

  // عرض مؤشر التحميل أثناء التحقق من المصادقة
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">جاري التحقق من المصادقة...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // إعادة توجيه إلى صفحة تسجيل الدخول إذا لم يكن مصادق
  if (!isAuthenticated) {
    React.useEffect(() => {
      router.push('/login');
    }, [router]);

    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Shield className="h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">جاري إعادة التوجيه إلى صفحة تسجيل الدخول...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // التحقق من الدور المطلوب
  if (requiredRole && !hasRole(requiredRole) && user?.role !== 'admin') {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <p className="font-medium">ليس لديك صلاحية للوصول</p>
                  <p className="text-sm">
                    هذه الصفحة تتطلب دور "{requiredRole}" للوصول إليها.
                  </p>
                  <p className="text-sm">
                    دورك الحالي: "{getRoleLabel(user?.role || '')}"
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // التحقق من الصلاحيات المطلوبة
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.some(permission => 
      hasPermission(permission)
    );

    if (!hasRequiredPermissions && user?.role !== 'admin') {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-2">
                    <p className="font-medium">ليس لديك صلاحية للوصول</p>
                    <p className="text-sm">
                      هذه الصفحة تتطلب إحدى الصلاحيات التالية:
                    </p>
                    <ul className="text-sm list-disc list-inside">
                      {requiredPermissions.map(permission => (
                        <li key={permission}>{permission}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // عرض المحتوى إذا كانت جميع الشروط مستوفاة
  return <>{children}</>;

  function getRoleLabel(role: string) {
    switch (role) {
      case 'admin':
        return 'مدير النظام';
      case 'hr_manager':
        return 'مدير الموارد البشرية';
      case 'employee':
        return 'موظف';
      case 'viewer':
        return 'مشاهد';
      default:
        return role;
    }
  }
}
