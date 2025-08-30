
'use client';
import * as React from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useInstitutions, useEmployees } from '@/hooks/useHRData';
import { useToast } from '@/hooks/use-toast';
import { employeeApi, branchApi } from '@/lib/api-client';
import { Employee, Branch } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  FileWarning,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  PlusCircle,
  MoreHorizontal,
  Edit,
  Archive
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const getStatus = (dateStr: string): DocumentStatus => {
  const days = getDaysRemaining(dateStr);
  if (days <= 0) return 'expired';
  if (days <= 30) return 'expiring_soon';
  return 'active';
};

function StatusIcon({ status, label }: { status: DocumentStatus; label: string }) {
    let icon;
    let tooltipText = '';

    switch(status) {
        case 'expired':
            icon = <FileWarning className="h-5 w-5 text-destructive" />;
            tooltipText = `${label} - منتهية`;
            break;
        case 'expiring_soon':
            icon = <AlertCircle className="h-5 w-5 text-yellow-500" />;
            tooltipText = `${label} - تنتهي قريباً`;
            break;
        case 'active':
            icon = <CheckCircle2 className="h-5 w-5 text-green-500" />;
            tooltipText = `${label} - نشطة`;
            break;
        default:
            icon = <HelpCircle className="h-5 w-5 text-muted-foreground" />;
            tooltipText = `${label} - حالة غير معروفة`;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span>{icon}</span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

const statusFilters = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'active', label: 'نشطة' },
    { value: 'expiring_soon', label: 'تنتهي قريباً' },
    { value: 'expired', label: 'منتهية' },
] as const;


// Helper function to get document status
const getDocumentStatus = (expiryDate: string | null): 'active' | 'expiring_soon' | 'expired' => {
  if (!expiryDate) return 'active';

  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'expired';
  if (diffDays <= 30) return 'expiring_soon';
  return 'active';
};

export default function AllEmployeesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [institutionFilter, setInstitutionFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Edit dialog state
  const [editDialog, setEditDialog] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [editForm, setEditForm] = React.useState({
    name: '',
    phone: '',
    position: '',
    salary: '',
    institutionId: ''
  });
  const [editLoading, setEditLoading] = React.useState(false);

  // Archive dialog state
  const [archiveDialog, setArchiveDialog] = React.useState(false);
  const [archivingEmployee, setArchivingEmployee] = React.useState<Employee | null>(null);
  const [archiveLoading, setArchiveLoading] = React.useState(false);
  const [archiveReason, setArchiveReason] = React.useState('');

  // Add employee dialog state
  const [addDialog, setAddDialog] = React.useState(false);
  const [addForm, setAddForm] = React.useState({
    name: '',
    mobile: '',
    email: '',
    fileNumber: '',
    nationality: '',
    position: '',
    institutionId: '',
    branchId: '',
    salary: '',
    iqamaNumber: '',
    iqamaExpiry: '',
    workPermitExpiry: '',
    contractExpiry: '',
    healthInsuranceExpiry: '',
    healthCertExpiry: '',
    photoUrl: '',
    isUnsponsored: false
  });
  const [addLoading, setAddLoading] = React.useState(false);
  const [branches, setBranches] = React.useState<Branch[]>([]);

  // Prepare filters for API call
  const filters = React.useMemo(() => {
    const result: any = {};
    if (searchTerm) result.search = searchTerm;
    if (institutionFilter !== 'all') {
      if (institutionFilter === 'none') {
        result.institutionId = 'none'; // For unsponsored employees
      } else {
        result.institutionId = institutionFilter;
      }
    }
    return result;
  }, [searchTerm, institutionFilter]);

  // Fetch data from APIs
  const {
    employees: allEmployees,
    loading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees
  } = useEmployees(filters);

  const { institutions, loading: institutionsLoading } = useInstitutions();

  // Refetch data when page becomes visible (user returns from employee detail page)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetchEmployees();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchEmployees]);

  // Navigation function
  const navigateToEmployee = (employeeId: string) => {
    console.log('Navigating to employee:', employeeId);
    router.push(`/employees/${employeeId}`);
  };

  // Get archive reason name in Arabic
  const getArchiveReasonName = (reason: string): string => {
    switch (reason) {
      case 'resignation': return 'استقالة';
      case 'termination': return 'إنهاء خدمة';
      case 'retirement': return 'تقاعد';
      case 'transfer': return 'نقل لمؤسسة أخرى';
      case 'contract_end': return 'انتهاء العقد';
      case 'medical_leave': return 'إجازة مرضية طويلة';
      case 'disciplinary': return 'أسباب تأديبية';
      case 'other': return 'أخرى';
      default: return reason;
    }
  };

  // Fetch branches when institution is selected
  const fetchBranches = async (institutionId: string) => {
    try {
      const response = await branchApi.getByInstitutionId(institutionId);
      if (response.success) {
        setBranches(response.data || []);
      } else {
        setBranches([]);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    }
  };

  // Handle institution change in add form
  const handleInstitutionChange = (institutionId: string) => {
    const isUnsponsored = institutionId === 'unsponsored';
    setAddForm(prev => ({
      ...prev,
      institutionId: isUnsponsored ? '' : institutionId,
      branchId: '',
      isUnsponsored
    }));

    if (institutionId && !isUnsponsored) {
      fetchBranches(institutionId);
    } else {
      setBranches([]);
    }
  };

  // Handle add employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setAddLoading(true);

      const employeeData = {
        ...addForm,
        institutionId: addForm.isUnsponsored ? null : addForm.institutionId || null,
        branchId: (addForm.branchId === 'no-branch' || addForm.isUnsponsored) ? null : addForm.branchId || null,
        salary: parseFloat(addForm.salary) || 0,
        mobile: addForm.mobile,
        phone: addForm.mobile // For backward compatibility
      };

      // Remove isUnsponsored from the data sent to API
      delete employeeData.isUnsponsored;

      const response = await employeeApi.create(employeeData);

      if (response.success) {
        toast({
          title: "تم إضافة الموظف بنجاح",
          description: `تم إضافة ${addForm.name} إلى النظام`,
        });

        setAddDialog(false);
        setAddForm({
          name: '',
          mobile: '',
          email: '',
          fileNumber: '',
          nationality: '',
          position: '',
          institutionId: '',
          branchId: '',
          salary: '',
          iqamaNumber: '',
          iqamaExpiry: '',
          workPermitExpiry: '',
          contractExpiry: '',
          healthInsuranceExpiry: '',
          healthCertExpiry: '',
          photoUrl: '',
          isUnsponsored: false
        });
        setBranches([]);
        refetchEmployees();
      } else {
        toast({
          variant: "destructive",
          title: "خطأ في إضافة الموظف",
          description: response.error || "حدث خطأ أثناء إضافة الموظف",
        });
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        variant: "destructive",
        title: "خطأ في إضافة الموظف",
        description: "حدث خطأ أثناء إضافة الموظف",
      });
    } finally {
      setAddLoading(false);
    }
  };

  // Handle edit employee
  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({
      name: employee.name || '',
      phone: employee.phone || '',
      position: employee.position || '',
      salary: employee.salary?.toString() || '',
      institutionId: employee.institutionId || ''
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;

    try {
      setEditLoading(true);

      const updateData: any = {};
      if (editForm.name !== editingEmployee.name) updateData.name = editForm.name;
      if (editForm.phone !== editingEmployee.phone) updateData.phone = editForm.phone;
      if (editForm.position !== editingEmployee.position) updateData.position = editForm.position;
      if (editForm.salary !== editingEmployee.salary?.toString()) updateData.salary = parseFloat(editForm.salary) || 0;
      if (editForm.institutionId !== editingEmployee.institutionId) updateData.institutionId = editForm.institutionId;

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "لا توجد تغييرات",
          description: "لم يتم إجراء أي تغييرات على بيانات الموظف",
          variant: "default",
        });
        setEditDialog(false);
        return;
      }

      const response = await employeeApi.update(editingEmployee.id, updateData);

      if (response.success) {
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث بيانات الموظف بنجاح",
          variant: "default",
        });
        setEditDialog(false);
        setEditingEmployee(null);
        refetchEmployees();
      } else {
        toast({
          title: "خطأ في التحديث",
          description: response.error || "حدث خطأ أثناء تحديث بيانات الموظف",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث بيانات الموظف",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Handle archive employee
  const handleArchiveEmployee = (employee: Employee) => {
    setArchivingEmployee(employee);
    setArchiveReason(''); // Reset reason
    setArchiveDialog(true);
  };

  const handleConfirmArchive = async () => {
    if (!archivingEmployee || !archiveReason) {
      toast({
        title: "سبب الأرشفة مطلوب",
        description: "يرجى اختيار سبب الأرشفة قبل المتابعة",
        variant: "destructive",
      });
      return;
    }

    try {
      setArchiveLoading(true);

      const response = await employeeApi.update(archivingEmployee.id, {
        status: 'archived',
        archiveReason: archiveReason,
        archivedAt: new Date().toISOString()
      });

      if (response.success) {
        toast({
          title: "تم الأرشفة بنجاح",
          description: `تم أرشفة الموظف ${archivingEmployee.name} بنجاح`,
          variant: "default",
        });
        setArchiveDialog(false);
        setArchivingEmployee(null);
        setArchiveReason('');
        refetchEmployees();
      } else {
        toast({
          title: "خطأ في الأرشفة",
          description: response.error || "حدث خطأ أثناء أرشفة الموظف",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error archiving employee:', error);
      toast({
        title: "خطأ في الأرشفة",
        description: "حدث خطأ أثناء أرشفة الموظف",
        variant: "destructive",
      });
    } finally {
      setArchiveLoading(false);
    }
  };

  // Filter employees by status
  const filteredEmployees = React.useMemo(() => {
    if (!allEmployees) return [];

    return allEmployees.filter((emp) => {
      if (statusFilter === 'all') return true;

      // Handle employee status (active/archived)
      if (statusFilter === 'active') {
        return emp.status !== 'archived';
      }
      if (statusFilter === 'archived') {
        return emp.status === 'archived';
      }

      // Handle document status (expiring_soon/expired)
      if (statusFilter === 'expiring_soon' || statusFilter === 'expired') {
        const statuses = [
          getDocumentStatus(emp.iqamaExpiry),
          getDocumentStatus(emp.healthInsuranceExpiry),
          getDocumentStatus(emp.workPermitExpiry),
          getDocumentStatus(emp.healthCertExpiry),
          getDocumentStatus(emp.contractExpiry),
        ];
        return statuses.includes(statusFilter as any);
      }

      return true;
    });
  }, [allEmployees, statusFilter]);

  const documents: {key: string, label: string}[] = [
    { key: 'iqamaExpiry', label: 'الإقامة' },
    { key: 'healthInsuranceExpiry', label: 'التأمين' },
    { key: 'workPermitExpiry', label: 'رخصة العمل' },
    { key: 'healthCertExpiry', label: 'الشهادة الصحية' },
    { key: 'contractExpiry', label: 'العقد' },
  ];

  // Show loading state
  if (employeesLoading || institutionsLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل الموظفين...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (employeesError) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-destructive">خطأ في تحميل البيانات: {employeesError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold text-foreground">
            جميع الموظفين
          </h1>
          <p className="text-muted-foreground mt-2">
            عرض وإدارة جميع الموظفين النشطين في النظام.
          </p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <PlusCircle className="ml-2 h-4 w-4" />
          إضافة موظف
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>قائمة الموظفين</CardTitle>
          <CardDescription>
            تصفح وابحث في قائمة جميع الموظفين النشطين.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              placeholder="البحث بالاسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={institutionFilter}
              onValueChange={setInstitutionFilter}
            >
              <SelectTrigger>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="تصفية حسب حالة الوثائق" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map(filter => (
                    <SelectItem key={filter.value} value={filter.value}>{filter.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>المؤسسة</TableHead>
                <TableHead>حالة الوثائق</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees && filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  return (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/employees/${emp.id}`}
                          className="hover:underline"
                          prefetch={false}
                          onClick={(e) => {
                            console.log('Name link clicked for employee:', emp.id);
                            console.log('Navigating to:', `/employees/${emp.id}`);
                          }}
                        >
                          {emp.name}
                        </Link>
                      </TableCell>
                      <TableCell>{emp.institutionName || 'غير مكفول'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                            {documents.map(doc => (
                               <StatusIcon
                                  key={doc.key}
                                  status={getDocumentStatus((emp as any)[doc.key])}
                                  label={doc.label}
                                />
                            ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link
                              href={`/employees/${emp.id}`}
                              prefetch={false}
                              onClick={(e) => {
                                console.log('View button clicked for employee:', emp.id);
                                console.log('Navigating to:', `/employees/${emp.id}`);
                              }}
                            >
                              <Eye className="ml-2 h-4 w-4" />
                              عرض الملف
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToEmployee(emp.id)}
                          >
                            <Eye className="ml-2 h-4 w-4" />
                            تفاصيل
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                               <DropdownMenuItem asChild>
                                 <Link
                                   href={`/employees/${emp.id}`}
                                   prefetch={false}
                                   onClick={(e) => {
                                     console.log('Dropdown link clicked for employee:', emp.id);
                                     console.log('Navigating to:', `/employees/${emp.id}`);
                                   }}
                                 >
                                   <Eye className="ml-2 h-4 w-4" />
                                   عرض التفاصيل
                                 </Link>
                               </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditEmployee(emp)}>
                                <Edit className="ml-2 h-4 w-4" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleArchiveEmployee(emp)}>
                                <Archive className="ml-2 h-4 w-4" />
                                أرشفة
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    لم يتم العثور على موظفين.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الموظف</DialogTitle>
            <DialogDescription>
              قم بتعديل البيانات المطلوبة للموظف {editingEmployee?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم الموظف..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="رقم الهاتف..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">المنصب</Label>
              <Input
                id="position"
                value={editForm.position}
                onChange={(e) => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                placeholder="منصب الموظف..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">الراتب</Label>
              <Input
                id="salary"
                type="number"
                value={editForm.salary}
                onChange={(e) => setEditForm(prev => ({ ...prev, salary: e.target.value }))}
                placeholder="راتب الموظف..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">المؤسسة</Label>
              <Select
                value={editForm.institutionId}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, institutionId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المؤسسة..." />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialog(false)}
              disabled={editLoading}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={editLoading}
            >
              {editLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Employee Dialog */}
      <Dialog open={archiveDialog} onOpenChange={setArchiveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>أرشفة الموظف</DialogTitle>
            <DialogDescription>
              أرشفة الموظف <strong>{archivingEmployee?.name}</strong>
              <br />
              سيتم نقل الموظف إلى قائمة الموظفين المؤرشفين ولن يظهر في القائمة الرئيسية.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="archive-reason">سبب الأرشفة *</Label>
              <Select value={archiveReason} onValueChange={setArchiveReason}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر سبب الأرشفة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resignation">استقالة</SelectItem>
                  <SelectItem value="termination">إنهاء خدمة</SelectItem>
                  <SelectItem value="retirement">تقاعد</SelectItem>
                  <SelectItem value="transfer">نقل لمؤسسة أخرى</SelectItem>
                  <SelectItem value="contract_end">انتهاء العقد</SelectItem>
                  <SelectItem value="medical_leave">إجازة مرضية طويلة</SelectItem>
                  <SelectItem value="disciplinary">أسباب تأديبية</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setArchiveDialog(false);
                setArchiveReason('');
              }}
              disabled={archiveLoading}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleConfirmArchive}
              disabled={archiveLoading || !archiveReason}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {archiveLoading ? "جاري الأرشفة..." : "أرشفة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات الموظف الجديد لإضافته للنظام.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee}>
            <div className="grid gap-4 py-4">
              {/* الصف الأول: الاسم ورقم الملف */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الموظف *</Label>
                  <Input
                    id="name"
                    value={addForm.name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileNumber">رقم الملف *</Label>
                  <Input
                    id="fileNumber"
                    value={addForm.fileNumber}
                    onChange={(e) => setAddForm(prev => ({ ...prev, fileNumber: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* الصف الثاني: الجوال والبريد */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">رقم الجوال *</Label>
                  <Input
                    id="mobile"
                    value={addForm.mobile}
                    onChange={(e) => setAddForm(prev => ({ ...prev, mobile: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              {/* الصف الثالث: الجنسية والمنصب */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality">الجنسية *</Label>
                  <Input
                    id="nationality"
                    value={addForm.nationality}
                    onChange={(e) => setAddForm(prev => ({ ...prev, nationality: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">المنصب</Label>
                  <Input
                    id="position"
                    value={addForm.position}
                    onChange={(e) => setAddForm(prev => ({ ...prev, position: e.target.value }))}
                  />
                </div>
              </div>

              {/* الصف الرابع: المؤسسة والراتب */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="institution">المؤسسة / الكفيل</Label>
                  <Select
                    value={addForm.isUnsponsored ? 'unsponsored' : addForm.institutionId}
                    onValueChange={handleInstitutionChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المؤسسة أو غير مكفول..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unsponsored">غير مكفول</SelectItem>
                      {institutions?.map(institution => (
                        <SelectItem key={institution.id} value={institution.id}>
                          {institution.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">الراتب</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={addForm.salary}
                    onChange={(e) => setAddForm(prev => ({ ...prev, salary: e.target.value }))}
                  />
                </div>
              </div>

              {/* الفرع - يظهر فقط إذا تم اختيار مؤسسة وليس غير مكفول */}
              {!addForm.isUnsponsored && branches.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branchId">الفرع</Label>
                    <Select value={addForm.branchId} onValueChange={(value) => setAddForm(prev => ({ ...prev, branchId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر فرع..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-branch">بدون فرع</SelectItem>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name} ({branch.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* الصف الخامس: رقم الإقامة وانتهاء الإقامة */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="iqamaNumber">رقم الإقامة</Label>
                  <Input
                    id="iqamaNumber"
                    value={addForm.iqamaNumber}
                    onChange={(e) => setAddForm(prev => ({ ...prev, iqamaNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iqamaExpiry">انتهاء الإقامة</Label>
                  <Input
                    id="iqamaExpiry"
                    type="date"
                    value={addForm.iqamaExpiry}
                    onChange={(e) => setAddForm(prev => ({ ...prev, iqamaExpiry: e.target.value }))}
                  />
                </div>
              </div>

              {/* الصف السادس: انتهاء رخصة العمل وانتهاء العقد */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workPermitExpiry">انتهاء رخصة العمل</Label>
                  <Input
                    id="workPermitExpiry"
                    type="date"
                    value={addForm.workPermitExpiry}
                    onChange={(e) => setAddForm(prev => ({ ...prev, workPermitExpiry: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractExpiry">انتهاء العقد</Label>
                  <Input
                    id="contractExpiry"
                    type="date"
                    value={addForm.contractExpiry}
                    onChange={(e) => setAddForm(prev => ({ ...prev, contractExpiry: e.target.value }))}
                  />
                </div>
              </div>

              {/* الصف السابع: انتهاء التأمين الصحي وانتهاء الشهادة الصحية */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="healthInsuranceExpiry">انتهاء التأمين الصحي</Label>
                  <Input
                    id="healthInsuranceExpiry"
                    type="date"
                    value={addForm.healthInsuranceExpiry}
                    onChange={(e) => setAddForm(prev => ({ ...prev, healthInsuranceExpiry: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="healthCertExpiry">انتهاء الشهادة الصحية *</Label>
                  <Input
                    id="healthCertExpiry"
                    type="date"
                    value={addForm.healthCertExpiry}
                    onChange={(e) => setAddForm(prev => ({ ...prev, healthCertExpiry: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* الصف الثامن: صورة الموظف */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="photoUrl">صورة الموظف (اختياري)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="photoUrl"
                      type="url"
                      value={addForm.photoUrl}
                      onChange={(e) => setAddForm(prev => ({ ...prev, photoUrl: e.target.value }))}
                      placeholder="رابط الصورة أو اتركه فارغاً"
                    />
                    <Button type="button" variant="outline" size="sm">
                      رفع صورة
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    يمكنك إدخال رابط الصورة أو رفع صورة من جهازك
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddDialog(false);
                  setAddForm({
                    name: '',
                    mobile: '',
                    email: '',
                    fileNumber: '',
                    nationality: '',
                    position: '',
                    institutionId: '',
                    branchId: '',
                    salary: '',
                    iqamaNumber: '',
                    iqamaExpiry: '',
                    workPermitExpiry: '',
                    contractExpiry: '',
                    healthInsuranceExpiry: '',
                    healthCertExpiry: '',
                    photoUrl: '',
                    isUnsponsored: false
                  });
                  setBranches([]);
                }}
                disabled={addLoading}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={addLoading || !addForm.name || !addForm.fileNumber || !addForm.mobile || !addForm.nationality || !addForm.healthCertExpiry}
              >
                {addLoading ? "جاري الإضافة..." : "إضافة الموظف"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
