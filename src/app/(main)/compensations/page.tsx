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
  ArrowUpCircle, 
  ArrowDownCircle, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Plus
} from 'lucide-react';
import { compensationApi, type Compensation, type CompensationStats } from '@/lib/api/compensations';
import { employeeApi, type Employee } from '@/lib/api/employees';
import { cn } from '@/lib/utils';

export default function CompensationsPage() {
  const { toast } = useToast();
  
  // State management
  const [compensations, setCompensations] = React.useState<Compensation[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [stats, setStats] = React.useState<CompensationStats>({
    totalRewards: 0,
    totalDeductions: 0,
    rewardCount: 0,
    deductionCount: 0,
    netAmount: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [employeeSearch, setEmployeeSearch] = React.useState('');

  // Dialog states
  const [newCompensationDialog, setNewCompensationDialog] = React.useState(false);
  const [editCompensationDialog, setEditCompensationDialog] = React.useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = React.useState(false);
  
  // Form data
  const [newCompensationData, setNewCompensationData] = React.useState({
    employeeId: '',
    type: 'reward' as 'deduction' | 'reward',
    amount: '',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [editCompensationData, setEditCompensationData] = React.useState({
    id: '',
    employeeId: '',
    type: 'reward' as 'deduction' | 'reward',
    amount: '',
    reason: '',
    date: ''
  });
  
  const [deleteCompensationId, setDeleteCompensationId] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);

      const [compensationsRes, employeesRes, statsRes] = await Promise.all([
        compensationApi.getAll(),
        employeeApi.getAll(),
        compensationApi.getStats()
      ]);

      if (compensationsRes.success) {
        setCompensations(compensationsRes.data || []);
      } else {
        toast({
          title: "خطأ في تحميل الخصومات والمكافآت",
          description: compensationsRes.error || "حدث خطأ أثناء تحميل البيانات",
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
          totalRewards: 0,
          totalDeductions: 0,
          rewardCount: 0,
          deductionCount: 0,
          netAmount: 0
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

  // Handle create new compensation
  const handleCreateCompensation = async () => {
    if (!newCompensationData.employeeId || !newCompensationData.amount || !newCompensationData.reason) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(newCompensationData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "مبلغ غير صحيح",
        description: "يرجى إدخال مبلغ صحيح أكبر من صفر",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await compensationApi.create({
        employeeId: newCompensationData.employeeId,
        type: newCompensationData.type,
        amount: amount,
        reason: newCompensationData.reason,
        date: newCompensationData.date
      });

      if (response.success) {
        toast({
          title: "تم إنشاء الحركة",
          description: `تم إنشاء ${newCompensationData.type === 'reward' ? 'المكافأة' : 'الخصم'} بنجاح`,
        });

        setNewCompensationDialog(false);
        setNewCompensationData({
          employeeId: '',
          type: 'reward',
          amount: '',
          reason: '',
          date: new Date().toISOString().split('T')[0]
        });

        // Refresh data
        fetchData();
      } else {
        toast({
          title: "خطأ في إنشاء الحركة",
          description: response.error || "حدث خطأ أثناء إنشاء الحركة",
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "خطأ في إنشاء الحركة",
        description: "حدث خطأ أثناء إنشاء الحركة",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit compensation
  const handleEditCompensation = async () => {
    if (!editCompensationData.amount || !editCompensationData.reason) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(editCompensationData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "مبلغ غير صحيح",
        description: "يرجى إدخال مبلغ صحيح أكبر من صفر",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await compensationApi.update(editCompensationData.id, {
        employeeId: editCompensationData.employeeId,
        type: editCompensationData.type,
        amount: amount,
        reason: editCompensationData.reason,
        date: editCompensationData.date
      });

      if (response.success) {
        toast({
          title: "تم تحديث الحركة",
          description: "تم تحديث الحركة بنجاح",
        });

        setEditCompensationDialog(false);

        // Refresh data
        fetchData();
      } else {
        toast({
          title: "خطأ في تحديث الحركة",
          description: response.error || "حدث خطأ أثناء تحديث الحركة",
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "خطأ في تحديث الحركة",
        description: "حدث خطأ أثناء تحديث الحركة",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete compensation
  const handleDeleteCompensation = async () => {
    try {
      setSubmitting(true);

      const response = await compensationApi.delete(deleteCompensationId);

      if (response.success) {
        toast({
          title: "تم حذف الحركة",
          description: "تم حذف الحركة بنجاح",
        });

        setDeleteConfirmDialog(false);
        setDeleteCompensationId('');

        // Refresh data
        fetchData();
      } else {
        toast({
          title: "خطأ في حذف الحركة",
          description: response.error || "حدث خطأ أثناء حذف الحركة",
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "خطأ في حذف الحركة",
        description: "حدث خطأ أثناء حذف الحركة",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (compensation: Compensation) => {
    setEditCompensationData({
      id: compensation.id,
      employeeId: compensation.employeeId,
      type: compensation.type,
      amount: compensation.amount.toString(),
      reason: compensation.reason,
      date: compensation.date
    });
    setEditCompensationDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (compensationId: string) => {
    setDeleteCompensationId(compensationId);
    setDeleteConfirmDialog(true);
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

  // Statistics cards data
  const statsCards = [
    {
      title: 'إجمالي المكافآت',
      value: formatCurrency(stats.totalRewards),
      count: `${stats.rewardCount} مكافأة`,
      icon: ArrowUpCircle,
      trend: 'إيجابي',
      trendIcon: TrendingUp,
      trendColor: 'text-green-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'إجمالي الخصومات',
      value: formatCurrency(stats.totalDeductions),
      count: `${stats.deductionCount} خصم`,
      icon: ArrowDownCircle,
      trend: 'سلبي',
      trendIcon: TrendingDown,
      trendColor: 'text-red-500',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      title: 'الصافي',
      value: formatCurrency(stats.netAmount),
      count: `${stats.rewardCount + stats.deductionCount} حركة`,
      icon: DollarSign,
      trend: stats.netAmount >= 0 ? 'إيجابي' : 'سلبي',
      trendIcon: stats.netAmount >= 0 ? TrendingUp : TrendingDown,
      trendColor: stats.netAmount >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: stats.netAmount >= 0 ? 'bg-blue-50' : 'bg-orange-50',
      iconColor: stats.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'
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
            الخصومات والمكافآت
          </h1>
          <p className="mt-2 text-muted-foreground">
            إدارة الخصومات والمكافآت والحوافز للموظفين.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              setNewCompensationData(prev => ({ ...prev, type: 'deduction' }));
              setNewCompensationDialog(true);
            }}
          >
            <ArrowDownCircle className="ml-2 h-4 w-4" />
            إضافة خصم
          </Button>
          <Button
            onClick={() => {
              setNewCompensationData(prev => ({ ...prev, type: 'reward' }));
              setNewCompensationDialog(true);
            }}
          >
            <ArrowUpCircle className="ml-2 h-4 w-4" />
            إضافة مكافأة
          </Button>
        </div>
      </header>

      {/* Statistics Cards */}
      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
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

      {/* Compensations Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل الحركات</CardTitle>
          <CardDescription>
            قائمة بجميع الخصومات والمكافآت المسجلة للموظفين.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>نوع الحركة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>السبب</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compensations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>لا توجد حركات مسجلة</p>
                      <p className="text-sm">ابدأ بإضافة مكافأة أو خصم للموظفين</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                compensations.map((compensation) => (
                  <TableRow key={compensation.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={compensation.employeePhotoUrl} alt={compensation.employeeName} />
                          <AvatarFallback>
                            {compensation.employeeName?.charAt(0) || 'م'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{compensation.employeeName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={compensation.type === 'reward' ? 'default' : 'destructive'}
                        className={compensation.type === 'reward' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {compensation.type === 'reward' ? 'مكافأة' : 'خصم'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className={compensation.type === 'reward' ? 'text-green-600' : 'text-red-600'}>
                        {compensation.type === 'reward' ? '+' : '-'}{formatCurrency(compensation.amount)}
                      </span>
                    </TableCell>
                    <TableCell>{compensation.reason}</TableCell>
                    <TableCell>{formatDate(compensation.date)}</TableCell>
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
                          <DropdownMenuItem onClick={() => openEditDialog(compensation)}>
                            <Edit className="ml-2 h-4 w-4" />
                            <span>تعديل</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(compensation.id)}
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

      {/* New Compensation Dialog */}
      <Dialog open={newCompensationDialog} onOpenChange={setNewCompensationDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {newCompensationData.type === 'reward' ? 'إضافة مكافأة' : 'إضافة خصم'}
            </DialogTitle>
            <DialogDescription>
              قم بإدخال تفاصيل {newCompensationData.type === 'reward' ? 'المكافأة' : 'الخصم'} الجديد
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
                  value={newCompensationData.employeeId}
                  onValueChange={(value) => setNewCompensationData(prev => ({ ...prev, employeeId: value }))}
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
              <Label htmlFor="type">نوع الحركة</Label>
              <Select
                value={newCompensationData.type}
                onValueChange={(value: 'deduction' | 'reward') =>
                  setNewCompensationData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الحركة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reward">مكافأة</SelectItem>
                  <SelectItem value="deduction">خصم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">المبلغ (ريال سعودي)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newCompensationData.amount}
                onChange={(e) => setNewCompensationData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">التاريخ</Label>
              <Input
                id="date"
                type="date"
                value={newCompensationData.date}
                onChange={(e) => setNewCompensationData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">السبب</Label>
              <Textarea
                id="reason"
                placeholder="اكتب سبب المكافأة أو الخصم..."
                value={newCompensationData.reason}
                onChange={(e) => setNewCompensationData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCompensationDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateCompensation} disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Compensation Dialog */}
      <Dialog open={editCompensationDialog} onOpenChange={setEditCompensationDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تعديل الحركة</DialogTitle>
            <DialogDescription>
              قم بتعديل تفاصيل الحركة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editEmployee">الموظف</Label>
              <Select
                value={editCompensationData.employeeId}
                onValueChange={(value) => setEditCompensationData(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editType">نوع الحركة</Label>
              <Select
                value={editCompensationData.type}
                onValueChange={(value: 'deduction' | 'reward') =>
                  setEditCompensationData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الحركة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reward">مكافأة</SelectItem>
                  <SelectItem value="deduction">خصم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editAmount">المبلغ (ريال سعودي)</Label>
              <Input
                id="editAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={editCompensationData.amount}
                onChange={(e) => setEditCompensationData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editDate">التاريخ</Label>
              <Input
                id="editDate"
                type="date"
                value={editCompensationData.date}
                onChange={(e) => setEditCompensationData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editReason">السبب</Label>
              <Textarea
                id="editReason"
                placeholder="اكتب سبب المكافأة أو الخصم..."
                value={editCompensationData.reason}
                onChange={(e) => setEditCompensationData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCompensationDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditCompensation} disabled={submitting}>
              {submitting ? 'جاري التحديث...' : 'تحديث'}
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
              هل أنت متأكد من حذف هذه الحركة؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteCompensation} disabled={submitting}>
              {submitting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
