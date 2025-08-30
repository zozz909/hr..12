
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useInstitutions, useEmployees, useUnsponsoredEmployees, useExpiringEmployees } from '@/hooks/useHRData';
import { institutionApi } from '@/lib/api-client';
import Link from 'next/link';
import {
  Building,
  Users,
  FileWarning,
  ArrowLeft,
  Briefcase,
  FileText,
  AlertCircle,
  UserX,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useApiMutation } from '@/hooks/useApi';
import { Separator } from '@/components/ui/separator';
import * as React from 'react';

// Dashboard component with real API data
export default function Dashboard() {
  // Fetch real data from APIs using simplified hooks
  const { institutions, loading: institutionsLoading, refetch: refetchInstitutions } = useInstitutions();
  const { employees, loading: employeesLoading, refetch: refetchEmployees } = useEmployees();
  const { employees: unsponsoredEmployees } = useUnsponsoredEmployees();
  const { employees: expiringEmployees } = useExpiringEmployees(30);

  // Calculate analytics from real data
  const analytics = React.useMemo(() => {
    if (institutionsLoading || employeesLoading) {
      return {
        totalInstitutions: 0,
        totalEmployees: 0,
        unsponsoredEmployees: 0,
        expiringIqamas: 0,
        expiringWorkPermits: 0,
        expiringContracts: 0,
        employeeDistribution: []
      };
    }

    // Count expiring documents by type
    const expiringIqamas = expiringEmployees?.filter(emp =>
      emp.iqamaExpiry && new Date(emp.iqamaExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length || 0;

    const expiringWorkPermits = expiringEmployees?.filter(emp =>
      emp.workPermitExpiry && new Date(emp.workPermitExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length || 0;

    const expiringContracts = expiringEmployees?.filter(emp =>
      emp.contractExpiry && new Date(emp.contractExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length || 0;

    // Create employee distribution chart data
    const employeeDistribution = institutions?.map(institution => ({
      institutionName: institution.name,
      employeeCount: employees?.filter(emp => emp.institutionId === institution.id).length || 0
    })) || [];

    return {
      totalInstitutions: institutions?.length || 0,
      totalEmployees: employees?.length || 0,
      unsponsoredEmployees: unsponsoredEmployees?.length || 0,
      expiringIqamas,
      expiringWorkPermits,
      expiringContracts,
      employeeDistribution
    };
  }, [institutions, employees, unsponsoredEmployees, expiringEmployees, institutionsLoading, employeesLoading]);

  const analyticsCards = [
    {
      label: 'إجمالي المؤسسات',
      value: analytics.totalInstitutions,
      icon: Building,
    },
    { label: 'إجمالي الموظفين', value: analytics.totalEmployees, icon: Users },
    {
      label: 'موظفون غير مكفولين',
      value: analytics.unsponsoredEmployees,
      icon: UserX,
    },
    {
      label: 'إقامات ستنتهي قريباً',
      value: analytics.expiringIqamas,
      icon: FileWarning,
    },
    {
      label: 'رخص عمل ستنتهي قريباً',
      value: analytics.expiringWorkPermits,
      icon: Briefcase,
    },
    {
      label: 'عقود ستنتهي قريباً',
      value: analytics.expiringContracts,
      icon: FileText,
    },
  ];

  const chartData = analytics.employeeDistribution;

  const chartConfig = {
    employeeCount: {
      label: 'عدد الموظفين',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

function AddInstitutionForm({ setOpen, onSuccess }: { setOpen: (open: boolean) => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      crNumber: formData.get('crNumber') as string,
      crExpiryDate: formData.get('crExpiry') as string,
    };

    try {
      const result = await institutionApi.create(data);

      if (result.success) {
        toast({
          title: "تم بنجاح",
          description: "تم إنشاء المؤسسة بنجاح",
        });
        setOpen(false);
        onSuccess(); // Refresh the data
      } else {
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: result.error || "فشل في إنشاء المؤسسة",
        });
      }
    } catch (error) {
      console.error('Error creating institution:', error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: error instanceof Error ? error.message : "فشل في إنشاء المؤسسة",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">اسم المؤسسة</Label>
          <Input id="name" name="name" placeholder="شركة البناة الحديثة" className="col-span-3" required />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="crNumber" className="text-right">رقم السجل</Label>
          <Input id="crNumber" name="crNumber" placeholder="1010123456" className="col-span-3" required />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="crExpiry" className="text-right">انتهاء السجل</Label>
          <Input id="crExpiry" name="crExpiry" type="date" className="col-span-3" required />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </DialogFooter>
    </form>
  );
}


  const [open, setOpen] = React.useState(false);

  const handleInstitutionAdded = () => {
    refetchInstitutions();
    refetchEmployees();
  };

  // Show loading state
  if (institutionsLoading || employeesLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div>
          <h1 className="font-headline text-4xl font-bold text-foreground">
            لوحة التحكم الرئيسية
          </h1>
          <p className="text-muted-foreground mt-2">
            نظرة شاملة على جميع المؤسسات والتحليلات.
          </p>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {analyticsCards.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>توزيع الموظفين على المؤسسات</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{ right: 40, left: 10, top: 10, bottom: 10 }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  className="text-xs"
                  width={200}
                  tick={{
                    width: 200,
                    overflow: 'visible',
                    textAnchor: 'start',
                    dx: 10,
                  }}
                  />
                <XAxis dataKey="employeeCount" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                  />
                <Bar dataKey="employeeCount" fill="var(--color-employeeCount)" radius={5} >
                   <LabelList 
                        dataKey="employeeCount" 
                        position="right" 
                        offset={8} 
                        className="fill-foreground text-xs"
                    />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>تنبيهات هامة</CardTitle>
                <CardDescription>
                  المستندات التي تحتاج إلى اهتمام فوري.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-destructive ml-3"/>
                    <div className="flex-1">
                        <p className="font-medium">إقامات ستنتهي قريباً</p>
                        <p className="text-destructive font-bold text-lg">{analytics.expiringIqamas}</p>
                    </div>
                 </div>
                 <div className="flex items-center">
                    <FileWarning className="h-5 w-5 text-yellow-500 ml-3"/>
                     <div className="flex-1">
                        <p className="font-medium">رخص على وشك الانتهاء</p>
                        <p className="font-bold text-lg">{analytics.expiringWorkPermits}</p>
                    </div>
                 </div>
                 <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-orange-500 ml-3"/>
                     <div className="flex-1">
                        <p className="font-medium">عقود ستنتهي قريباً</p>
                        <p className="font-bold text-lg">{analytics.expiringContracts}</p>
                    </div>
                 </div>
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>الموظفون غير المكفولين</CardTitle>
                    <CardDescription>الموظفون الذين لا ينتمون لأي مؤسسة حالياً.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center">
                        <UserX className="h-5 w-5 text-blue-500 ml-3"/>
                        <div className="flex-1">
                            <p className="font-medium">إجمالي الموظفين غير المكفولين</p>
                            <p className="font-bold text-lg text-blue-600">{analytics.unsponsoredEmployees}</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/employees?unsponsored=true">
                                عرض الكل
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قائمة المؤسسات</CardTitle>
              <CardDescription>
                نظرة سريعة على جميع المؤسسات المسجلة.
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  إضافة مؤسسة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>إضافة مؤسسة جديدة</DialogTitle>
                  <DialogDescription>
                    أدخل تفاصيل المؤسسة الجديدة هنا. انقر على "حفظ" عند الانتهاء.
                  </DialogDescription>
                </DialogHeader>
                <AddInstitutionForm setOpen={setOpen} onSuccess={handleInstitutionAdded} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المؤسسة</TableHead>
                <TableHead>عدد الموظفين</TableHead>
                <TableHead>صلاحية الرخصة التجارية</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutions && institutions.length > 0 ? (
                institutions.map((inst) => {
                  // Calculate days remaining for CR expiry
                  const crExpiryDate = new Date(inst.crExpiryDate);
                  const today = new Date();
                  const daysRemaining = Math.ceil((crExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const progress = Math.max(0, Math.min(100, (daysRemaining / 365) * 100));

                  let status = 'نشطة';
                  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';

                  if (daysRemaining <= 0) {
                    status = 'منتهية';
                    badgeVariant = 'destructive';
                  } else if (daysRemaining <= 30) {
                    status = 'تنتهي قريباً';
                    badgeVariant = 'destructive';
                  }

                  return (
                    <TableRow key={inst.id}>
                      <TableCell className="font-medium">{inst.name}</TableCell>
                      <TableCell>{inst.employeeCount || 0}</TableCell>
                      <TableCell>
                          <div className='flex items-center gap-2'>
                               <Progress value={progress} className="w-32" />
                               <Badge variant={badgeVariant}>{status}</Badge>
                          </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/institutions/${inst.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                            عرض التفاصيل
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    لا توجد مؤسسات مسجلة حالياً
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
