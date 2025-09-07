'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // تسجيل الخطأ في وحدة التحكم
    console.error('خطأ في التطبيق:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8 space-y-6">
          {/* Error Illustration */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              حدث خطأ غير متوقع
            </h1>
            <p className="text-muted-foreground">
              عذراً، حدث خطأ أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.
            </p>
          </div>

          {/* Error Details */}
          {error.message && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-mono">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  معرف الخطأ: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="ml-2 h-4 w-4" />
              إعادة المحاولة
            </Button>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <Home className="ml-2 h-4 w-4" />
                العودة إلى الصفحة الرئيسية
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              إذا استمر هذا الخطأ، يرجى تواصل مع الدعم التقني.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
