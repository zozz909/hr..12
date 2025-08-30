
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
import { getAllLeaveRequests, LeaveRequest } from '@/lib/data';
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

const leaveBalanceCards = [
  {
    title: 'الإجازة السنوية',
    balance: '21 يوم',
    icon: Plane,
    trend: '+5 أيام هذا الشهر',
    trendIcon: TrendingUp,
    trendColor: 'text-green-500',
  },
  {
    title: 'الإجازة المرضية',
    balance: '7 أيام',
    icon: HeartPulse,
    trend: '-2 يوم هذا الشهر',
    trendIcon: TrendingDown,
    trendColor: 'text-destructive',
  },
  {
    title: 'بدون راتب',
    balance: '3 أيام',
    icon: Hourglass,
    trend: '+1 يوم هذا الشهر',
    trendIcon: TrendingUp,
    trendColor: 'text-green-500',
  },
  {
    title: 'طارئة',
    balance: '1 يوم',
    icon: AlertOctagon,
    trend: 'لا تغيير',
    trendIcon: MoreHorizontal,
    trendColor: 'text-muted-foreground',
  },
];

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

function DeleteLeaveAlert() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
            <Trash2 className="ml-2 h-4 w-4" />
            <span>حذف الطلب</span>
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيؤدي هذا الإجراء إلى حذف طلب الإجازة بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction className={cn(buttonVariants({variant: "destructive"}))}>حذف</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function LeavesPage() {
  const leaveRequests = getAllLeaveRequests();

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
        <Button>
          <PlusCircle className="ml-2 h-4 w-4" />
          طلب إجازة جديد
        </Button>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {leaveBalanceCards.map((card, index) => (
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
                          <DropdownMenuItem>
                            <CheckCircle className="ml-2 h-4 w-4" />
                            <span>قبول</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <XCircle className="ml-2 h-4 w-4" />
                            <span>رفض</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="ml-2 h-4 w-4" />
                            <span>تعديل</span>
                          </DropdownMenuItem>
                          <DeleteLeaveAlert />
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
    </div>
  );
}
