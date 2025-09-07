'use client';
import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  Shield,
  Building2,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

export default function WelcomePage() {
  const { user } = useAuth();

  const getRoleLabel = (role: string) => {
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
  };

  const getQuickActions = () => {
    if (!user) return [];

    const actions = [
      {
        title: 'عرض الموظفين',
        description: 'استعراض قائمة الموظفين',
        href: '/employees',
        icon: Users,
        available: user.permissions.includes('view_employees') || user.role === 'admin'
      },
      {
        title: 'التقارير',
        description: 'عرض وتوليد التقارير',
        href: '/reports',
        icon: BarChart3,
        available: user.permissions.includes('view_reports') || user.role === 'admin'
      },
      {
        title: 'النماذج',
        description: 'الوصول إلى النماذج الإدارية',
        href: '/forms',
        icon: FileText,
        available: true
      },
      {
        title: 'إدارة الصلاحيات',
        description: 'إدارة صلاحيات المستخدمين',
        href: '/admin/permissions',
        icon: Settings,
        available: user.role === 'admin'
      }
    ];

    return actions.filter(action => action.available);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Welcome Header */}
      <div className="text-center space-y-6 mb-12">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="font-headline text-4xl font-bold text-foreground">
            مرحباً بك، {user.name}!
          </h1>
          <p className="text-xl text-muted-foreground">
            أهلاً وسهلاً في نظام إدارة الموارد البشرية
          </p>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {getRoleLabel(user.role)}
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">الإجراءات السريعة</CardTitle>
            <CardDescription className="text-center">
              الوصول السريع إلى الوظائف الأكثر استخداماً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getQuickActions().map((action, index) => (
                <Link key={index} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <action.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>البدء السريع</CardTitle>
            <CardDescription>خطوات للبدء في استخدام النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">تم تسجيل دخولك بنجاح</h4>
                  <p className="text-sm text-muted-foreground">
                    يمكنك الآن الوصول إلى جميع الوظائف المتاحة لدورك.
                  </p>
                </div>
              </div>

              {user.role === 'admin' && (
                <div className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">إعداد النظام</h4>
                    <p className="text-sm text-muted-foreground">
                      كمدير نظام، يمكنك إدارة المستخدمين والأدوار من صفحة الإعدادات.
                    </p>
                  </div>
                </div>
              )}

              {(user.role === 'hr_manager' || user.role === 'admin') && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">إدارة الموظفين</h4>
                    <p className="text-sm text-muted-foreground">
                      يمكنك إضافة وتعديل بيانات الموظفين وإدارة الرواتب والإجازات.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">التقارير والإحصائيات</h4>
                  <p className="text-sm text-muted-foreground">
                    استعرض التقارير المختلفة وإحصائيات النظام من قسم التقارير.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">الأمان والخصوصية</h4>
                  <p className="text-sm text-muted-foreground">
                    تأكد من تحديث كلمة المرور بانتظام ومراجعة إعدادات الأمان.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h4 className="font-medium text-green-900">النظام يعمل بشكل طبيعي</h4>
                <p className="text-sm text-green-800">
                  جميع الخدمات متاحة وتعمل بكفاءة عالية.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center">
          <Link href="/">
            <Button size="lg">
              <Building2 className="ml-2 h-5 w-5" />
              الانتقال إلى لوحة التحكم
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
