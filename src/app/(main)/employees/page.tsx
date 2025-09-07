
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
import { useDebouncedSearch } from '@/hooks/useDebounce';
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
  Archive,
  Trash2
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

// Helper functions for document status
type DocumentStatus = 'active' | 'expiring_soon' | 'expired';

const getDaysRemaining = (dateStr: string): number => {
  if (!dateStr) return -1;
  const expiryDate = new Date(dateStr);
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

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

  // استخدام debounced search لتجنب استدعاء API مع كل حرف
  const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearch('', 500);
  const [institutionFilter, setInstitutionFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Edit dialog state
  const [editDialog, setEditDialog] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [editPhotoUploading, setEditPhotoUploading] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: '',
    phone: '',
    email: '',
    nationality: '',
    position: '',
    salary: '',
    institutionId: '',
    hireDate: '',
    photoUrl: ''
  });
  const [editLoading, setEditLoading] = React.useState(false);

  // Archive dialog state
  const [archiveDialog, setArchiveDialog] = React.useState(false);
  const [archivingEmployee, setArchivingEmployee] = React.useState<Employee | null>(null);
  const [archiveLoading, setArchiveLoading] = React.useState(false);
  const [archiveReason, setArchiveReason] = React.useState('');

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [deletingEmployee, setDeletingEmployee] = React.useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Add employee dialog state
  const [addDialog, setAddDialog] = React.useState(false);
  const [photoUploading, setPhotoUploading] = React.useState(false);
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

  // Prepare filters for API call - استخدام debouncedSearchTerm بدلاً من searchTerm
  const filters = React.useMemo(() => {
    const result: any = {};
    if (debouncedSearchTerm) result.search = debouncedSearchTerm;
    if (institutionFilter !== 'all') {
      if (institutionFilter === 'none') {
        result.institutionId = 'none'; // For unsponsored employees
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
      const response = await branchApi.getAll({ institutionId });
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

  // Handle photo upload for add employee form
  const handlePhotoUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (max 5MB for images)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "حجم الملف كبير جداً",
          description: "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "نوع ملف غير صحيح",
          description: "يرجى اختيار ملف صورة صالح",
        });
        return;
      }

      try {
        setPhotoUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', 'employee');
        formData.append('entityId', 'temp'); // Temporary ID for new employee

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // Ensure the URL is complete
          const fullUrl = result.data.fileUrl.startsWith('http')
            ? result.data.fileUrl
            : `${window.location.origin}${result.data.fileUrl}`;

          setAddForm(prev => ({ ...prev, photoUrl: fullUrl }));
          toast({
            title: "تم رفع الصورة بنجاح",
            description: "تم رفع صورة الموظف بنجاح",
          });
        } else {
          throw new Error(result.error || 'فشل في رفع الصورة');
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "خطأ في رفع الصورة",
          description: error instanceof Error ? error.message : "حدث خطأ أثناء رفع الصورة",
        });
      } finally {
        setPhotoUploading(false);
      }
    };
    input.click();
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

      // Remove isUnsponsored from the data sent to API and add status
      const { isUnsponsored, ...cleanEmployeeData } = employeeData;
      const finalEmployeeData = {
        ...cleanEmployeeData,
        status: 'active' as const
      };

      const response = await employeeApi.create(finalEmployeeData);

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

  // Handle photo upload for edit employee form
  const handleEditPhotoUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (max 5MB for images)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "حجم الملف كبير جداً",
          description: "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "نوع ملف غير صحيح",
          description: "يرجى اختيار ملف صورة صالح",
        });
        return;
      }

      try {
        setEditPhotoUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', 'employee');
        formData.append('entityId', editingEmployee?.id || 'temp');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // Ensure the URL is complete
          const fullUrl = result.data.fileUrl.startsWith('http')
            ? result.data.fileUrl
            : `${window.location.origin}${result.data.fileUrl}`;

          setEditForm(prev => ({ ...prev, photoUrl: fullUrl }));
          toast({
            title: "تم رفع الصورة بنجاح",
            description: "تم رفع صورة الموظف بنجاح",
          });
        } else {
          throw new Error(result.error || 'فشل في رفع الصورة');
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "خطأ في رفع الصورة",
          description: error instanceof Error ? error.message : "حدث خطأ أثناء رفع الصورة",
        });
      } finally {
        setEditPhotoUploading(false);
      }
    };
    input.click();
  };

  // Handle edit employee
  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({
      name: employee.name || '',
      phone: employee.mobile || '',
      email: employee.email || '',
      nationality: employee.nationality || '',
      position: employee.position || '',
      salary: employee.salary?.toString() || '',
      institutionId: employee.institutionId || 'unsponsored',
      hireDate: employee.hireDate || '',
      photoUrl: employee.photoUrl || ''
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;

    try {
      setEditLoading(true);

      const updateData: any = {};
      if (editForm.name !== editingEmployee.name) updateData.name = editForm.name;
      if (editForm.phone !== editingEmployee.mobile) updateData.mobile = editForm.phone;
      if (editForm.email !== editingEmployee.email) updateData.email = editForm.email;
      if (editForm.nationality !== editingEmployee.nationality) updateData.nationality = editForm.nationality;
      if (editForm.position !== editingEmployee.position) updateData.position = editForm.position;
      if (editForm.salary !== editingEmployee.salary?.toString()) updateData.salary = parseFloat(editForm.salary) || 0;
      const currentInstitutionId = editingEmployee.institutionId || 'unsponsored';
      if (editForm.institutionId !== currentInstitutionId) {
        updateData.institutionId = editForm.institutionId === 'unsponsored' ? null : editForm.institutionId;
      }
      if (editForm.hireDate !== editingEmployee.hireDate) updateData.hireDate = editForm.hireDate;
      if (editForm.photoUrl !== (editingEmployee.photoUrl || '')) updateData.photoUrl = editForm.photoUrl;

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

  // Handle delete employee (hard delete)
  const handleDeleteEmployee = (employee: Employee) => {
    setDeletingEmployee(employee);
    setDeleteDialog(true);
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

      // Use the same API as employee details page
      const response = await fetch(`/api/employees/${archivingEmployee.id}?action=archive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: archiveReason }),
      });

      const result = await response.json();

      if (result.success) {
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
          description: result.error || "حدث خطأ أثناء أرشفة الموظف",
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

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;

    try {
      setDeleteLoading(true);

      const response = await employeeApi.delete(deletingEmployee.id);

      if (response.success) {
        toast({
          title: "تم حذف الموظف",
          description: `تم حذف ${deletingEmployee.name} نهائياً من النظام`,
        });
        setDeleteDialog(false);
        setDeletingEmployee(null);
        refetchEmployees(); // Refresh the employee list
      } else {
        toast({
          title: "خطأ في الحذف",
          description: response.error || "حدث خطأ أثناء حذف الموظف",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الموظف",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
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
          getStatus(emp.iqamaExpiry || ''),
          getStatus(emp.healthInsuranceExpiry || ''),
          getStatus(emp.workPermitExpiry || ''),
          getStatus(emp.healthCertExpiry || ''),
          getStatus(emp.contractExpiry || ''),
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
                              عرض التفاصيل
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditEmployee(emp)}>
                                <Edit className="ml-2 h-4 w-4" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleArchiveEmployee(emp)}>
                                <Archive className="ml-2 h-4 w-4" />
                                أرشفة
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteEmployee(emp)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="ml-2 h-4 w-4" />
                                حذف نهائي
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
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* الصف الأول: الاسم والجنسية */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="flex items-center gap-1">
                  الاسم <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="اسم الموظف الكامل..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nationality" className="flex items-center gap-1">
                  الجنسية <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-nationality"
                  value={editForm.nationality}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nationality: e.target.value }))}
                  placeholder="مثال: سعودي، مصري، يمني..."
                  required
                />
              </div>
            </div>

            {/* الصف الثاني: الجوال والبريد الإلكتروني */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="flex items-center gap-1">
                  رقم الجوال <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="05xxxxxxxx"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@company.com"
                />
              </div>
            </div>

            {/* الصف الثالث: المنصب والراتب */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-position">المنصب</Label>
                <Input
                  id="edit-position"
                  value={editForm.position}
                  onChange={(e) => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="منصب الموظف..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salary">الراتب (ريال سعودي)</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={editForm.salary}
                  onChange={(e) => setEditForm(prev => ({ ...prev, salary: e.target.value }))}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            {/* الصف الرابع: المؤسسة وتاريخ التوظيف */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-institution">المؤسسة / الكفيل</Label>
                <Select
                  value={editForm.institutionId}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, institutionId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المؤسسة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unsponsored">غير مكفول</SelectItem>
                    {institutions.filter(inst => inst.id !== 'unsponsored').map((institution) => (
                      <SelectItem key={institution.id} value={institution.id}>
                        {institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hire-date">تاريخ التوظيف</Label>
                <Input
                  id="edit-hire-date"
                  type="date"
                  value={editForm.hireDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, hireDate: e.target.value }))}
                />
              </div>
            </div>

            {/* صورة الموظف */}
            <div className="space-y-2">
              <Label htmlFor="edit-photoUrl">صورة الموظف (اختياري)</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-photoUrl"
                  type="text"
                  value={editForm.photoUrl}
                  onChange={(e) => setEditForm(prev => ({ ...prev, photoUrl: e.target.value }))}
                  placeholder="رابط الصورة أو اتركه فارغاً"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEditPhotoUpload}
                  disabled={editPhotoUploading}
                >
                  {editPhotoUploading ? "جاري الرفع..." : "رفع صورة"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                يمكنك إدخال رابط الصورة أو رفع صورة من جهازك
              </p>
              {editForm.photoUrl && (
                <div className="mt-2">
                  <img
                    src={editForm.photoUrl}
                    alt="معاينة صورة الموظف"
                    className="w-20 h-20 object-cover rounded-lg border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
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

      {/* Delete Employee Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">حذف الموظف نهائياً</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف الموظف <strong>{deletingEmployee?.name}</strong> نهائياً؟
              <br />
              <span className="text-red-600 font-semibold">تحذير: هذا الإجراء لا يمكن التراجع عنه!</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialog(false);
                setDeletingEmployee(null);
              }}
              disabled={deleteLoading}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteLoading ? "جاري الحذف..." : "حذف نهائي"}
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
                      type="text"
                      value={addForm.photoUrl}
                      onChange={(e) => setAddForm(prev => ({ ...prev, photoUrl: e.target.value }))}
                      placeholder="رابط الصورة أو اتركه فارغاً"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePhotoUpload}
                      disabled={photoUploading}
                    >
                      {photoUploading ? "جاري الرفع..." : "رفع صورة"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    يمكنك إدخال رابط الصورة أو رفع صورة من جهازك
                  </p>
                  {addForm.photoUrl && (
                    <div className="mt-2">
                      <img
                        src={addForm.photoUrl}
                        alt="معاينة صورة الموظف"
                        className="w-20 h-20 object-cover rounded-lg border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
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
