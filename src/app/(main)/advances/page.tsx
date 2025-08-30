
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
} from 'lucide-react';
import { getAllAdvances, Advance } from '@/lib/data';
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

const summaryCards = [
  {
    title: 'إجمالي السلف القائمة',
    amount: '12,500 ريال',
    icon: CircleDollarSign,
    trend: '+1,500 ريال هذا الشهر',
    trendIcon: TrendingUp,
    trendColor: 'text-destructive',
  },
  {
    title: 'المبالغ المسددة (هذا الشهر)',
    amount: '4,200 ريال',
    icon: Receipt,
    trend: '+10% عن الشهر الماضي',
    trendIcon: TrendingUp,
    trendColor: 'text-green-500',
  },
];

const statusMap = {
  pending: { text: 'قيد المراجعة', icon: Hourglass, color: 'text-yellow-500' },
  approved: { text: 'مقبولة', icon: CheckCircle, color: 'text-blue-500' },
  paid: { text: 'مدفوعة', icon: CircleDollarSign, color: 'text-green-500' },
  rejected: { text: 'مرفوضة', icon: XCircle, color: 'text-destructive' },
};

function DeleteAdvanceAlert() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive">
          <Trash2 />
          <span>حذف</span>
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيؤدي هذا الإجراء إلى حذف طلب السلفة بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
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


export default function AdvancesPage() {
  const advances = getAllAdvances();

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
        <Button>
          <PlusCircle className="ml-2 h-4 w-4" />
          طلب سلفة جديد
        </Button>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.amount}</div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <card.trendIcon className={cn('h-3 w-3', card.trendColor)} />
                <span className={card.trendColor}>{card.trend}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>طلبات السلف الأخيرة</CardTitle>
          <CardDescription>
            قائمة بآخر طلبات السلف المقدمة من الموظفين.
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
              {advances.map((advance) => {
                const StatusIcon = statusMap[advance.status].icon;
                const statusColor = statusMap[advance.status].color;
                const remainingAmount = advance.amount - advance.paidAmount;

                return(
                <TableRow key={advance.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={advance.employeePhotoUrl}
                          alt={advance.employeeName}
                        />
                        <AvatarFallback>
                          {advance.employeeName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{advance.employeeName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {advance.amount.toLocaleString()} ريال
                  </TableCell>
                  <TableCell>{advance.installments} أشهر</TableCell>
                  <TableCell className="font-semibold text-destructive">
                    {remainingAmount.toLocaleString()} ريال
                  </TableCell>
                   <TableCell>{advance.requestDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-2">
                       <StatusIcon className={cn('h-3 w-3', statusColor)} />
                      <span className={statusColor}>
                        {statusMap[advance.status].text}
                      </span>
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
                        <DeleteAdvanceAlert />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
               {advances.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                        لم يتم العثور على أي طلبات سلف.
                    </TableCell>
                </TableRow>
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
