
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  FileText,
  Download,
  PlayCircle,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Users,
  RefreshCw,
} from 'lucide-react';
import { getAllPayrollRuns, PayrollRun, institutions } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';


const statusMap = {
    completed: { text: 'مكتمل', variant: 'default' as const },
    pending: { text: 'قيد التنفيذ', variant: 'secondary' as const },
    failed: { text: 'فشل', variant: 'destructive' as const }
};

export default function PayrollPage() {
    const allPayrollRuns = getAllPayrollRuns();
    const [institutionFilter, setInstitutionFilter] = React.useState('all');
    
    const filteredPayrollRuns = allPayrollRuns.filter(run => {
        if (institutionFilter === 'all') return true;
        if (institutionFilter === 'all_employees' && run.institutionId === null) return true;
        return run.institutionId === institutionFilter;
    });

    const lastRun = filteredPayrollRuns.find(r => r.status === 'completed') || allPayrollRuns.find(r => r.status === 'completed');

    const summaryCards = [
        {
            title: 'صافي الرواتب (آخر دورة)',
            amount: `${(lastRun?.totalNet || 0).toLocaleString()} ريال`,
            icon: CircleDollarSign,
            trend: '+2.5% عن الشهر الماضي',
            trendColor: 'text-green-500', 
            trendIcon: TrendingUp,
        },
        {
            title: 'إجمالي الخصومات (آخر دورة)',
            amount: `${(lastRun?.totalDeductions || 0).toLocaleString()} ريال`,
            icon: TrendingDown,
            trend: '+13.6% عن الشهر الماضي',
            trendColor: 'text-destructive',
            trendIcon: TrendingUp,
        },
        {
            title: 'إجمالي الرواتب (آخر دورة)',
            amount: `${(lastRun?.totalGross || 0).toLocaleString()} ريال`,
            icon: Users,
            trend: `لـ ${lastRun?.totalEmployees || 0} موظف`,
            trendColor: 'text-muted-foreground',
            trendIcon: Users,
        }
    ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold text-foreground">
            إدارة الرواتب
          </h1>
          <p className="mt-2 text-muted-foreground">
            معالجة وتتبع مسيرات رواتب الموظفين الشهرية.
          </p>
        </div>
        <Button>
          <PlayCircle className="ml-2 h-4 w-4" />
          بدء مسير رواتب جديد
        </Button>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>سجل مسيرات الرواتب</CardTitle>
              <CardDescription>
                قائمة بمسيرات الرواتب التي تم تنفيذها مؤخراً.
              </CardDescription>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[200px]">
               <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="تصفية حسب المؤسسة" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">كل المسيرات</SelectItem>
                    <SelectItem value="all_employees">جميع الموظفين (مشترك)</SelectItem>
                    {institutions.map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                    ))}
                </SelectContent>
               </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشهر</TableHead>
                <TableHead>الجهة</TableHead>
                <TableHead>تاريخ التنفيذ</TableHead>
                <TableHead>إجمالي الرواتب</TableHead>
                <TableHead>الخصومات</TableHead>
                <TableHead>صافي الرواتب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayrollRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">{run.month}</TableCell>
                  <TableCell>{run.institutionName || 'جميع الموظفين'}</TableCell>
                  <TableCell>{run.runDate}</TableCell>
                  <TableCell>{run.totalGross.toLocaleString()} ريال</TableCell>
                  <TableCell>{run.totalDeductions.toLocaleString()} ريال</TableCell>
                  <TableCell className="font-bold">{run.totalNet.toLocaleString()} ريال</TableCell>
                  <TableCell>
                    <Badge variant={statusMap[run.status].variant}>
                      {statusMap[run.status].text}
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
                            <FileText className="ml-2 h-4 w-4" />
                            <span>عرض التفاصيل</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                             <Download className="ml-2 h-4 w-4" />
                            <span>تحميل التقرير</span>
                          </DropdownMenuItem>
                          {run.status === 'failed' && (
                             <DropdownMenuItem>
                               <RefreshCw className="ml-2 h-4 w-4" />
                               <span>إعادة التشغيل</span>
                             </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {filteredPayrollRuns.length === 0 && (
                <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                        لم يتم العثور على أي مسيرات رواتب تطابق الفلتر.
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
