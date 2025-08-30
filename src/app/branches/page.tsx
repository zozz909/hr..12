'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { branchApi, institutionApi, employeeApi } from '@/lib/api-client';
import { Branch, Institution, Employee } from '@/types';
import { Building2, MapPin, Phone, Mail, Users, PlusCircle, Edit, Trash2, ArrowRightLeft, Eye } from 'lucide-react';
import Link from 'next/link';

export default function BranchesPage() {
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedInstitution, setSelectedInstitution] = React.useState<string>('');
  const { toast } = useToast();

  // Fetch data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch institutions
        const institutionsResponse = await institutionApi.getAll();
        if (institutionsResponse.success && institutionsResponse.data) {
          setInstitutions(institutionsResponse.data);
        }

        // Fetch all employees for transfer functionality
        const employeesResponse = await employeeApi.getAll();
        if (employeesResponse.success && employeesResponse.data) {
          setEmployees(employeesResponse.data);
        }

        // Fetch branches
        await fetchBranches();
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

    fetchData();
  }, []);

  const fetchBranches = async (institutionId?: string) => {
    try {
      const response = await branchApi.getAll(institutionId ? { institutionId } : undefined);
      if (response.success && response.data) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleInstitutionFilter = (institutionId: string) => {
    setSelectedInstitution(institutionId);
    fetchBranches(institutionId === 'all' ? undefined : institutionId);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل الفروع...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الفروع</h1>
          <p className="text-muted-foreground">إدارة فروع المؤسسات ونقل الموظفين</p>
        </div>
        <AddBranchDialog institutions={institutions} onSuccess={() => fetchBranches(selectedInstitution === 'all' ? undefined : selectedInstitution)} />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>الفلاتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="institution-filter">فلترة حسب المؤسسة</Label>
              <Select value={selectedInstitution} onValueChange={handleInstitutionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مؤسسة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفروع</SelectItem>
                  <SelectItem value="independent">الفروع المستقلة</SelectItem>
                  {institutions.map(institution => (
                    <SelectItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <BranchCard 
            key={branch.id} 
            branch={branch} 
            institutions={institutions}
            employees={employees}
            onUpdate={() => fetchBranches(selectedInstitution === 'all' ? undefined : selectedInstitution)}
          />
        ))}
      </div>

      {branches.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد فروع</h3>
            <p className="text-muted-foreground mb-4">
              {selectedInstitution && selectedInstitution !== 'all' 
                ? 'لا توجد فروع لهذه المؤسسة' 
                : 'لم يتم إنشاء أي فروع بعد'}
            </p>
            <AddBranchDialog institutions={institutions} onSuccess={() => fetchBranches(selectedInstitution === 'all' ? undefined : selectedInstitution)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Branch Card Component
function BranchCard({
  branch,
  institutions,
  employees,
  onUpdate
}: {
  branch: Branch;
  institutions: Institution[];
  employees: Employee[];
  onUpdate: () => void;
}) {
  const institution = institutions.find(i => i.id === branch.institutionId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {branch.name}
            </CardTitle>
            <CardDescription>
              {branch.institutionName || 'فرع مستقل'} • كود: {branch.code}
            </CardDescription>
          </div>
          <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
            {branch.status === 'active' ? 'نشط' : 'غير نشط'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Branch Info */}
        <div className="space-y-2 text-sm">
          {branch.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {branch.address}
            </div>
          )}
          {branch.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              {branch.phone}
            </div>
          )}
          {branch.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              {branch.email}
            </div>
          )}
        </div>

        {/* Employee Count */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{branch.employeeCount || 0} موظف</span>
        </div>

        {/* Manager */}
        {branch.managerName && (
          <div className="text-sm">
            <span className="text-muted-foreground">المدير: </span>
            <span className="font-medium">{branch.managerName}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/branches/${branch.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <EditBranchDialog branch={branch} institutions={institutions} employees={employees} onSuccess={onUpdate} />
          <TransferEmployeeDialog branchId={branch.id} branchName={branch.name} employees={employees} onSuccess={onUpdate} />
          <DeleteBranchDialog branch={branch} onSuccess={onUpdate} />
        </div>
      </CardContent>
    </Card>
  );
}

// Add Branch Dialog Component
function AddBranchDialog({ institutions, onSuccess }: { institutions: Institution[]; onSuccess: () => void; }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    institutionId: '',
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    managerId: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const result = await branchApi.create(formData);

      if (result.success) {
        toast({
          title: "تم إنشاء الفرع بنجاح",
          description: "تم إنشاء الفرع الجديد بنجاح",
        });
        setOpen(false);
        setFormData({
          institutionId: '',
          name: '',
          code: '',
          address: '',
          phone: '',
          email: '',
          managerId: ''
        });
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: result.error || "فشل في إنشاء الفرع",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشل في إنشاء الفرع",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="ml-2 h-4 w-4" />
          إضافة فرع
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة فرع جديد</DialogTitle>
          <DialogDescription>
            أدخل بيانات الفرع الجديد.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="institutionId">المؤسسة</Label>
              <Select value={formData.institutionId} onValueChange={(value) => setFormData(prev => ({ ...prev, institutionId: value === 'independent' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مؤسسة أو فرع مستقل..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="independent">فرع مستقل (بدون مؤسسة)</SelectItem>
                  {institutions.map(institution => (
                    <SelectItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الفرع *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">كود الفرع *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.code}>
              {loading ? "جاري الإنشاء..." : "إنشاء الفرع"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
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

// Transfer Employee Dialog Component
function TransferEmployeeDialog({ branchId, branchName, employees, onSuccess }: {
  branchId: string;
  branchName: string;
  employees: Employee[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState('');
  const { toast } = useToast();

  // Get employees not in this branch
  const availableEmployees = employees.filter(emp => emp.branchId !== branchId && emp.status === 'active');

  const handleTransfer = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      const result = await branchApi.transferEmployee(selectedEmployee, branchId);

      if (result.success) {
        toast({
          title: "تم نقل الموظف بنجاح",
          description: `تم نقل الموظف إلى فرع ${branchName}`,
        });
        setOpen(false);
        setSelectedEmployee('');
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
          <DialogTitle>نقل موظف إلى الفرع</DialogTitle>
          <DialogDescription>
            اختر موظف لنقله إلى فرع {branchName}
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
                        {employee.institutionName} {employee.branchName ? `• ${employee.branchName}` : '• بدون فرع'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {availableEmployees.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا يوجد موظفون متاحون للنقل
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleTransfer} disabled={loading || !selectedEmployee}>
            {loading ? "جاري النقل..." : "نقل الموظف"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Branch Dialog Component
function DeleteBranchDialog({ branch, onSuccess }: { branch: Branch; onSuccess: () => void; }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirmText !== branch.code) {
      toast({
        variant: "destructive",
        title: "خطأ في التحقق",
        description: "كود الفرع غير صحيح",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await branchApi.delete(branch.id);

      if (result.success) {
        toast({
          title: "تم حذف الفرع بنجاح",
          description: "تم حذف الفرع وتم نقل جميع الموظفين",
        });
        setOpen(false);
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: result.error || "فشل في حذف الفرع",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشل في حذف الفرع",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">حذف الفرع</DialogTitle>
          <DialogDescription>
            هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الفرع وسيتم نقل جميع الموظفين إلى "بدون فرع".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-code">
              للتأكيد، اكتب كود الفرع: <span className="font-bold">{branch.code}</span>
            </Label>
            <Input
              id="confirm-code"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="أدخل كود الفرع"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmText !== branch.code}
          >
            {loading ? "جاري الحذف..." : "حذف الفرع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
