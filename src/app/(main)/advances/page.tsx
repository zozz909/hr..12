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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  PlusCircle,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Receipt,
  Hourglass,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  CreditCard,
  Clock,
  DollarSign
} from 'lucide-react';
import { advanceApi, type Advance, type AdvanceStats } from '@/lib/api/advances';
import { employeeApi, type Employee } from '@/lib/api/employees';
import { cn } from '@/lib/utils';

export default function AdvancesPage() {
  const { toast } = useToast();
  
  // State management
  const [advances, setAdvances] = React.useState<Advance[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [stats, setStats] = React.useState<AdvanceStats>({
    totalAdvances: 0,
    totalPaid: 0,
    totalRemaining: 0,
    pendingCount: 0,
    approvedCount: 0,
    paidCount: 0,
    rejectedCount: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [employeeSearch, setEmployeeSearch] = React.useState('');

  // Dialog states
  const [newAdvanceDialog, setNewAdvanceDialog] = React.useState(false);
  const [editAdvanceDialog, setEditAdvanceDialog] = React.useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = React.useState(false);
  const [rejectDialog, setRejectDialog] = React.useState(false);
  const [autoDeductDialog, setAutoDeductDialog] = React.useState(false);
  
  // Form data
  const [newAdvanceData, setNewAdvanceData] = React.useState({
    employeeId: '',
    amount: '',
    installments: '1',
    requestDate: new Date().toISOString().split('T')[0]
  });
  
  const [editAdvanceData, setEditAdvanceData] = React.useState({
    id: '',
    employeeId: '',
    amount: '',
    installments: '',
    requestDate: ''
  });
  
  const [deleteAdvanceId, setDeleteAdvanceId] = React.useState('');
  const [rejectAdvanceData, setRejectAdvanceData] = React.useState({
    id: '',
    reason: ''
  });
  const [submitting, setSubmitting] = React.useState(false);

  // Auto deduction states
  const [deductionPreview, setDeductionPreview] = React.useState<any[]>([]);
  const [deductionSummary, setDeductionSummary] = React.useState({
    totalEmployees: 0,
    totalDeductions: 0,
    averageDeduction: 0
  });
  const [loadingPreview, setLoadingPreview] = React.useState(false);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [advancesRes, employeesRes, statsRes] = await Promise.all([
        advanceApi.getAll(),
        employeeApi.getAll(),
        advanceApi.getStats()
      ]);

      if (advancesRes.success) {
        setAdvances(advancesRes.data || []);
      } else {
        toast({
          title: "خطأ في تحميل السلف",
          description: advancesRes.error || "حدث خطأ أثناء تحميل البيانات",
          variant: "destructive",
        });
      }
      
      if (employeesRes.success) {
        setEmployees(employeesRes.data || []);
      } else {
        toast({
          title: "خطأ في تحميل الموظفين",
          description: employeesRes.error || "حدث خطأ أثناء تحميل بيانات الموظفين",
          variant: "destructive",
        });
      }
      
      if (statsRes.success) {
        setStats(statsRes.data || {
          totalAdvances: 0,
          totalPaid: 0,
          totalRemaining: 0,
          pendingCount: 0,
          approvedCount: 0,
          paidCount: 0,
          rejectedCount: 0
        });
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

  // Fetch deduction preview
  const fetchDeductionPreview = async () => {
    try {
      setLoadingPreview(true);

      const response = await advanceApi.previewDeductions();

      if (response.success) {
        setDeductionPreview(response.data?.employees || []);
        setDeductionSummary(response.data?.summary || {
          totalEmployees: 0,
          totalDeductions: 0,
          averageDeduction: 0
        });
      } else {
        toast({
          title: "خطأ في تحميل معاينة الخصومات",
          description: response.error || "حدث خطأ أثناء تحميل معاينة الخصومات",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في تحميل معاينة الخصومات",
        description: "حدث خطأ أثناء تحميل معاينة الخصومات",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  // Handle create new advance
  const handleCreateAdvance = async () => {
    if (!newAdvanceData.employeeId || !newAdvanceData.amount) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(newAdvanceData.amount);
    const installments = parseInt(newAdvanceData.installments);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "مبلغ غير صحيح",
        description: "يرجى إدخال مبلغ صحيح أكبر من صفر",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(installments) || installments <= 0) {
      toast({
        title: "عدد أقساط غير صحيح",
        description: "يرجى إدخال عدد أقساط صحيح أكبر من صفر",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await advanceApi.create({
        employeeId: newAdvanceData.employeeId,
        amount: amount,
        installments: installments,
        requestDate: newAdvanceData.requestDate,
        status: 'pending'
      });

      if (response.success) {
        toast({
          title: "تم إنشاء طلب السلفة",
          description: "تم إنشاء طلب السلفة بنجاح",
        });
        
        setNewAdvanceDialog(false);
        setNewAdvanceData({
          employeeId: '',
          amount: '',
          installments: '1',
          requestDate: new Date().toISOString().split('T')[0]
        });
        
        // Refresh data
        fetchData();
      } else {
        toast({
          title: "خطأ في إنشاء طلب السلفة",
          description: response.error || "حدث خطأ أثناء إنشاء طلب السلفة",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      toast({
        title: "خطأ في إنشاء طلب السلفة",
        description: "حدث خطأ أثناء إنشاء طلب السلفة",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle approve advance
  const handleApproveAdvance = async (advanceId: string) => {
    try {
      const response = await advanceApi.approve(advanceId, 'admin');
      
      if (response.success) {
        toast({
          title: "تم قبول طلب السلفة",
          description: "تم قبول طلب السلفة بنجاح",
        });
        fetchData();
      } else {
        toast({
          title: "خطأ في قبول طلب السلفة",
          description: response.error || "حدث خطأ أثناء قبول طلب السلفة",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في قبول طلب السلفة",
        description: "حدث خطأ أثناء قبول طلب السلفة",
        variant: "destructive",
      });
    }
  };

  // Handle reject advance
  const handleRejectAdvance = async () => {
    if (!rejectAdvanceData.reason.trim()) {
      toast({
        title: "سبب الرفض مطلوب",
        description: "يرجى كتابة سبب رفض طلب السلفة",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await advanceApi.reject(rejectAdvanceData.id, rejectAdvanceData.reason);
      
      if (response.success) {
        toast({
          title: "تم رفض طلب السلفة",
          description: "تم رفض طلب السلفة بنجاح",
        });
        
        setRejectDialog(false);
        setRejectAdvanceData({ id: '', reason: '' });
        fetchData();
      } else {
        toast({
          title: "خطأ في رفض طلب السلفة",
          description: response.error || "حدث خطأ أثناء رفض طلب السلفة",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في رفض طلب السلفة",
        description: "حدث خطأ أثناء رفض طلب السلفة",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (advanceId: string) => {
    try {
      const response = await advanceApi.markAsPaid(advanceId);
      
      if (response.success) {
        toast({
          title: "تم تسديد السلفة",
          description: "تم تسديد السلفة بنجاح",
        });
        fetchData();
      } else {
        toast({
          title: "خطأ في تسديد السلفة",
          description: response.error || "حدث خطأ أثناء تسديد السلفة",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في تسديد السلفة",
        description: "حدث خطأ أثناء تسديد السلفة",
        variant: "destructive",
      });
    }
  };

  // Handle delete advance
  const handleDeleteAdvance = async () => {
    try {
      setSubmitting(true);
      
      const response = await advanceApi.delete(deleteAdvanceId);
      
      if (response.success) {
        toast({
          title: "تم حذف طلب السلفة",
          description: "تم حذف طلب السلفة بنجاح",
        });
        
        setDeleteConfirmDialog(false);
        setDeleteAdvanceId('');
        fetchData();
      } else {
        toast({
          title: "خطأ في حذف طلب السلفة",
          description: response.error || "حدث خطأ أثناء حذف طلب السلفة",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      toast({
        title: "خطأ في حذف طلب السلفة",
        description: "حدث خطأ أثناء حذف طلب السلفة",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (advance: Advance) => {
    setEditAdvanceData({
      id: advance.id,
      employeeId: advance.employeeId,
      amount: advance.amount.toString(),
      installments: advance.installments.toString(),
      requestDate: advance.requestDate.split('T')[0]
    });
    setEditAdvanceDialog(true);
  };

  // Open reject dialog
  const openRejectDialog = (advanceId: string) => {
    setRejectAdvanceData({ id: advanceId, reason: '' });
    setRejectDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (advanceId: string) => {
    setDeleteAdvanceId(advanceId);
    setDeleteConfirmDialog(true);
  };

  // Open auto deduction dialog
  const openAutoDeductDialog = () => {
    setAutoDeductDialog(true);
    fetchDeductionPreview();
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

  // Status mapping
  const statusMap = {
    pending: { text: 'قيد المراجعة', icon: Hourglass, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    approved: { text: 'مقبولة', icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    paid: { text: 'مدفوعة', icon: CircleDollarSign, color: 'text-green-600', bgColor: 'bg-green-100' },
    rejected: { text: 'مرفوضة', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  };

  // Calculate approved advances total (only approved + paid, NOT pending)
  const approvedAdvancesTotal = advances
    .filter(advance => advance.status === 'approved' || advance.status === 'paid')
    .reduce((sum, advance) => sum + advance.amount, 0);

  const approvedAdvancesCount = advances
    .filter(advance => advance.status === 'approved' || advance.status === 'paid')
    .length;

  // Statistics cards data
  const statsCards = [
    {
      title: 'إجمالي السلف المقبولة',
      value: formatCurrency(approvedAdvancesTotal),
      count: `${approvedAdvancesCount} طلب مقبول`,
      icon: CircleDollarSign,
      trend: 'السلف المقبولة فقط',
      trendIcon: CheckCircle,
      trendColor: 'text-green-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'المبلغ المتبقي للسداد',
      value: formatCurrency(stats.totalRemaining),
      count: `${stats.approvedCount} سلفة نشطة`,
      icon: Clock,
      trend: 'متبقي للسداد',
      trendIcon: TrendingDown,
      trendColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      title: 'المبالغ المسددة',
      value: formatCurrency(stats.totalPaid),
      count: `${stats.paidCount} سلفة`,
      icon: Receipt,
      trend: 'تم السداد',
      trendIcon: TrendingUp,
      trendColor: 'text-green-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'طلبات قيد المراجعة',
      value: stats.pendingCount.toString(),
      count: 'طلب جديد',
      icon: Hourglass,
      trend: 'في انتظار الموافقة',
      trendIcon: Clock,
      trendColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'إجمالي السلف',
      value: formatCurrency(stats.totalAdvances),
      count: `${stats.pendingCount + stats.approvedCount + stats.paidCount + stats.rejectedCount} طلب`,
      icon: DollarSign,
      trend: 'جميع الطلبات',
      trendIcon: TrendingUp,
      trendColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
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
            إدارة السلف
          </h1>
          <p className="mt-2 text-muted-foreground">
            تتبع وإدارة سلف الموظفين والقروض الشخصية.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openAutoDeductDialog}>
            <Receipt className="ml-2 h-4 w-4" />
            الخصم التلقائي
          </Button>
          <Button onClick={() => setNewAdvanceDialog(true)}>
            <PlusCircle className="ml-2 h-4 w-4" />
            طلب سلفة جديد
          </Button>
        </div>
      </header>

      {/* Statistics Cards */}
      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
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

      {/* Advances Table */}
      <Card>
        <CardHeader>
          <CardTitle>طلبات السلف</CardTitle>
          <CardDescription>
            قائمة بجميع طلبات السلف المقدمة من الموظفين.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الأقساط</TableHead>
                <TableHead>المبلغ المتبقي</TableHead>
                <TableHead>تاريخ الطلب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>لا توجد طلبات سلف</p>
                      <p className="text-sm">ابدأ بإضافة طلب سلفة جديد</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                advances.map((advance) => {
                  const StatusIcon = statusMap[advance.status].icon;
                  const statusColor = statusMap[advance.status].color;
                  const statusBgColor = statusMap[advance.status].bgColor;

                  return (
                    <TableRow key={advance.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={advance.employeePhotoUrl} alt={advance.employeeName} />
                            <AvatarFallback>
                              {advance.employeeName?.charAt(0) || 'م'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{advance.employeeName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(advance.amount)}
                      </TableCell>
                      <TableCell>{advance.installments} شهر</TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        {formatCurrency(advance.remainingAmount)}
                      </TableCell>
                      <TableCell>{formatDate(advance.requestDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("flex items-center gap-2", statusBgColor)}>
                          <StatusIcon className={cn('h-3 w-3', statusColor)} />
                          <span className={statusColor}>
                            {statusMap[advance.status].text}
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
                            {advance.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApproveAdvance(advance.id)}>
                                  <CheckCircle className="ml-2 h-4 w-4" />
                                  <span>قبول</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openRejectDialog(advance.id)}>
                                  <XCircle className="ml-2 h-4 w-4" />
                                  <span>رفض</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {advance.status === 'approved' && (
                              <>
                                <DropdownMenuItem onClick={() => handleMarkAsPaid(advance.id)}>
                                  <CreditCard className="ml-2 h-4 w-4" />
                                  <span>تسديد</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => openEditDialog(advance)}>
                              <Edit className="ml-2 h-4 w-4" />
                              <span>تعديل</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(advance.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="ml-2 h-4 w-4" />
                              <span>حذف</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Advance Dialog */}
      <Dialog open={newAdvanceDialog} onOpenChange={setNewAdvanceDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>طلب سلفة جديد</DialogTitle>
            <DialogDescription>
              قم بإدخال تفاصيل طلب السلفة الجديد
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="employee">الموظف</Label>
              <div className="space-y-2">
                <Input
                  placeholder="ابحث عن الموظف..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                />
                <Select
                  value={newAdvanceData.employeeId}
                  onValueChange={(value) => setNewAdvanceData(prev => ({ ...prev, employeeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الموظف" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(employee =>
                        employee.name.toLowerCase().includes(employeeSearch.toLowerCase())
                      )
                      .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">مبلغ السلفة (ريال سعودي)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newAdvanceData.amount}
                onChange={(e) => setNewAdvanceData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="installments">عدد الأقساط (شهر)</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                max="12"
                placeholder="1"
                value={newAdvanceData.installments}
                onChange={(e) => setNewAdvanceData(prev => ({ ...prev, installments: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requestDate">تاريخ الطلب</Label>
              <Input
                id="requestDate"
                type="date"
                value={newAdvanceData.requestDate}
                onChange={(e) => setNewAdvanceData(prev => ({ ...prev, requestDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewAdvanceDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateAdvance} disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : 'إنشاء طلب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Advance Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>رفض طلب السلفة</DialogTitle>
            <DialogDescription>
              يرجى كتابة سبب رفض طلب السلفة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejectionReason">سبب الرفض</Label>
              <Textarea
                id="rejectionReason"
                placeholder="اكتب سبب رفض طلب السلفة..."
                value={rejectAdvanceData.reason}
                onChange={(e) => setRejectAdvanceData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleRejectAdvance} disabled={submitting}>
              {submitting ? 'جاري الرفض...' : 'رفض الطلب'}
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
              هل أنت متأكد من حذف طلب السلفة؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdvance} disabled={submitting}>
              {submitting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto Deduction Dialog */}
      <Dialog open={autoDeductDialog} onOpenChange={setAutoDeductDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>معاينة الخصم التلقائي للسلف</DialogTitle>
            <DialogDescription>
              معاينة الخصومات التلقائية التي سيتم تطبيقها على رواتب الموظفين
            </DialogDescription>
          </DialogHeader>

          {loadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">جاري تحميل معاينة الخصومات...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">عدد الموظفين</p>
                      <p className="text-2xl font-bold">{deductionSummary.totalEmployees}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
                      <p className="text-2xl font-bold">{formatCurrency(deductionSummary.totalDeductions)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">متوسط الخصم</p>
                      <p className="text-2xl font-bold">{formatCurrency(deductionSummary.averageDeduction)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Deductions Table */}
              {deductionPreview.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الموظف</TableHead>
                        <TableHead>الراتب</TableHead>
                        <TableHead>عدد السلف</TableHead>
                        <TableHead>مبلغ الخصم</TableHead>
                        <TableHead>النسبة من الراتب</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deductionPreview.map((employee) => (
                        <TableRow key={employee.employeeId}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={employee.employeePhotoUrl} alt={employee.employeeName} />
                                <AvatarFallback>
                                  {employee.employeeName?.charAt(0) || 'م'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{employee.employeeName}</div>
                                <div className="text-sm text-muted-foreground">{employee.institutionName}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(employee.salary)}</TableCell>
                          <TableCell>{employee.activeAdvancesCount}</TableCell>
                          <TableCell className="font-semibold text-red-600">
                            {formatCurrency(employee.monthlyDeduction)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {employee.salary > 0 ?
                                `${((employee.monthlyDeduction / employee.salary) * 100).toFixed(1)}%` :
                                '0%'
                              }
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد خصومات للتطبيق</p>
                  <p className="text-sm text-muted-foreground">جميع السلف مسددة أو لا توجد سلف مقبولة</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoDeductDialog(false)}>
              إغلاق
            </Button>
            {deductionPreview.length > 0 && (
              <Button onClick={() => {
                toast({
                  title: "معلومة",
                  description: "سيتم تطبيق الخصومات تلقائياً عند تشغيل مسير الرواتب",
                });
                setAutoDeductDialog(false);
              }}>
                تأكيد المعاينة
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
