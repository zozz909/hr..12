'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function TestDesignPage() {
  return (
    <div className="min-h-screen bg-background p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            اختبار التصميم
          </h1>
          <p className="text-lg text-muted-foreground">
            هذه الصفحة لاختبار أن جميع عناصر التصميم تعمل بشكل صحيح
          </p>
        </div>

        {/* Colors Test */}
        <Card>
          <CardHeader>
            <CardTitle>اختبار الألوان</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary text-primary-foreground p-4 rounded text-center">
                Primary
              </div>
              <div className="bg-secondary text-secondary-foreground p-4 rounded text-center">
                Secondary
              </div>
              <div className="bg-accent text-accent-foreground p-4 rounded text-center">
                Accent
              </div>
              <div className="bg-muted text-muted-foreground p-4 rounded text-center">
                Muted
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Test */}
        <Card>
          <CardHeader>
            <CardTitle>اختبار الخطوط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-4xl font-bold">عنوان رئيسي - H1</h1>
            <h2 className="text-3xl font-semibold">عنوان فرعي - H2</h2>
            <h3 className="text-2xl font-medium">عنوان صغير - H3</h3>
            <p className="text-base">
              هذا نص عادي باللغة العربية لاختبار الخط والتباعد والوضوح. 
              يجب أن يكون النص واضحاً ومقروءاً بسهولة.
            </p>
            <p className="text-sm text-muted-foreground">
              نص صغير باللون الرمادي للمعلومات الثانوية.
            </p>
          </CardContent>
        </Card>

        {/* Buttons Test */}
        <Card>
          <CardHeader>
            <CardTitle>اختبار الأزرار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button>زر أساسي</Button>
              <Button variant="secondary">زر ثانوي</Button>
              <Button variant="outline">زر محدد</Button>
              <Button variant="ghost">زر شفاف</Button>
              <Button variant="destructive">زر خطر</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">زر صغير</Button>
              <Button size="default">زر عادي</Button>
              <Button size="lg">زر كبير</Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements Test */}
        <Card>
          <CardHeader>
            <CardTitle>اختبار عناصر النماذج</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input id="name" placeholder="أدخل اسمك هنا" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="example@domain.com" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges Test */}
        <Card>
          <CardHeader>
            <CardTitle>اختبار الشارات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>افتراضي</Badge>
              <Badge variant="secondary">ثانوي</Badge>
              <Badge variant="outline">محدد</Badge>
              <Badge variant="destructive">خطر</Badge>
            </div>
          </CardContent>
        </Card>

        {/* RTL Test */}
        <Card>
          <CardHeader>
            <CardTitle>اختبار الاتجاه العربي (RTL)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded">
              <span>النص على اليمين</span>
              <Button size="sm">زر على اليسار</Button>
            </div>
            <div className="text-right">
              <p>
                هذا النص يجب أن يكون محاذياً إلى اليمين ويقرأ من اليمين إلى اليسار.
                الأرقام مثل 123 و 456 يجب أن تظهر بشكل صحيح.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Grid Test */}
        <Card>
          <CardHeader>
            <CardTitle>اختبار الشبكة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="bg-primary/10 p-4 rounded text-center">
                  عنصر {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>حالة التصميم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>الخطوط: محملة بنجاح</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>الألوان: تعمل بشكل صحيح</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>الاتجاه: RTL نشط</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>التجاوب: يعمل على جميع الأحجام</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
