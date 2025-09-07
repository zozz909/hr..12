'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  PlayCircle,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Users,
  Calculator,
  FileText,
  Download,
  Trash2,
  Eye,
  DollarSign,
  Gift,
  Minus,
  CreditCard
} from 'lucide-react';
import { payrollApi, type PayrollRun, type PayrollEntry, type PayrollCalculation, type PayrollStats } from '@/lib/api/payroll';
import { cn } from '@/lib/utils';

export default function PayrollPage() {
  const { toast } = useToast();
  
  // State management
  const [payrollRuns, setPayrollRuns] = React.useState<PayrollRun[]>([]);
  const [stats, setStats] = React.useState<PayrollStats>({
    totalRuns: 0,
    totalEmployees: 0,
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    averageNetPay: 0
  });
  const [loading, setLoading] = React.useState(true);

  // Dialog states
  const [newPayrollDialog, setNewPayrollDialog] = React.useState(false);
  const [previewDialog, setPreviewDialog] = React.useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = React.useState(false);
  const [viewDetailsDialog, setViewDetailsDialog] = React.useState(false);
  
  // Form data
  const [newPayrollData, setNewPayrollData] = React.useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    institutionId: ''
  });
  
  const [previewData, setPreviewData] = React.useState<{
    calculations: PayrollCalculation[];
    summary: any;
  }>({
    calculations: [],
    summary: {}
  });
  
  const [selectedPayrollRun, setSelectedPayrollRun] = React.useState<PayrollRun | null>(null);
  const [payrollEntries, setPayrollEntries] = React.useState<PayrollEntry[]>([]);
  const [deletePayrollId, setDeletePayrollId] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [institutions, setInstitutions] = React.useState<Array<{id: string; name: string}>>([]);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [payrollRes, statsRes, institutionsRes] = await Promise.all([
        payrollApi.getAll(),
        payrollApi.getStats(),
        fetch('/api/institutions').then(res => res.json())
      ]);

      if (payrollRes.success) {
        setPayrollRuns(payrollRes.data || []);
      } else {
        toast({
          title: "خطأ في تحميل مسيرات الرواتب",
          description: payrollRes.error || "حدث خطأ أثناء تحميل البيانات",
          variant: "destructive",
        });
      }
      
      if (statsRes.success) {
        setStats(statsRes.data || {
          totalRuns: 0,
          totalEmployees: 0,
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0,
          averageNetPay: 0
        });
      }

      if (institutionsRes.success) {
        setInstitutions(institutionsRes.data || []);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  // Handle preview payroll
  const handlePreviewPayroll = async () => {
    if (!newPayrollData.month) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى تحديد الشهر",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingPreview(true);
      
      const response = await payrollApi.calculate(
        newPayrollData.month,
        newPayrollData.institutionId || undefined
      );

      if (response.success) {
        setPreviewData({
          calculations: response.data?.calculations || [],
          summary: response.data?.summary || {}
        });
        setPreviewDialog(true);
      } else {
        toast({
          title: "خطأ في حساب الرواتب",
          description: response.error || "حدث خطأ أثناء حساب الرواتب",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      toast({
        title: "خطأ في حساب الرواتب",
        description: "حدث خطأ أثناء حساب الرواتب",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  // Handle create payroll run
  const handleCreatePayrollRun = async () => {
    try {
      setSubmitting(true);
      
      const response = await payrollApi.create(
        newPayrollData.month,
        newPayrollData.institutionId || undefined
      );

      if (response.success) {
        toast({
          title: "تم تشغيل مسير الرواتب",
          description: `تم تشغيل مسير الرواتب لشهر ${newPayrollData.month} بنجاح`,
        });
        
        setNewPayrollDialog(false);
        setPreviewDialog(false);
        setNewPayrollData({
          month: new Date().toISOString().slice(0, 7),
          institutionId: ''
        });
        
        // Refresh data
        fetchData();
      } else {
        toast({
          title: "خطأ في تشغيل مسير الرواتب",
          description: response.error || "حدث خطأ أثناء تشغيل مسير الرواتب",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      toast({
        title: "خطأ في تشغيل مسير الرواتب",
        description: "حدث خطأ أثناء تشغيل مسير الرواتب",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle view payroll details
  const handleViewDetails = async (payrollRun: PayrollRun) => {
    try {
      const response = await payrollApi.getById(payrollRun.id);
      
      if (response.success) {
        setSelectedPayrollRun(response.data?.payrollRun || null);
        setPayrollEntries(response.data?.entries || []);
        setViewDetailsDialog(true);
      } else {
        toast({
          title: "خطأ في تحميل تفاصيل الرواتب",
          description: response.error || "حدث خطأ أثناء تحميل التفاصيل",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في تحميل تفاصيل الرواتب",
        description: "حدث خطأ أثناء تحميل التفاصيل",
        variant: "destructive",
      });
    }
  };

  // Handle delete payroll run
  const handleDeletePayrollRun = async () => {
    try {
      setSubmitting(true);
      
      const response = await payrollApi.delete(deletePayrollId);
      
      if (response.success) {
        toast({
          title: "تم حذف مسير الرواتب",
          description: "تم حذف مسير الرواتب وإرجاع جميع الخصومات بنجاح",
        });
        
        setDeleteConfirmDialog(false);
        setDeletePayrollId('');
        fetchData();
      } else {
        toast({
          title: "خطأ في حذف مسير الرواتب",
          description: response.error || "حدث خطأ أثناء حذف مسير الرواتب",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      toast({
        title: "خطأ في حذف مسير الرواتب",
        description: "حدث خطأ أثناء حذف مسير الرواتب",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (payrollId: string) => {
    setDeletePayrollId(payrollId);
    setDeleteConfirmDialog(true);
  };

  // Handle export to Excel
  const handleExportExcel = async (payrollId: string) => {
    try {
      const response = await fetch(`/api/payroll/${payrollId}/export/excel`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Get filename from response headers
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
          ? decodeURIComponent(contentDisposition.split('filename*=UTF-8\'\'')[1])
          : 'payroll_export.xlsx';

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "تم تصدير Excel",
          description: "تم تصدير مسير الرواتب إلى ملف Excel بنجاح",
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير ملف Excel",
        variant: "destructive",
      });
    }
  };

  // Handle export to PDF (opens in new window for printing)
  const handleExportPDF = async (payrollId: string) => {
    try {
      // Open PDF in new window for printing
      const url = `/api/payroll/${payrollId}/export/pdf`;
      window.open(url, '_blank');

      toast({
        title: "تم فتح تقرير PDF",
        description: "تم فتح التقرير في نافذة جديدة. يمكنك طباعته أو حفظه كـ PDF",
      });
    } catch (error) {
      toast({
        title: "خطأ في فتح التقرير",
        description: "حدث خطأ أثناء فتح تقرير PDF",
        variant: "destructive",
      });
    }
  };

  // Handle export all payroll runs
  const handleExportAllExcel = async () => {
    try {
      const response = await fetch('/api/payroll/export/all?format=summary');

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
          ? decodeURIComponent(contentDisposition.split('filename*=UTF-8\'\'')[1])
          : 'all_payroll_runs.xlsx';

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "تم تصدير جميع المسيرات",
          description: "تم تصدير ملخص جميع مسيرات الرواتب بنجاح",
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير جميع المسيرات",
        variant: "destructive",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA');
  };

  // Format month
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Status mapping
  const statusMap = {
    pending: { text: 'قيد التنفيذ', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    completed: { text: 'مكتمل', color: 'text-green-600', bgColor: 'bg-green-100' },
    failed: { text: 'فشل', color: 'text-red-600', bgColor: 'bg-red-100' },
  };

  // Statistics cards data
  const statsCards = [
    {
      title: 'إجمالي صافي الرواتب',
      value: formatCurrency(stats.totalNet),
      count: `${stats.totalRuns} مسير`,
      icon: CircleDollarSign,
      trend: 'جميع المسيرات',
      trendIcon: TrendingUp,
      trendColor: 'text-green-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'إجمالي الخصومات',
      value: formatCurrency(stats.totalDeductions),
      count: 'خصومات وسلف',
      icon: TrendingDown,
      trend: 'خصومات تلقائية',
      trendIcon: Minus,
      trendColor: 'text-red-500',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      title: 'متوسط صافي الراتب',
      value: formatCurrency(stats.averageNetPay),
      count: 'للموظف الواحد',
      icon: Users,
      trend: `${stats.totalEmployees} موظف`,
      trendIcon: Users,
      trendColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'إجمالي الرواتب الإجمالية',
      value: formatCurrency(stats.totalGross),
      count: 'قبل الخصومات',
      icon: DollarSign,
      trend: 'الراتب + المكافآت',
      trendIcon: Gift,
      trendColor: 'text-purple-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold text-foreground">
            إدارة الرواتب
          </h1>
          <p className="mt-2 text-muted-foreground">
            تشغيل ومتابعة مسيرات الرواتب مع الخصومات والمكافآت التلقائية.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportAllExcel}>
            <FileText className="ml-2 h-4 w-4" />
            تصدير جميع المسيرات
          </Button>
          <Button variant="outline" onClick={() => setNewPayrollDialog(true)}>
            <Calculator className="ml-2 h-4 w-4" />
            معاينة الرواتب
          </Button>
          <Button onClick={() => setNewPayrollDialog(true)}>
            <PlayCircle className="ml-2 h-4 w-4" />
            تشغيل مسير جديد
          </Button>
        </div>
      </header>

      {/* Statistics Cards */}
      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.count}
                  </p>
                </div>
                <div className={cn("rounded-full p-3", card.bgColor)}>
                  <card.icon className={cn("h-6 w-6", card.iconColor)} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <card.trendIcon className={cn("h-4 w-4", card.trendColor)} />
                <span className={cn("text-sm", card.trendColor)}>
                  {card.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Payroll Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>مسيرات الرواتب</CardTitle>
          <CardDescription>
            قائمة بجميع مسيرات الرواتب المنفذة مع تفاصيل الخصومات والمكافآت.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشهر</TableHead>
                <TableHead>المؤسسة</TableHead>
                <TableHead>عدد الموظفين</TableHead>
                <TableHead>إجمالي الرواتب</TableHead>
                <TableHead>الخصومات</TableHead>
                <TableHead>صافي الرواتب</TableHead>
                <TableHead>تاريخ التنفيذ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRuns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <PlayCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>لا توجد مسيرات رواتب</p>
                      <p className="text-sm">ابدأ بتشغيل مسير رواتب جديد</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payrollRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">
                      {formatMonth(run.month)}
                    </TableCell>
                    <TableCell>{run.institutionName || 'جميع المؤسسات'}</TableCell>
                    <TableCell>{run.totalEmployees} موظف</TableCell>
                    <TableCell className="font-semibold text-blue-600">
                      {formatCurrency(run.totalGross)}
                    </TableCell>
                    <TableCell className="font-semibold text-red-600">
                      {formatCurrency(run.totalDeductions)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(run.totalNet)}
                    </TableCell>
                    <TableCell>{formatDate(run.runDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("flex items-center gap-2", statusMap[run.status].bgColor)}>
                        <span className={statusMap[run.status].color}>
                          {statusMap[run.status].text}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">فتح القائمة</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(run)}>
                            <Eye className="ml-2 h-4 w-4" />
                            <span>عرض التفاصيل</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportPDF(run.id)}>
                            <Download className="ml-2 h-4 w-4" />
                            <span>تصدير PDF</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportExcel(run.id)}>
                            <FileText className="ml-2 h-4 w-4" />
                            <span>تصدير Excel</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(run.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
                            <span>حذف</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Payroll Dialog */}
      <Dialog open={newPayrollDialog} onOpenChange={setNewPayrollDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تشغيل مسير رواتب جديد</DialogTitle>
            <DialogDescription>
              قم بتحديد الشهر والمؤسسة لتشغيل مسير الرواتب
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="month">الشهر</Label>
              <Input
                id="month"
                type="month"
                value={newPayrollData.month}
                onChange={(e) => setNewPayrollData(prev => ({ ...prev, month: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="institution">المؤسسة (اختياري)</Label>
              <Select
                value={newPayrollData.institutionId}
                onValueChange={(value) => setNewPayrollData(prev => ({ ...prev, institutionId: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع المؤسسات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المؤسسات</SelectItem>
                  {institutions.map((institution) => (
                    <SelectItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPayrollDialog(false)}>
              إلغاء
            </Button>
            <Button variant="outline" onClick={handlePreviewPayroll} disabled={loadingPreview}>
              {loadingPreview ? 'جاري الحساب...' : 'معاينة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Payroll Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة مسير الرواتب - {formatMonth(newPayrollData.month)}</DialogTitle>
            <DialogDescription>
              معاينة حسابات الرواتب مع المكافآت والخصومات والسلف
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">عدد الموظفين</p>
                    <p className="text-xl font-bold">{previewData.summary.totalEmployees || 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">إجمالي الرواتب</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(previewData.summary.totalGross || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(previewData.summary.totalDeductions || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">صافي الرواتب</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(previewData.summary.totalNet || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            {previewData.calculations.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الراتب الأساسي</TableHead>
                      <TableHead>المكافآت</TableHead>
                      <TableHead>الخصومات</TableHead>
                      <TableHead>خصم السلف</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>صافي الراتب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.calculations.map((calc) => (
                      <TableRow key={calc.employeeId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={calc.employeePhotoUrl} alt={calc.employeeName} />
                              <AvatarFallback>
                                {calc.employeeName?.charAt(0) || 'م'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{calc.employeeName}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(calc.baseSalary)}</TableCell>
                        <TableCell className="text-green-600">
                          {calc.rewards > 0 ? `+${formatCurrency(calc.rewards)}` : '-'}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {calc.deductions > 0 ? `-${formatCurrency(calc.deductions)}` : '-'}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          {calc.advanceDeduction > 0 ? `-${formatCurrency(calc.advanceDeduction)}` : '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-blue-600">
                          {formatCurrency(calc.grossPay)}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(calc.netPay)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreatePayrollRun} disabled={submitting}>
              {submitting ? 'جاري التنفيذ...' : 'تأكيد وتنفيذ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف مسير الرواتب؟ سيتم إرجاع جميع خصومات السلف. لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeletePayrollRun} disabled={submitting}>
              {submitting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsDialog} onOpenChange={setViewDetailsDialog}>
        <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              تفاصيل مسير الرواتب - {selectedPayrollRun ? formatMonth(selectedPayrollRun.month) : ''}
            </DialogTitle>
            <DialogDescription>
              تفاصيل شاملة لمسير الرواتب مع جميع الحسابات والخصومات
            </DialogDescription>
          </DialogHeader>

          {selectedPayrollRun && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">عدد الموظفين</p>
                      <p className="text-xl font-bold">{selectedPayrollRun.totalEmployees}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">إجمالي الرواتب</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(selectedPayrollRun.totalGross)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(selectedPayrollRun.totalDeductions)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">صافي الرواتب</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(selectedPayrollRun.totalNet)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => handleExportExcel(selectedPayrollRun.id)}>
                  <FileText className="ml-2 h-4 w-4" />
                  تصدير Excel
                </Button>
                <Button variant="outline" onClick={() => handleExportPDF(selectedPayrollRun.id)}>
                  <Download className="ml-2 h-4 w-4" />
                  تصدير PDF
                </Button>
              </div>

              {/* Detailed Entries */}
              {payrollEntries.length > 0 && (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الموظف</TableHead>
                        <TableHead>الراتب الأساسي</TableHead>
                        <TableHead>المكافآت</TableHead>
                        <TableHead>الخصومات</TableHead>
                        <TableHead>خصم السلف</TableHead>
                        <TableHead>الإجمالي</TableHead>
                        <TableHead>صافي الراتب</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={entry.employeePhotoUrl} alt={entry.employeeName} />
                                <AvatarFallback>
                                  {entry.employeeName?.charAt(0) || 'م'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{entry.employeeName}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(entry.baseSalary)}</TableCell>
                          <TableCell className="text-green-600">
                            {entry.rewards > 0 ? `+${formatCurrency(entry.rewards)}` : '-'}
                          </TableCell>
                          <TableCell className="text-red-600">
                            {entry.deductions > 0 ? `-${formatCurrency(entry.deductions)}` : '-'}
                          </TableCell>
                          <TableCell className="text-orange-600">
                            {entry.advanceDeduction > 0 ? `-${formatCurrency(entry.advanceDeduction)}` : '-'}
                          </TableCell>
                          <TableCell className="font-semibold text-blue-600">
                            {formatCurrency(entry.grossPay)}
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatCurrency(entry.netPay)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDetailsDialog(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
