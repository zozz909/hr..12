import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowRight, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8 space-y-6">
          {/* 404 Illustration */}
          <div className="space-y-4">
            <div className="text-8xl font-bold text-primary/20">404</div>
            <h1 className="text-2xl font-bold text-gray-900">
              الصفحة غير موجودة
            </h1>
            <p className="text-muted-foreground">
              عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى مكان آخر.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full">
                <Home className="ml-2 h-4 w-4" />
                العودة إلى الصفحة الرئيسية
              </Button>
            </Link>
            
            <Link href="/settings" className="block">
              <Button variant="outline" className="w-full">
                <Search className="ml-2 h-4 w-4" />
                البحث في الإعدادات
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              إذا كنت تعتقد أن هذا خطأ، تواصل مع مدير النظام.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
