'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { branchApi, employeeApi, institutionApi } from '@/lib/api-client';
import { useDebouncedSearch } from '@/hooks/useDebounce';
import { Branch, Employee, Institution } from '@/types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  ArrowLeft, 
  Edit, 
  ArrowRightLeft,
  UserCheck,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import Link from 'next/link';

export default function BranchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const branchId = params.id as string;

  const [branch, setBranch] = React.useState<Branch | null>(null);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = React.useState<Employee[]>([]);
  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [loading, setLoading] = React.useState(true);

  // استخدام debounced search لتجنب إعادة تحميل القائمة مع كل حرف
  const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearch('', 300);

  // Fetch data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch branch details
        const branchResponse = await branchApi.getById(branchId);
        if (branchResponse.success && branchResponse.data) {
          setBranch(branchResponse.data);
        }

        // Fetch branch employees
        const employeesResponse = await employeeApi.getAll({ branchId });
        if (employeesResponse.success && employeesResponse.data) {
          setEmployees(employeesResponse.data);
        }

        // Fetch all employees for transfer functionality
        const allEmployeesResponse = await employeeApi.getAll();
        if (allEmployeesResponse.success && allEmployeesResponse.data) {
          setAllEmployees(allEmployeesResponse.data);
        }

        // Fetch institutions
        const institutionsResponse = await institutionApi.getAll();
        if (institutionsResponse.success && institutionsResponse.data) {
          setInstitutions(institutionsResponse.data);
        }

        // Fetch all branches for transfer functionality
        const branchesResponse = await branchApi.getAll();
        if (branchesResponse.success && branchesResponse.data) {
          setBranches(branchesResponse.data.filter(b => b.id !== branchId));
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "فشل في تحميل البيانات",
        });
      } finally {
        setLoading(false);
      }
    };

    if (branchId) {
      fetchData();
    }
  }, [branchId]);

  // Filter employees based on debounced search
  const filteredEmployees = React.useMemo(() => {
    if (!debouncedSearchTerm) return employees;
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      emp.fileNumber?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [employees, debouncedSearchTerm]);

  const refetchData = async () => {
    // Refetch branch employees
    const employeesResponse = await employeeApi.getAll({ branchId });
    if (employeesResponse.success && employeesResponse.data) {
      setEmployees(employeesResponse.data);
    }

    // Refetch all employees
    const allEmployeesResponse = await employeeApi.getAll();
    if (allEmployeesResponse.success && allEmployeesResponse.data) {
      setAllEmployees(allEmployeesResponse.data);
    }

    // Refetch branch details to update employee count
    const branchResponse = await branchApi.getById(branchId);
    if (branchResponse.success && branchResponse.data) {
      setBranch(branchResponse.data);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل تفاصيل الفرع...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">الفرع غير موجود</h1>
          <p className="text-muted-foreground mb-4">لم يتم العثور على الفرع المطلوب</p>
          <Button onClick={() => router.push('/branches')}>
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للفروع
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/branches')}>
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              {branch.name}
            </h1>
            <p className="text-muted-foreground">
              {branch.institutionName || 'فرع مستقل'} • كود: {branch.code}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <EditBranchDialog branch={branch} institutions={institutions} employees={employees} onSuccess={refetchData} />
          <AddEmployeeToBranchDialog 
            branchId={branch.id} 
            branchName={branch.name} 
            availableEmployees={allEmployees.filter(emp => 
              emp.status === 'active' && 
              (!emp.branchId || emp.branchId !== branch.id) &&
              emp.institutionId === branch.institutionId
            )} 
            onSuccess={refetchData} 
          />
        </div>
      </div>

      {/* Branch Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الفرع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">المؤسسة</span>
              </div>
              <p className="font-medium">{branch.institutionName || 'فرع مستقل'}</p>
            </div>
            
            {branch.address && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">العنوان</span>
                </div>
                <p className="font-medium">{branch.address}</p>
              </div>
            )}
            
            {branch.phone && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">الهاتف</span>
                </div>
                <p className="font-medium">{branch.phone}</p>
              </div>
            )}
            
            {branch.email && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">البريد الإلكتروني</span>
                </div>
                <p className="font-medium">{branch.email}</p>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">عدد الموظفين</span>
              </div>
              <p className="text-2xl font-bold">{employees.length}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCheck className="h-4 w-4" />
                <span className="text-sm">المدير</span>
              </div>
              <p className="font-medium">{branch.managerName || 'غير محدد'}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                  {branch.status === 'active' ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>موظفو الفرع ({employees.length})</CardTitle>
              <CardDescription>قائمة بجميع الموظفين في هذا الفرع</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث بالاسم أو رقم الملف أو المنصب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </div>

          {/* Employees Table */}
          {filteredEmployees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>رقم الملف</TableHead>
                  <TableHead>المنصب</TableHead>
                  <TableHead>الراتب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      <Link href={`/employees/${employee.id}`} className="hover:underline text-blue-600">
                        {employee.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.fileNumber || 'غير محدد'}
                    </TableCell>
                    <TableCell>{employee.position || 'غير محدد'}</TableCell>
                    <TableCell>{employee.salary ? `${employee.salary.toLocaleString()} ريال` : 'غير محدد'}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === 'active' ? 'default' : 'destructive'}>
                        {employee.status === 'active' ? 'نشط' : 'مؤرشف'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/employees/${employee.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <TransferEmployeeDialog 
                          employee={employee} 
                          currentBranch={branch}
                          branches={branches} 
                          onSuccess={refetchData} 
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'لا توجد نتائج' : 'لا يوجد موظفون'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'لم يتم العثور على موظفين يطابقون البحث' 
                  : 'لا يوجد موظفون في هذا الفرع حالياً'}
              </p>
              {!searchTerm && (
                <AddEmployeeToBranchDialog 
                  branchId={branch.id} 
                  branchName={branch.name} 
                  availableEmployees={allEmployees.filter(emp => 
                    emp.status === 'active' && 
                    (!emp.branchId || emp.branchId !== branch.id) &&
                    emp.institutionId === branch.institutionId
                  )} 
                  onSuccess={refetchData} 
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Edit Branch Dialog Component
function EditBranchDialog({ branch, institutions, employees, onSuccess }: {
  branch: Branch;
  institutions: Institution[];
  employees: Employee[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: branch.name,
    code: branch.code,
    address: branch.address || '',
    phone: branch.phone || '',
    email: branch.email || '',
    managerId: branch.managerId || ''
  });
  const { toast } = useToast();

  const branchEmployees = employees.filter(emp => emp.branchId === branch.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const updateData = {
        ...formData,
        managerId: formData.managerId === 'no-manager' ? null : formData.managerId || null
      };
      const result = await branchApi.update(branch.id, updateData);

      if (result.success) {
        toast({
          title: "تم تحديث الفرع بنجاح",
          description: "تم تحديث بيانات الفرع بنجاح",
        });
        setOpen(false);
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: result.error || "فشل في تحديث الفرع",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشل في تحديث الفرع",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="ml-2 h-4 w-4" />
          تعديل الفرع
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تعديل الفرع</DialogTitle>
          <DialogDescription>
            تحديث بيانات الفرع.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">اسم الفرع</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">كود الفرع</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">العنوان</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">رقم الهاتف</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manager">المدير</Label>
              <Select value={formData.managerId} onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مدير..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-manager">بدون مدير</SelectItem>
                  {branchEmployees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري التحديث..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Employee to Branch Dialog Component
function AddEmployeeToBranchDialog({ branchId, branchName, availableEmployees, onSuccess }: {
  branchId: string;
  branchName: string;
  availableEmployees: Employee[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState('');
  const { toast } = useToast();

  const handleAddEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      const result = await employeeApi.update(selectedEmployee, { branchId });

      if (result.success) {
        toast({
          title: "تم إضافة الموظف بنجاح",
          description: `تم إضافة الموظف إلى فرع ${branchName}`,
        });
        setOpen(false);
        setSelectedEmployee('');
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: result.error || "فشل في إضافة الموظف",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشل في إضافة الموظف",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Users className="ml-2 h-4 w-4" />
          إضافة موظف
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة موظف إلى الفرع</DialogTitle>
          <DialogDescription>
            اختر موظف لإضافته إلى فرع {branchName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="employee-select">الموظف</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="اختر موظف..." />
              </SelectTrigger>
              <SelectContent>
                {availableEmployees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex flex-col">
                      <span>{employee.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {employee.fileNumber} • {employee.position || 'غير محدد'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {availableEmployees.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا يوجد موظفون متاحون للإضافة
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleAddEmployee} disabled={loading || !selectedEmployee}>
            {loading ? "جاري الإضافة..." : "إضافة الموظف"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Transfer Employee Dialog Component
function TransferEmployeeDialog({ employee, currentBranch, branches, onSuccess }: {
  employee: Employee;
  currentBranch: Branch;
  branches: Branch[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedBranch, setSelectedBranch] = React.useState('');
  const { toast } = useToast();

  // Filter branches to only show those from the same institution
  const availableBranches = branches.filter(branch =>
    branch.institutionId === currentBranch.institutionId &&
    branch.status === 'active'
  );

  const handleTransfer = async () => {
    if (!selectedBranch) return;

    try {
      setLoading(true);
      const targetBranchId = selectedBranch === 'no-branch' ? null : selectedBranch;
      const result = await employeeApi.update(employee.id, { branchId: targetBranchId });

      if (result.success) {
        const targetBranchName = selectedBranch === 'no-branch'
          ? 'بدون فرع'
          : branches.find(b => b.id === selectedBranch)?.name || 'فرع غير معروف';

        toast({
          title: "تم نقل الموظف بنجاح",
          description: `تم نقل ${employee.name} إلى ${targetBranchName}`,
        });
        setOpen(false);
        setSelectedBranch('');
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: result.error || "فشل في نقل الموظف",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشل في نقل الموظف",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>نقل الموظف</DialogTitle>
          <DialogDescription>
            نقل {employee.name} من فرع {currentBranch.name} إلى فرع آخر
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="branch-select">الفرع الجديد</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="اختر فرع..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-branch">بدون فرع</SelectItem>
                {availableBranches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    <div className="flex flex-col">
                      <span>{branch.name}</span>
                      <span className="text-xs text-muted-foreground">
                        كود: {branch.code} • {branch.employeeCount || 0} موظف
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {availableBranches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد فروع أخرى متاحة في نفس المؤسسة
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleTransfer} disabled={loading || !selectedBranch}>
            {loading ? "جاري النقل..." : "نقل الموظف"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
