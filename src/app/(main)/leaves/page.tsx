
'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Plane,
  HeartPulse,
  Hourglass,
  AlertOctagon,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react';
import { useLeaveRequests, useEmployees } from '@/hooks/useHRData';
import { leaveApi } from '@/lib/api-client';
import { LeaveRequest } from '@/lib/models/LeaveRequest';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Calculate leave statistics from real data
const getLeaveStats = (leaveRequests: LeaveRequest[]) => {
  const currentYear = new Date().getFullYear();
  const approvedLeaves = leaveRequests.filter(req =>
    req.status === 'approved' &&
    new Date(req.startDate).getFullYear() === currentYear
  );

  const stats = {
    annual: { count: 0, days: 0 },
    sick: { count: 0, days: 0 },
    unpaid: { count: 0, days: 0 },
    emergency: { count: 0, days: 0 }
  };

  approvedLeaves.forEach(leave => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    stats[leave.leaveType].count++;
    stats[leave.leaveType].days += days;
  });

  return [
    {
      title: 'الإجازة السنوية',
      balance: `${stats.annual.days} يوم`,
      count: stats.annual.count,
      icon: Plane,
      trend: `${stats.annual.count} طلب هذا العام`,
      trendIcon: TrendingUp,
      trendColor: 'text-green-500',
    },
    {
      title: 'الإجازة المرضية',
      balance: `${stats.sick.days} يوم`,
      count: stats.sick.count,
      icon: HeartPulse,
      trend: `${stats.sick.count} طلب هذا العام`,
      trendIcon: TrendingDown,
      trendColor: 'text-blue-500',
    },
    {
      title: 'بدون راتب',
      balance: `${stats.unpaid.days} يوم`,
      count: stats.unpaid.count,
      icon: Hourglass,
      trend: `${stats.unpaid.count} طلب هذا العام`,
      trendIcon: MoreHorizontal,
      trendColor: 'text-orange-500',
    },
    {
      title: 'الإجازات الطارئة',
      balance: `${stats.emergency.days} يوم`,
      count: stats.emergency.count,
      icon: AlertOctagon,
      trend: `${stats.emergency.count} طلب هذا العام`,
      trendIcon: TrendingUp,
      trendColor: 'text-red-500',
    },
  ];
};

const leaveTypeMap = {
  annual: 'سنوية',
  sick: 'مرضية',
  unpaid: 'بدون راتب',
  emergency: 'طارئة',
};

const statusMap = {
  pending: { text: 'قيد المراجعة', color: 'bg-yellow-500', icon: Hourglass },
  approved: { text: 'مقبولة', color: 'bg-green-500', icon: CheckCircle },
  rejected: { text: 'مرفوضة', color: 'bg-destructive', icon: XCircle },
};


export default function LeavesPage() {
  const { leaveRequests, loading, error, refetch } = useLeaveRequests();
  const { employees } = useEmployees();
  const { toast } = useToast();

  // State for new leave request dialog
  const [newLeaveDialog, setNewLeaveDialog] = React.useState(false);
  const [newLeaveData, setNewLeaveData] = React.useState({
    employeeId: '',
    leaveType: 'annual' as 'annual' | 'sick' | 'unpaid' | 'emergency',
    startDate: new Date().toISOString().split('T')[0], // Today's date
    endDate: new Date().toISOString().split('T')[0], // Today's date
    reason: '',
    isUnpaid: false // New field for unpaid leave checkbox
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [employeeSearch, setEmployeeSearch] = React.useState('');

  // State for extend leave dialog
  const [extendDialog, setExtendDialog] = React.useState(false);
  const [extendLeaveData, setExtendLeaveData] = React.useState({
    leaveId: '',
    currentEndDate: '',
    newEndDate: ''
  });

  // Handle create new leave request
  const handleCreateLeave = async () => {
    if (!newLeaveData.employeeId || !newLeaveData.startDate || !newLeaveData.endDate || !newLeaveData.reason) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    // Validate date range on frontend
    const startDate = new Date(newLeaveData.startDate);
    const endDate = new Date(newLeaveData.endDate);

    if (endDate < startDate) {
      toast({
        title: "خطأ في التواريخ",
        description: "تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await leaveApi.create({
        employeeId: newLeaveData.employeeId,
        leaveType: newLeaveData.isUnpaid ? 'unpaid' : newLeaveData.leaveType,
        startDate: newLeaveData.startDate,
        endDate: newLeaveData.endDate,
        reason: newLeaveData.reason,
        status: 'pending'
      });

      if (response.success) {
        toast({
          title: "تم إنشاء طلب الإجازة",
          description: "تم إنشاء طلب الإجازة بنجاح",
        });
        setNewLeaveDialog(false);
        setNewLeaveData({
          employeeId: '',
          leaveType: 'annual',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          reason: '',
          isUnpaid: false
        });
        refetch();
      } else {
        toast({
          title: "خطأ في إنشاء الطلب",
          description: response.error || "حدث خطأ أثناء إنشاء طلب الإجازة",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الطلب",
        description: "حدث خطأ أثناء إنشاء طلب الإجازة",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle approve leave
  const handleApprove = async (leaveId: string) => {
    try {
      const response = await leaveApi.approve(leaveId, 'admin'); // You might want to get actual user ID
      if (response.success) {
        toast({
          title: "تم قبول الطلب",
          description: "تم قبول طلب الإجازة بنجاح",
        });
        refetch();
      } else {
        toast({
          title: "خطأ في قبول الطلب",
          description: response.error || "حدث خطأ أثناء قبول الطلب",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في قبول الطلب",
        description: "حدث خطأ أثناء قبول الطلب",
        variant: "destructive",
      });
    }
  };

  // Handle reject leave
  const handleReject = async (leaveId: string, reason: string) => {
    try {
      const response = await leaveApi.reject(leaveId, reason);
      if (response.success) {
        toast({
          title: "تم رفض الطلب",
          description: "تم رفض طلب الإجازة",
        });
        refetch();
      } else {
        toast({
          title: "خطأ في رفض الطلب",
          description: response.error || "حدث خطأ أثناء رفض الطلب",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في رفض الطلب",
        description: "حدث خطأ أثناء رفض الطلب",
        variant: "destructive",
      });
    }
  };

  // Handle delete leave
  const handleDeleteLeave = async (leaveId: string) => {
    try {
      const response = await leaveApi.delete(leaveId);
      if (response.success) {
        toast({
          title: "تم حذف الطلب",
          description: "تم حذف طلب الإجازة بنجاح",
        });
        refetch();
      } else {
        toast({
          title: "خطأ في حذف الطلب",
          description: response.error || "حدث خطأ أثناء حذف الطلب",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في حذف الطلب",
        description: "حدث خطأ أثناء حذف الطلب",
        variant: "destructive",
      });
    }
  };

  // Handle extend leave
  const handleExtendLeave = async () => {
    if (!extendLeaveData.newEndDate) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى تحديد تاريخ النهاية الجديد",
        variant: "destructive",
      });
      return;
    }

    // Validate new end date is after current end date
    const currentEnd = new Date(extendLeaveData.currentEndDate);
    const newEnd = new Date(extendLeaveData.newEndDate);

    if (newEnd <= currentEnd) {
      toast({
        title: "خطأ في التاريخ",
        description: "تاريخ النهاية الجديد يجب أن يكون بعد التاريخ الحالي",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await leaveApi.update(extendLeaveData.leaveId, {
        endDate: extendLeaveData.newEndDate
      });
      if (response.success) {
        toast({
          title: "تم تمديد الإجازة",
          description: "تم تمديد الإجازة بنجاح",
        });
        setExtendDialog(false);
        setExtendLeaveData({ leaveId: '', currentEndDate: '', newEndDate: '' });
        refetch();
      } else {
        toast({
          title: "خطأ في تمديد الإجازة",
          description: response.error || "حدث خطأ أثناء تمديد الإجازة",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في تمديد الإجازة",
        description: "حدث خطأ أثناء تمديد الإجازة",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>جاري تحميل طلبات الإجازات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">خطأ في تحميل البيانات: {error}</p>
            <Button onClick={refetch}>إعادة المحاولة</Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics from real data
  const leaveStats = getLeaveStats(leaveRequests);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold text-foreground">
            إدارة الإجازات
          </h1>
          <p className="mt-2 text-muted-foreground">
            تتبع وإدارة طلبات إجازات الموظفين وأرصدتهم.
          </p>
        </div>
        <Dialog open={newLeaveDialog} onOpenChange={setNewLeaveDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="ml-2 h-4 w-4" />
              طلب إجازة جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>طلب إجازة جديد</DialogTitle>
              <DialogDescription>
                قم بملء البيانات التالية لإنشاء طلب إجازة جديد
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
                    value={newLeaveData.employeeId}
                    onValueChange={(value) => setNewLeaveData(prev => ({ ...prev, employeeId: value }))}
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
                <Label htmlFor="leaveType">نوع الإجازة</Label>
                <Select
                  value={newLeaveData.isUnpaid ? 'unpaid' : newLeaveData.leaveType}
                  onValueChange={(value: 'annual' | 'sick' | 'unpaid' | 'emergency') => {
                    if (value === 'unpaid') {
                      setNewLeaveData(prev => ({ ...prev, leaveType: 'annual', isUnpaid: true }));
                    } else {
                      setNewLeaveData(prev => ({ ...prev, leaveType: value, isUnpaid: false }));
                    }
                  }}
                  disabled={newLeaveData.isUnpaid}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الإجازة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">إجازة سنوية</SelectItem>
                    <SelectItem value="sick">إجازة مرضية</SelectItem>
                    <SelectItem value="emergency">إجازة طارئة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isUnpaid"
                  checked={newLeaveData.isUnpaid}
                  onCheckedChange={(checked) =>
                    setNewLeaveData(prev => ({ ...prev, isUnpaid: checked as boolean }))
                  }
                />
                <Label htmlFor="isUnpaid" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  إجازة بدون راتب
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">تاريخ البداية</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newLeaveData.startDate}
                    onChange={(e) => setNewLeaveData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">تاريخ النهاية</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newLeaveData.endDate}
                    onChange={(e) => setNewLeaveData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">السبب</Label>
                <Textarea
                  id="reason"
                  placeholder="اكتب سبب طلب الإجازة..."
                  value={newLeaveData.reason}
                  onChange={(e) => setNewLeaveData(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewLeaveDialog(false)}
                disabled={submitting}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                onClick={handleCreateLeave}
                disabled={submitting}
              >
                {submitting ? "جاري الإنشاء..." : "إنشاء الطلب"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {leaveStats.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.balance}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <card.trendIcon className={cn('h-3 w-3', card.trendColor)} />
                <span className={card.trendColor}>{card.trend}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>طلبات الإجازة الأخيرة</CardTitle>
          <CardDescription>
            قائمة بآخر طلبات الإجازة المقدمة من الموظفين.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>نوع الإجازة</TableHead>
                <TableHead>الفترة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((request) => {
                const StatusIcon = statusMap[request.status].icon;
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={request.employeePhotoUrl} alt={request.employeeName}/>
                          <AvatarFallback>
                            {request.employeeName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.employeeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.requestDate}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{leaveTypeMap[request.leaveType]}</TableCell>
                    <TableCell>
                      {request.startDate} إلى {request.endDate}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        <StatusIcon
                          className={cn(
                            'h-3 w-3',
                            statusMap[request.status].color.replace('bg-', 'text-')
                          )}
                        />
                        {statusMap[request.status].text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {request.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(request.id)}>
                                <CheckCircle className="ml-2 h-4 w-4" />
                                <span>قبول</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(request.id, 'تم رفض الطلب')}>
                                <XCircle className="ml-2 h-4 w-4" />
                                <span>رفض</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {request.status === 'approved' && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setExtendLeaveData({
                                  leaveId: request.id,
                                  currentEndDate: request.endDate,
                                  newEndDate: ''
                                });
                                setExtendDialog(true);
                              }}>
                                <Calendar className="ml-2 h-4 w-4" />
                                <span>تمديد الإجازة</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem>
                            <Edit className="ml-2 h-4 w-4" />
                            <span>تعديل</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteLeave(request.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
                            <span>حذف</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Extend Leave Dialog */}
      <Dialog open={extendDialog} onOpenChange={setExtendDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تمديد الإجازة</DialogTitle>
            <DialogDescription>
              قم بتحديد تاريخ النهاية الجديد للإجازة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="currentEndDate">تاريخ النهاية الحالي</Label>
              <Input
                id="currentEndDate"
                value={extendLeaveData.currentEndDate}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newEndDate">تاريخ النهاية الجديد</Label>
              <Input
                id="newEndDate"
                type="date"
                value={extendLeaveData.newEndDate}
                onChange={(e) => setExtendLeaveData(prev => ({ ...prev, newEndDate: e.target.value }))}
                min={extendLeaveData.currentEndDate}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleExtendLeave}>
              تمديد الإجازة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
