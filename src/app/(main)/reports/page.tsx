
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
import {
  CalendarIcon,
  FileDown,
  HandCoins,
  CalendarOff,
  FileWarning,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Building2,
  Archive,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { institutions, getAllActiveEmployees } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const { toast } = useToast();
  const employees = getAllActiveEmployees();
  const [payrollMonth, setPayrollMonth] = React.useState('');
  const [payrollInstitution, setPayrollInstitution] = React.useState('all');
  const [leaveDate, setLeaveDate] = React.useState<Date>();
  const [deductionMonth, setDeductionMonth] = React.useState('');
  const [compensationMonth, setCompensationMonth] = React.useState('');
  const [advanceMonth, setAdvanceMonth] = React.useState('');
  const [archiveDate, setArchiveDate] = React.useState<Date>();
  const [branchType, setBranchType] = React.useState('summary');
  const [branchSelect, setBranchSelect] = React.useState('all');
  const [employeesType, setEmployeesType] = React.useState('basic_info');
  const [employeesStatus, setEmployeesStatus] = React.useState('all');
  const [employeesInstitution, setEmployeesInstitution] = React.useState('all');
  const [docType, setDocType] = React.useState('all');
  const [docStatus, setDocStatus] = React.useState('all');

  const handleGenerateReport = async (reportType: string, filters: any = {}) => {
    try {
      toast({
        title: 'جاري توليد التقرير',
        description: `جاري إعداد "${reportType}"...`,
      });

      // استدعاء API لتوليد التقرير
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          filters,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'تم توليد التقرير بنجاح',
          description: `تم تحميل "${reportType}" بنجاح.`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في توليد التقرير');
      }
    } catch (error) {
      console.error('خطأ في توليد التقرير:', error);
      toast({
        title: 'خطأ في توليد التقرير',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء توليد التقرير. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
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
              <Select value={payrollInstitution} onValueChange={setPayrollInstitution}>
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
            <Button
              className="w-full"
              onClick={() => handleGenerateReport('تقرير الرواتب', {
                month: payrollMonth,
                institution: payrollInstitution
              })}
            >
              <FileDown className="ml-2 h-4 w-4" />
              توليد التقرير
            </Button>
          </CardContent>
        </Card>

        {/* Deductions Report Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-destructive"/>
                <div>
                    <CardTitle>تقرير الخصومات</CardTitle>
                    <CardDescription>تقرير مفصل لجميع الخصومات.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deduction-month">الشهر والسنة</Label>
              <Input
                id="deduction-month"
                type="month"
                value={deductionMonth}
                onChange={(e) => setDeductionMonth(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="deduction-type">نوع الخصم</Label>
              <Select>
                <SelectTrigger id="deduction-type">
                  <SelectValue placeholder="اختر نوع الخصم..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الخصومات</SelectItem>
                  <SelectItem value="insurance">التأمين الاجتماعي</SelectItem>
                  <SelectItem value="tax">ضريبة الدخل</SelectItem>
                  <SelectItem value="advance">السلف</SelectItem>
                  <SelectItem value="absence">الغياب</SelectItem>
                  <SelectItem value="other">خصومات أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deduction-institution">الجهة</Label>
              <Select>
                <SelectTrigger id="deduction-institution">
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
            <Button
              className="w-full"
              onClick={() => handleGenerateReport('تقرير الخصومات', {
                month: deductionMonth,
                type: document.getElementById('deduction-type')?.getAttribute('data-value') || 'all',
                institution: document.getElementById('deduction-institution')?.getAttribute('data-value') || 'all'
              })}
            >
              <FileDown className="ml-2 h-4 w-4" />
              توليد التقرير
            </Button>
          </CardContent>
        </Card>

        {/* Compensations Report Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600"/>
                <div>
                    <CardTitle>تقرير المكافآت</CardTitle>
                    <CardDescription>تقرير مفصل لجميع المكافآت والبدلات.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="compensation-month">الشهر والسنة</Label>
              <Input
                id="compensation-month"
                type="month"
                value={compensationMonth}
                onChange={(e) => setCompensationMonth(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="compensation-type">نوع المكافأة</Label>
              <Select>
                <SelectTrigger id="compensation-type">
                  <SelectValue placeholder="اختر نوع المكافأة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المكافآت</SelectItem>
                  <SelectItem value="overtime">بدل إضافي</SelectItem>
                  <SelectItem value="transport">بدل نقل</SelectItem>
                  <SelectItem value="housing">بدل سكن</SelectItem>
                  <SelectItem value="bonus">مكافأة أداء</SelectItem>
                  <SelectItem value="other">مكافآت أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="compensation-institution">الجهة</Label>
              <Select>
                <SelectTrigger id="compensation-institution">
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
            <Button
              className="w-full"
              onClick={() => handleGenerateReport('تقرير المكافآت', {
                month: compensationMonth,
                type: document.getElementById('compensation-type')?.getAttribute('data-value') || 'all',
                institution: document.getElementById('compensation-institution')?.getAttribute('data-value') || 'all'
              })}
            >
              <FileDown className="ml-2 h-4 w-4" />
              توليد التقرير
            </Button>
          </CardContent>
        </Card>

        {/* Advances Report Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-blue-600"/>
                <div>
                    <CardTitle>تقرير السلف</CardTitle>
                    <CardDescription>تقرير مفصل لجميع السلف والمديونيات.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="advance-month">الشهر والسنة</Label>
              <Input
                id="advance-month"
                type="month"
                value={advanceMonth}
                onChange={(e) => setAdvanceMonth(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="advance-status">حالة السلفة</Label>
              <Select>
                <SelectTrigger id="advance-status">
                  <SelectValue placeholder="اختر حالة السلفة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع السلف</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="approved">موافق عليها</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                  <SelectItem value="deducted">مخصومة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="advance-institution">الجهة</Label>
              <Select>
                <SelectTrigger id="advance-institution">
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
            <Button
              className="w-full"
              onClick={() => handleGenerateReport('تقرير السلف', {
                month: advanceMonth,
                status: document.getElementById('advance-status')?.getAttribute('data-value') || 'all',
                institution: document.getElementById('advance-institution')?.getAttribute('data-value') || 'all'
              })}
            >
              <FileDown className="ml-2 h-4 w-4" />
              توليد التقرير
            </Button>
          </CardContent>
        </Card>

        {/* Branches Report Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-purple-600"/>
                <div>
                    <CardTitle>تقرير الفروع</CardTitle>
                    <CardDescription>تقرير شامل لجميع الفروع والموظفين.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="branch-type">نوع التقرير</Label>
              <Select value={branchType} onValueChange={setBranchType}>
                <SelectTrigger id="branch-type">
                  <SelectValue placeholder="اختر نوع التقرير..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">ملخص الفروع</SelectItem>
                  <SelectItem value="detailed">تقرير مفصل</SelectItem>
                  <SelectItem value="employees_by_branch">الموظفين حسب الفرع</SelectItem>
                  <SelectItem value="performance">أداء الفروع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="branch-select">الفرع</Label>
              <Select value={branchSelect} onValueChange={setBranchSelect}>
                <SelectTrigger id="branch-select">
                  <SelectValue placeholder="اختر فرع..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفروع</SelectItem>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => handleGenerateReport('تقرير الفروع', {
                type: branchType,
                institution: branchSelect
              })}
            >
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
            <Button
              className="w-full"
              onClick={() => handleGenerateReport('تقرير الإجازات', {
                employee: document.getElementById('leave-employee')?.getAttribute('data-value') || 'all',
                date: leaveDate
              })}
            >
              <FileDown className="ml-2 h-4 w-4" />
              توليد التقرير
            </Button>
          </CardContent>
        </Card>

        {/* Archive Report Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <Archive className="w-8 h-8 text-orange-600"/>
                <div>
                    <CardTitle>تقرير الأرشفة</CardTitle>
                    <CardDescription>تقرير الملفات والوثائق المؤرشفة.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="archive-type">نوع الأرشيف</Label>
              <Select>
                <SelectTrigger id="archive-type">
                  <SelectValue placeholder="اختر نوع الأرشيف..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الملفات</SelectItem>
                  <SelectItem value="employee_files">ملفات الموظفين</SelectItem>
                  <SelectItem value="payroll_records">سجلات الرواتب</SelectItem>
                  <SelectItem value="leave_records">سجلات الإجازات</SelectItem>
                  <SelectItem value="documents">الوثائق الرسمية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
                <Label>تاريخ الأرشفة</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !archiveDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {archiveDate ? format(archiveDate, "PPP") : <span>اختر تاريخ الأرشفة</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={archiveDate}
                        onSelect={setArchiveDate}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div>
              <Label htmlFor="archive-institution">الجهة</Label>
              <Select>
                <SelectTrigger id="archive-institution">
                  <SelectValue placeholder="اختر جهة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_employees">جميع الجهات</SelectItem>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => handleGenerateReport('تقرير الأرشفة', {
                type: document.getElementById('archive-type')?.getAttribute('data-value') || 'all',
                date: archiveDate,
                institution: document.getElementById('archive-institution')?.getAttribute('data-value') || 'all'
              })}
            >
              <FileDown className="ml-2 h-4 w-4" />
              توليد التقرير
            </Button>
          </CardContent>
        </Card>

        {/* All Employees Report Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-indigo-600"/>
                <div>
                    <CardTitle>تقرير جميع الموظفين</CardTitle>
                    <CardDescription>تقرير شامل لجميع الموظفين والبيانات.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employees-type">نوع التقرير</Label>
              <Select value={employeesType} onValueChange={setEmployeesType}>
                <SelectTrigger id="employees-type">
                  <SelectValue placeholder="اختر نوع التقرير..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic_info">البيانات الأساسية</SelectItem>
                  <SelectItem value="detailed">تقرير مفصل</SelectItem>
                  <SelectItem value="salary_info">معلومات الرواتب</SelectItem>
                  <SelectItem value="documents_status">حالة الوثائق</SelectItem>
                  <SelectItem value="attendance">الحضور والانصراف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employees-status">حالة الموظف</Label>
              <Select value={employeesStatus} onValueChange={setEmployeesStatus}>
                <SelectTrigger id="employees-status">
                  <SelectValue placeholder="اختر حالة الموظف..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموظفين</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="terminated">منتهي الخدمة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employees-institution">الجهة</Label>
              <Select value={employeesInstitution} onValueChange={setEmployeesInstitution}>
                <SelectTrigger id="employees-institution">
                  <SelectValue placeholder="اختر جهة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_employees">جميع الجهات</SelectItem>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => handleGenerateReport('تقرير جميع الموظفين', {
                type: employeesType,
                status: employeesStatus,
                institution: employeesInstitution
              })}
            >
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
              <Select value={docType} onValueChange={setDocType}>
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
              <Select value={docStatus} onValueChange={setDocStatus}>
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
            <Button
              className="w-full"
              onClick={() => handleGenerateReport('تقرير الوثائق المنتهية', {
                type: docType,
                status: docStatus
              })}
            >
              <FileDown className="ml-2 h-4 w-4" />
              توليد التقرير
            </Button>
          </CardContent>
        </Card>

        {/* Institutions Report Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-green-600"/>
                <div>
                    <CardTitle>تقرير المؤسسات</CardTitle>
                    <CardDescription>تقرير شامل لجميع المؤسسات والإحصائيات.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="inst-status">حالة المؤسسة</Label>
              <Select>
                <SelectTrigger id="inst-status">
                  <SelectValue placeholder="اختر حالة المؤسسة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المؤسسات</SelectItem>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="inactive">غير نشطة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => handleGenerateReport('تقرير المؤسسات', {
                status: 'all'
              })}
            >
              <FileDown className="ml-2 h-4 w-4" />
              توليد التقرير
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
