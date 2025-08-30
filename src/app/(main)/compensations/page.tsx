
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
  ArrowDownCircle,
  ArrowUpCircle,
  MoreHorizontal,
  TrendingDown,
  TrendingUp,
  Edit,
  Trash2,
} from 'lucide-react';
import { getAllCompensations } from '@/lib/data';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
        title: 'إجمالي الخصومات (هذا الشهر)',
        amount: '1,250 ريال',
        icon: ArrowDownCircle,
        trend: '-15% عن الشهر الماضي',
        trendColor: 'text-green-500', // Negative trend is good for deductions
        trendIcon: TrendingDown,
    },
    {
        title: 'إجمالي المكافآت (هذا الشهر)',
        amount: '3,800 ريال',
        icon: ArrowUpCircle,
        trend: '+20% عن الشهر الماضي',
        trendColor: 'text-green-500',
        trendIcon: TrendingUp,
    }
];

const transactionTypeMap = {
    deduction: { text: 'خصم', variant: 'destructive' as const },
    reward: { text: 'مكافأة', variant: 'default' as const }
};

function DeleteCompensationAlert() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
            <Trash2 className="ml-2 h-4 w-4" />
            <span>حذف</span>
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيؤدي هذا الإجراء إلى حذف هذه الحركة (خصم/مكافأة) بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
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

export default function CompensationsPage() {
    const compensations = getAllCompensations();

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
          <Button variant="outline">
            <ArrowDownCircle className="ml-2 h-4 w-4" />
            إضافة خصم
          </Button>
          <Button>
            <ArrowUpCircle className="ml-2 h-4 w-4" />
            إضافة مكافأة
          </Button>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {summaryCards.map(card => (
               <Card key={card.title}>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                 <card.icon className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">{card.amount}</div>
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
          <CardTitle>سجل الحركات الأخير</CardTitle>
          <CardDescription>
            قائمة بآخر الخصومات والمكافآت المسجلة للموظفين.
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
              {compensations.map((item) => (
                <TableRow key={item.id}>
                   <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={item.employeePhotoUrl} alt={item.employeeName}/>
                          <AvatarFallback>
                            {item.employeeName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{item.employeeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.employeeId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  <TableCell>
                    <Badge variant={transactionTypeMap[item.type].variant}>
                      {transactionTypeMap[item.type].text}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.amount.toLocaleString()} ريال
                  </TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell className="text-left">
                  <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="ml-2 h-4 w-4" />
                            <span>تعديل</span>
                            </DropdownMenuItem>
                          <DeleteCompensationAlert />
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {compensations.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        لم يتم العثور على أي حركات.
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
