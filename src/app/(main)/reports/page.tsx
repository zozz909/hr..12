
'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, FileDown, HandCoins, CalendarOff, FileWarning } from 'lucide-react';
import { format } from 'date-fns';
import { institutions, getAllActiveEmployees } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const { toast } = useToast();
  const employees = getAllActiveEmployees();
  const [payrollMonth, setPayrollMonth] = React.useState('');
  const [leaveDate, setLeaveDate] = React.useState<Date>();
  
  const handleGenerateReport = (reportName: string) => {
    toast({
      title: 'تم إنشاء الطلب',
      description: `جاري توليد "${reportName}". سيتم إعلامك عند اكتماله.`,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-foreground">
          التقارير المتقدمة
        </h1>
        <p className="mt-2 text-muted-foreground">
          توليد تقارير مخصصة للموارد البشرية والمالية.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Payroll Report Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <HandCoins className="w-8 h-8 text-primary"/>
                <div>
                    <CardTitle>تقرير الرواتب الشهري</CardTitle>
                    <CardDescription>توليد تقرير مفصل للرواتب.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="payroll-month">الشهر والسنة</Label>
              <Input
                id="payroll-month"
                type="month"
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="payroll-institution">الجهة</Label>
              <Select>
                <SelectTrigger id="payroll-institution">
                  <SelectValue placeholder="اختر جهة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_employees">جميع الموظفين</SelectItem>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => handleGenerateReport('تقرير الرواتب')}>
              <FileDown className="ml-2 h-4 w-4" />
              توليد التقرير
            </Button>
          </CardContent>
        </Card>

        {/* Leave Report Card */}
        <Card>
          <CardHeader>
             <div className="flex items-center gap-3">
                <CalendarOff className="w-8 h-8 text-primary"/>
                <div>
                    <CardTitle>تقرير الإجازات</CardTitle>
                    <CardDescription>تصفية إجازات الموظفين.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
              <Label htmlFor="leave-employee">الموظف</Label>
              <Select>
                <SelectTrigger id="leave-employee">
                  <SelectValue placeholder="اختر موظفًا..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموظفين</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
                <Label>نطاق التاريخ</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !leaveDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {leaveDate ? format(leaveDate, "PPP") : <span>اختر تاريخًا</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={leaveDate}
                        onSelect={setLeaveDate}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <Button className="w-full" onClick={() => handleGenerateReport('تقرير الإجازات')}>
              <FileDown className="ml-2 h-4 w-4" />
              توليد التقرير
            </Button>
          </CardContent>
        </Card>

        {/* Documents Report Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <FileWarning className="w-8 h-8 text-primary"/>
                <div>
                    <CardTitle>تقرير صلاحية الوثائق</CardTitle>
                    <CardDescription>عرض حالة وثائق الموظفين.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
              <Label htmlFor="doc-type">نوع الوثيقة</Label>
              <Select>
                <SelectTrigger id="doc-type">
                  <SelectValue placeholder="اختر نوع الوثيقة..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">جميع الوثائق</SelectItem>
                    <SelectItem value="iqama">الإقامة</SelectItem>
                    <SelectItem value="workPermit">رخصة العمل</SelectItem>
                    <SelectItem value="insurance">التأمين</SelectItem>
                    <SelectItem value="healthCert">الشهادة الصحية</SelectItem>
                    <SelectItem value="contract">العقد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="doc-status">حالة الوثيقة</Label>
              <Select>
                <SelectTrigger id="doc-status">
                  <SelectValue placeholder="اختر الحالة..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="active">نشطة</SelectItem>
                    <SelectItem value="expiring_soon">تنتهي قريبًا</SelectItem>
                    <SelectItem value="expired">منتهية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => handleGenerateReport('تقرير الوثائق')}>
              <FileDown className="ml-2 h-4 w-4" />
              توليد التقرير
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
