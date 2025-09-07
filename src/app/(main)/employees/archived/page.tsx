'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmployees, useInstitutions } from '@/hooks/useHRData';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedSearch } from '@/hooks/useDebounce';
import { employeeApi } from '@/lib/api-client';
import { FileUp, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

export default function ArchivedEmployeesPage() {
  const { toast } = useToast();

  // استخدام debounced search لتجنب استدعاء API مع كل حرف
  const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearch('', 500);
  const [institutionFilter, setInstitutionFilter] = React.useState('all');
  const [archiveReasonFilter, setArchiveReasonFilter] = React.useState('all');

  // Prepare filters for API call - استخدام debouncedSearchTerm بدلاً من searchTerm
  const filters = React.useMemo(() => {
    const result: any = { status: 'archived' };
    if (debouncedSearchTerm) result.search = debouncedSearchTerm;
    if (institutionFilter !== 'all') {
      if (institutionFilter === 'none') {
        result.institutionId = 'none';
      } else {
        result.institutionId = institutionFilter;
      }
    }
    return result;
  }, [debouncedSearchTerm, institutionFilter]);

  // Fetch data from APIs
  const {
    employees: allEmployees,
    loading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees
  } = useEmployees(filters);

  const { institutions, loading: institutionsLoading } = useInstitutions();

  // Filter by archive reason on client side
  const employees = React.useMemo(() => {
    if (!allEmployees) return [];
    if (archiveReasonFilter === 'all') return allEmployees;
    return allEmployees.filter(emp => emp.archiveReason === archiveReasonFilter);
  }, [allEmployees, archiveReasonFilter]);

  const reasonTextMap = {
    resignation: 'استقالة',
    termination: 'إنهاء خدمة',
    retirement: 'تقاعد',
    transfer: 'نقل لمؤسسة أخرى',
    contract_end: 'انتهاء العقد',
    medical_leave: 'إجازة مرضية طويلة',
    disciplinary: 'أسباب تأديبية',
    other: 'أخرى',
    terminated: 'إنهاء خدمات', // للتوافق مع البيانات القديمة
    final_exit: 'خروج نهائي', // للتوافق مع البيانات القديمة
  };

  // Handle employee reactivation
  const handleReactivate = async (employeeId: string, employeeName: string) => {
    try {
      const response = await employeeApi.update(employeeId, {
        status: 'active'
      });

      if (response.success) {
        toast({
          title: "تم إعادة تفعيل الموظف",
          description: `تم إعادة تفعيل ${employeeName} بنجاح`,
        });
        refetchEmployees();
      } else {
        throw new Error(response.error || 'فشل في إعادة تفعيل الموظف');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في إعادة تفعيل الموظف",
        variant: "destructive",
      });
    }
  };

  if (employeesLoading || institutionsLoading) {
    return (
      <div className="p-8">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  if (employeesError) {
    return (
      <div className="p-8">
        <div className="text-center text-red-500">خطأ في تحميل البيانات: {employeesError}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-foreground">
          أرشيف الموظفين
        </h1>
        <p className="text-muted-foreground mt-2">
          قائمة بالموظفين الذين تم إنهاء خدماتهم أو حصلوا على خروج نهائي.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الموظفين المؤرشفين ({employees.length})</CardTitle>
          <CardDescription>
            قائمة بجميع الموظفين الذين تم نقلهم إلى الأرشيف.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث بالاسم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select
              value={institutionFilter}
              onValueChange={setInstitutionFilter}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="تصفية حسب المؤسسة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المؤسسات</SelectItem>
                <SelectItem value="none">غير مكفول</SelectItem>
                {institutions && institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={archiveReasonFilter}
              onValueChange={setArchiveReasonFilter}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="سبب الأرشفة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأسباب</SelectItem>
                <SelectItem value="resignation">استقالة</SelectItem>
                <SelectItem value="termination">إنهاء خدمة</SelectItem>
                <SelectItem value="retirement">تقاعد</SelectItem>
                <SelectItem value="transfer">نقل لمؤسسة أخرى</SelectItem>
                <SelectItem value="contract_end">انتهاء العقد</SelectItem>
                <SelectItem value="medical_leave">إجازة مرضية طويلة</SelectItem>
                <SelectItem value="disciplinary">أسباب تأديبية</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
                <SelectItem value="terminated">إنهاء خدمات</SelectItem>
                <SelectItem value="final_exit">خروج نهائي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>رقم الملف</TableHead>
                <TableHead>المؤسسة السابقة</TableHead>
                <TableHead>سبب الأرشفة</TableHead>
                <TableHead>تاريخ الأرشفة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">
                    <Link href={`/employees/${emp.id}`} className="hover:underline text-blue-600">
                      {emp.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.fileNumber || 'غير محدد'}
                  </TableCell>
                  <TableCell>
                    {emp.institutionName || 'غير مكفول'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">
                      {reasonTextMap[emp.archiveReason || 'terminated']}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.archiveDate ? new Date(emp.archiveDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                  </TableCell>
                  <TableCell className="text-left">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReactivate(emp.id, emp.name)}
                      className="hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                    >
                      <FileUp className="ml-2 h-4 w-4" />
                      إعادة تفعيل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Filter className="h-8 w-8 mb-2" />
                      <p>لم يتم العثور على موظفين مؤرشفين.</p>
                      {(searchTerm || institutionFilter !== 'all' || archiveReasonFilter !== 'all') && (
                        <p className="text-sm">جرب تغيير معايير البحث أو الفلترة.</p>
                      )}
                    </div>
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
