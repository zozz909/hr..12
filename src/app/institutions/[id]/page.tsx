

'use client';
import { notFound } from 'next/navigation';
import { institutionApi, employeeApi, branchApi, subscriptionApi, documentApi } from '@/lib/api-client';
import { Institution, Employee, Branch } from '@/types';
import { getDaysRemaining, DocumentStatus, Subscription } from '@/lib/data';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  AlertCircle,
  FileText,
  Building,
  FileWarning,
  CheckCircle2,
  Edit,
  Trash2,
  Upload,
  MoreHorizontal,
  RefreshCcw,
  PlusCircle,
  ShieldCheck,
  BookUser,
  Building2,
  Icon,
  HelpCircle,
  Eye,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as React from 'react';
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
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

function StatusIcon({ status }: { status: DocumentStatus }) {
  if (status === 'expired') {
    return <FileWarning className="h-5 w-5 text-destructive" />;
  }
  if (status === 'expiring_soon') {
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  }
  return <CheckCircle2 className="h-5 w-5 text-green-500" />;
}

const getStatus = (dateStr: string): DocumentStatus => {
  const days = getDaysRemaining(dateStr);
  if (days <= 0) return 'expired';
  if (days <= 30) return 'expiring_soon';
  return 'active';
};

const analyticsCards = [
    { key: 'totalEmployees', label: 'إجمالي الموظفين', icon: Users },
    { key: 'expiredIqamas', label: 'الإقامات المنتهية', icon: FileWarning },
    { key: 'expiredInsurances', label: 'التأمينات المنتهية', icon: FileWarning },
    { key: 'expiredWorkPermits', label: 'رخص العمل المنتهية', icon: FileWarning },
    { key: 'expiredHealthCerts', label: 'الشهادات الصحية المنتهية', icon: FileWarning },
    { key: 'expiredContracts', label: 'العقود المنتهية', icon: FileWarning },
] as const;


const LucideIcons: { [key: string]: React.ElementType } = {
    ShieldCheck,
    BookUser,
    Users,
    Building2,
    FileText,
    HelpCircle,
};

const iconOptions = [
    { value: 'ShieldCheck', label: 'درع', icon: ShieldCheck },
    { value: 'BookUser', label: 'كتاب ومستخدم', icon: BookUser },
    { value: 'Users', label: 'مستخدمون', icon: Users },
    { value: 'Building2', label: 'مبنى', icon: Building2 },
    { value: 'FileText', label: 'ملف', icon: FileText },
];

function DeleteSubscriptionAlert() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
         <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيؤدي هذا الإجراء إلى حذف الاشتراك بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
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

// Edit Institution Dialog Component
function EditInstitutionDialog({ institution, onSuccess }: {
  institution: Institution;
  onSuccess: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: institution.name,
    crNumber: institution.crNumber,
    crExpiryDate: institution.crExpiryDate,
    address: institution.address || '',
    phone: institution.phone || '',
    email: institution.email || ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const result = await institutionApi.update(institution.id, formData);

      if (result.success) {
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث بيانات المؤسسة بنجاح",
        });
        setOpen(false);
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: result.error || "فشل في تحديث المؤسسة",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشل في تحديث المؤسسة",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="ml-2 h-4 w-4"/>
          تعديل المؤسسة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تعديل بيانات المؤسسة</DialogTitle>
          <DialogDescription>
            قم بتحديث بيانات المؤسسة حسب الحاجة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المؤسسة</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crNumber">رقم السجل التجاري</Label>
              <Input
                id="crNumber"
                value={formData.crNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, crNumber: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crExpiryDate">تاريخ انتهاء السجل التجاري</Label>
              <Input
                id="crExpiryDate"
                type="date"
                value={formData.crExpiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, crExpiryDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
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

// Add Employee Dialog Component
function AddEmployeeDialog({ institutionId, onSuccess }: {
  institutionId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [formData, setFormData] = React.useState({
    name: '',
    mobile: '',
    email: '',
    fileNumber: '',
    nationality: '',
    position: '',
    branchId: '',
    salary: '',
    iqamaNumber: '',
    iqamaExpiry: '',
    workPermitExpiry: '',
    contractExpiry: '',
    healthInsuranceExpiry: '',
    healthCertExpiry: '',
    photoUrl: ''
  });
  const { toast } = useToast();

  // Fetch branches for this institution
  React.useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchApi.getAll({ institutionId });
        if (response.success && response.data) {
          setBranches(response.data);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    if (open) {
      fetchBranches();
    }
  }, [open, institutionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const employeeData = {
        ...formData,
        institutionId,
        branchId: formData.branchId === 'no-branch' ? null : formData.branchId || null,
        salary: parseFloat(formData.salary) || 0
      };

      const result = await employeeApi.create(employeeData);

      if (result.success) {
        toast({
          title: "تم إضافة الموظف بنجاح",
          description: "تم إضافة الموظف الجديد للمؤسسة",
        });
        setOpen(false);
        setFormData({
          name: '',
          mobile: '',
          email: '',
          fileNumber: '',
          nationality: '',
          position: '',
          branchId: '',
          salary: '',
          iqamaNumber: '',
          iqamaExpiry: '',
          workPermitExpiry: '',
          contractExpiry: '',
          healthInsuranceExpiry: '',
          healthCertExpiry: '',
          photoUrl: ''
        });
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
          <PlusCircle className="ml-2 h-4 w-4" />
          إضافة موظف
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة موظف جديد</DialogTitle>
          <DialogDescription>
            أدخل بيانات الموظف الجديد لإضافته للمؤسسة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* الصف الأول: الاسم ورقم الملف */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الموظف *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fileNumber">رقم الملف *</Label>
                <Input
                  id="fileNumber"
                  value={formData.fileNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, fileNumber: e.target.value }))}
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
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  required
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

            {/* الصف الثالث: الجنسية والمنصب */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationality">الجنسية *</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">المنصب</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>
            </div>
            {/* الصف الرابع: الفرع والراتب */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branchId">الفرع</Label>
                <Select value={formData.branchId} onValueChange={(value) => setFormData(prev => ({ ...prev, branchId: value }))}>
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
              <div className="space-y-2">
                <Label htmlFor="salary">الراتب</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                />
              </div>
            </div>

            {/* الصف الخامس: رقم الإقامة وانتهاء الإقامة */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iqamaNumber">رقم الإقامة</Label>
                <Input
                  id="iqamaNumber"
                  value={formData.iqamaNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, iqamaNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iqamaExpiry">انتهاء الإقامة</Label>
                <Input
                  id="iqamaExpiry"
                  type="date"
                  value={formData.iqamaExpiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, iqamaExpiry: e.target.value }))}
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
                  value={formData.workPermitExpiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, workPermitExpiry: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractExpiry">انتهاء العقد</Label>
                <Input
                  id="contractExpiry"
                  type="date"
                  value={formData.contractExpiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractExpiry: e.target.value }))}
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
                  value={formData.healthInsuranceExpiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, healthInsuranceExpiry: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="healthCertExpiry">انتهاء الشهادة الصحية *</Label>
                <Input
                  id="healthCertExpiry"
                  type="date"
                  value={formData.healthCertExpiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, healthCertExpiry: e.target.value }))}
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
                    value={formData.photoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.fileNumber || !formData.mobile || !formData.nationality || !formData.healthCertExpiry}>
              {loading ? "جاري الإضافة..." : "إضافة الموظف"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Subscription Dialog Component
function AddSubscriptionDialog({ institutionId, onSuccess }: {
  institutionId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    icon: 'ShieldCheck',
    expiryDate: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const subscriptionData = {
        institutionId,
        name: formData.name,
        icon: formData.icon,
        expiryDate: formData.expiryDate || undefined
      };

      const response = await subscriptionApi.create(subscriptionData);

      if (response.success) {
        toast({
          title: "تم إضافة الاشتراك بنجاح",
          description: "تم إضافة الاشتراك الجديد للمؤسسة",
        });
        setOpen(false);
        setFormData({
          name: '',
          icon: 'ShieldCheck',
          expiryDate: ''
        });
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: response.error || "فشل في إضافة الاشتراك",
        });
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشل في إضافة الاشتراك",
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
          إضافة اشتراك
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة اشتراك جديد</DialogTitle>
          <DialogDescription>
            أدخل اسم الاشتراك والأيقونة وتاريخ الانتهاء.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sub-name">اسم الاشتراك</Label>
              <Input
                id="sub-name"
                placeholder="مثال: اشتراك قوى"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-icon">الأيقونة</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر أيقونة..." />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-5 w-5" />
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-expiry">تاريخ الانتهاء</Label>
              <Input
                id="sub-expiry"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ الاشتراك"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Upload Document Dialog Component
function UploadDocumentDialog({ institutionId, onSuccess }: {
  institutionId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    documentType: 'license'
  });
  const [file, setFile] = React.useState<File | null>(null);
  const { toast } = useToast();

  const documentTypes = [
    { value: 'license', label: 'رخصة تجارية' },
    { value: 'certificate', label: 'شهادة' },
    { value: 'contract', label: 'عقد' },
    { value: 'other', label: 'أخرى' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى اختيار ملف للرفع",
      });
      return;
    }

    try {
      setLoading(true);

      // First, upload the file
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('entityType', 'institution');
      uploadFormData.append('entityId', institutionId);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload file');
      }

      // Then, save document metadata
      const documentData = {
        entityType: 'institution',
        entityId: institutionId,
        documentType: formData.documentType,
        fileName: formData.name,
        filePath: uploadResult.data.filePath,
        fileUrl: uploadResult.data.fileUrl,
        originalName: uploadResult.data.fileName,
        fileSize: uploadResult.data.fileSize,
        mimeType: uploadResult.data.mimeType
      };

      const response = await documentApi.create(documentData);

      if (response.success) {
        toast({
          title: "تم رفع المستند بنجاح",
          description: "تم رفع المستند وحفظه في سجلات المؤسسة",
        });
        setOpen(false);
        setFormData({
          name: '',
          documentType: 'license'
        });
        setFile(null);
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: response.error || "فشل في حفظ بيانات المستند",
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: error instanceof Error ? error.message : "فشل في رفع المستند",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="ml-2 h-4 w-4" />
          رفع مستند
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>رفع مستند جديد</DialogTitle>
          <DialogDescription>
            اختر ملفًا وقم بتسميته لرفعه إلى سجلات المؤسسة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doc-name">اسم المستند</Label>
              <Input
                id="doc-name"
                placeholder="مثال: الرخصة التجارية"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-type">نوع المستند</Label>
              <Select value={formData.documentType} onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع المستند..." />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-file">الملف</Label>
              <Input
                id="doc-file"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  الملف المختار: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? "جاري الرفع..." : "حفظ ورفع"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete Institution Dialog Component
function DeleteInstitutionDialog({ institution, onSuccess }: {
  institution: Institution;
  onSuccess: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [crNumber, setCrNumber] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    if (crNumber !== institution.crNumber) {
      toast({
        variant: "destructive",
        title: "خطأ في التحقق",
        description: "رقم السجل التجاري غير صحيح",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await institutionApi.delete(institution.id);

      if (result.success) {
        toast({
          title: "تم الحذف نهائياً",
          description: "تم حذف المؤسسة نهائياً من قاعدة البيانات",
        });
        setOpen(false);
        onSuccess();
        // Navigate back to main page
        router.push('/');
      } else {
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: result.error || "فشل في حذف المؤسسة",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشل في حذف المؤسسة",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="ml-2 h-4 w-4"/>
          حذف المؤسسة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">حذف المؤسسة نهائياً</DialogTitle>
          <DialogDescription>
            ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المؤسسة نهائياً من قاعدة البيانات وجميع البيانات المرتبطة بها.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="crNumber" className="text-sm font-medium">
              للتأكيد، اكتب رقم السجل التجاري: <span className="font-bold">{institution.crNumber}</span>
            </Label>
            <Input
              id="crNumber"
              type="text"
              value={crNumber}
              onChange={(e) => setCrNumber(e.target.value)}
              placeholder="أدخل رقم السجل التجاري"
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
            disabled={loading || crNumber !== institution.crNumber}
          >
            {loading ? "جاري الحذف..." : "حذف المؤسسة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { toast } = useToast();
  const router = useRouter();

  // State for data
  const [institution, setInstitution] = React.useState<Institution | null>(null);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<any[]>([]);
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Subscription management state
  const [editingSubscription, setEditingSubscription] = React.useState<any | null>(null);
  const [deletingSubscription, setDeletingSubscription] = React.useState<any | null>(null);

  // Document management state
  const [deletingDocument, setDeletingDocument] = React.useState<any | null>(null);

  // Fetch institution and employees data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch institution details
      const institutionResponse = await institutionApi.getById(id);
      if (!institutionResponse.success || !institutionResponse.data) {
        notFound();
        return;
      }

      // Fetch employees for this institution
      const employeesResponse = await employeeApi.getAll({ institutionId: id });

      // Fetch subscriptions for this institution
      const subscriptionsResponse = await subscriptionApi.getByInstitutionId(id);

      // Fetch documents for this institution
      const documentsResponse = await documentApi.getByEntityId('institution', id);

      setInstitution(institutionResponse.data);
      setEmployees(employeesResponse.success ? employeesResponse.data || [] : []);
      setSubscriptions(subscriptionsResponse.success ? subscriptionsResponse.data || [] : []);
      setDocuments(documentsResponse.success ? documentsResponse.data || [] : []);
    } catch (err) {
      console.error('Error fetching institution data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch data when page becomes visible (user returns from employee detail page)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchData]);

  // Handle subscription deletion
  const handleDeleteSubscription = async (subscription: any) => {
    try {
      const response = await subscriptionApi.delete(subscription.id);

      if (response.success) {
        toast({
          title: "تم الحذف بنجاح",
          description: `تم حذف اشتراك ${subscription.name} بنجاح`,
          variant: "default",
        });
        setDeletingSubscription(null);
        fetchData(); // Refresh data
      } else {
        toast({
          title: "خطأ في الحذف",
          description: response.error || "حدث خطأ أثناء حذف الاشتراك",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الاشتراك",
        variant: "destructive",
      });
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (document: any) => {
    try {
      const response = await documentApi.delete(document.id);

      if (response.success) {
        toast({
          title: "تم الحذف بنجاح",
          description: `تم حذف مستند ${document.fileName} بنجاح`,
          variant: "default",
        });
        setDeletingDocument(null);
        fetchData(); // Refresh data
      } else {
        toast({
          title: "خطأ في الحذف",
          description: response.error || "حدث خطأ أثناء حذف المستند",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف المستند",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل بيانات المؤسسة...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !institution) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-destructive">خطأ في تحميل البيانات: {error || 'المؤسسة غير موجودة'}</p>
        </div>
      </div>
    );
  }

  // Calculate analytics from real data
  const analytics = {
    totalEmployees: employees.length,
    expiredIqamas: employees.filter(emp => emp.iqamaExpiry && new Date(emp.iqamaExpiry) < new Date()).length,
    expiredInsurances: employees.filter(emp => emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) < new Date()).length,
    expiredWorkPermits: employees.filter(emp => emp.workPermitExpiry && new Date(emp.workPermitExpiry) < new Date()).length,
    expiredHealthCerts: employees.filter(emp => emp.healthCertExpiry && new Date(emp.healthCertExpiry) < new Date()).length,
    expiredContracts: employees.filter(emp => emp.contractExpiry && new Date(emp.contractExpiry) < new Date()).length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 className="font-headline text-4xl font-bold text-foreground">
            {institution.name}
            </h1>
            <p className="text-muted-foreground mt-2">
            لوحة تحكم مفصلة وأدوات إدارة للمؤسسة.
            </p>
        </div>
        <div className="flex items-center gap-2">
            <EditInstitutionDialog
              institution={institution}
              onSuccess={fetchData}
            />
            <DeleteInstitutionDialog
              institution={institution}
              onSuccess={() => {
                // Navigate to home page after successful delete
                router.push('/');
              }}
            />
        </div>
      </header>

      <section className="mb-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {analyticsCards.map(({key, label, icon: Icon}) => (
             <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{label}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analytics[key]}</div>
                </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">الموظفون</TabsTrigger>
          <TabsTrigger value="details">تفاصيل المؤسسة</TabsTrigger>
          <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
        </TabsList>
        <TabsContent value="employees">
          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <div>
                <CardTitle>قائمة الموظفين</CardTitle>
                <CardDescription>
                  قائمة بجميع الموظفين في {institution.name}.
                </CardDescription>
              </div>
               <AddEmployeeDialog
                institutionId={institution.id}
                onSuccess={fetchData}
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الإقامة</TableHead>
                    <TableHead>التأمين</TableHead>
                    <TableHead>رخصة العمل</TableHead>
                    <TableHead>الشهادة الصحية</TableHead>
                    <TableHead>العقد</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell><StatusIcon status={getStatus(emp.iqamaExpiry)} /></TableCell>
                      <TableCell><StatusIcon status={getStatus(emp.healthInsuranceExpiry)} /></TableCell>
                      <TableCell><StatusIcon status={getStatus(emp.workPermitExpiry)} /></TableCell>
                      <TableCell><StatusIcon status={getStatus(emp.healthCertExpiry)} /></TableCell>
                      <TableCell><StatusIcon status={getStatus(emp.contractExpiry)} /></TableCell>
                      <TableCell className="text-left">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/employees/${emp.id}`}>عرض التفاصيل</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">لم يتم العثور على موظفين لهذه المؤسسة.</TableCell>
                     </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>معلومات المؤسسة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                        <Building className="w-8 h-8 text-primary"/>
                        <div>
                            <p className="text-sm text-muted-foreground">رقم السجل التجاري</p>
                            <p className="font-semibold">{institution.crNumber}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                        <FileText className="w-8 h-8 text-primary"/>
                        <div>
                            <p className="text-sm text-muted-foreground">تاريخ إصدار السجل التجاري</p>
                            <p className="font-semibold">{institution.crIssueDate || 'غير محدد'}</p>
                        </div>
                    </div>
                     <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                </div>
                 <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                        <FileWarning className="w-8 h-8 text-primary"/>
                        <div>
                            <p className="text-sm text-muted-foreground">تاريخ انتهاء السجل التجاري</p>
                            <p className="font-semibold">{institution.crExpiryDate} (متبقي {getDaysRemaining(institution.crExpiryDate)} يوم)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm"><RefreshCcw className="ml-2 h-4 w-4" />تجديد</Button>
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                    </div>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subscriptions">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>اشتراكات المنصات الحكومية</CardTitle>
                        <CardDescription>إدارة الاشتراكات النشطة للمؤسسة.</CardDescription>
                    </div>
                     <AddSubscriptionDialog
                        institutionId={institution.id}
                        onSuccess={fetchData}
                      />
                </CardHeader>
                <CardContent>
                    {subscriptions && subscriptions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {subscriptions.map(sub => {
                                const IconComponent = LucideIcons[sub.icon] || HelpCircle;
                                const daysRemaining = getDaysRemaining(sub.expiryDate);
                                const subStatus = daysRemaining <= 0 ? 'منتهي' : daysRemaining <= 30 ? 'ينتهي قريباً' : 'نشط';
                                const statusColor = daysRemaining <= 0 ? 'destructive' : daysRemaining <= 30 ? 'secondary' : 'default';
                                
                                return (
                                <Card key={sub.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <IconComponent className="h-6 w-6 text-muted-foreground" />
                                                <CardTitle>{sub.name}</CardTitle>
                                            </div>
                                            <Badge variant={statusColor}>{subStatus}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="text-muted-foreground">تاريخ الانتهاء</p>
                                                <p className="font-medium">{sub.expiryDate}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-muted-foreground">الوقت المتبقي</p>
                                                <p className="font-medium">{daysRemaining} يوم</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setEditingSubscription(sub)}
                                            >
                                              <Edit className="h-4 w-4 mr-1" />
                                              تعديل
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setDeletingSubscription(sub)}
                                            >
                                              <Trash2 className="h-4 w-4 mr-1" />
                                              حذف
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )})}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>لا توجد اشتراكات مسجلة لهذه المؤسسة.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="documents">
           <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>المستندات الرسمية</CardTitle>
                    <CardDescription>المستندات المرفوعة لـ {institution.name}</CardDescription>
                </div>
                <UploadDocumentDialog
                  institutionId={institution.id}
                  onSuccess={fetchData}
                />
            </CardHeader>
            <CardContent>
                {documents && documents.length > 0 ? (
                    <ul className="space-y-2">
                        {documents.map(doc => (
                            <li key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <a href={doc.fileUrl} className="hover:underline" target="_blank" rel="noopener noreferrer">
                                      {doc.fileName}
                                    </a>
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                    >
                                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Eye className="h-4 w-4 mr-1" />
                                        عرض
                                      </a>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                    >
                                      <a href={`/api/download/${doc.fileUrl?.startsWith('/') ? doc.fileUrl.substring(1) : doc.fileUrl}`} download={doc.fileName}>
                                        <Download className="h-4 w-4 mr-1" />
                                        تحميل
                                      </a>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setDeletingDocument(doc)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      حذف
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ): (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>لم يتم رفع أي مستندات بعد.</p>
                    </div>
                )}
            </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Subscription Dialog */}
      <AlertDialog open={!!deletingSubscription} onOpenChange={() => setDeletingSubscription(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف اشتراك <strong>{deletingSubscription?.name}</strong>؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSubscription && handleDeleteSubscription(deletingSubscription)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Document Dialog */}
      <AlertDialog open={!!deletingDocument} onOpenChange={() => setDeletingDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف مستند <strong>{deletingDocument?.fileName}</strong>؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه وسيتم حذف الملف نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDocument && handleDeleteDocument(deletingDocument)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Subscription Dialog */}
      {editingSubscription && (
        <EditSubscriptionDialog
          subscription={editingSubscription}
          onSuccess={() => {
            setEditingSubscription(null);
            fetchData();
          }}
          onCancel={() => setEditingSubscription(null)}
        />
      )}
    </div>
  );
}

// Edit Subscription Dialog Component
function EditSubscriptionDialog({
  subscription,
  onSuccess,
  onCancel
}: {
  subscription: any;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: subscription.name || '',
    icon: subscription.icon || 'ShieldCheck',
    expiryDate: subscription.expiryDate || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const updateData = {
        name: formData.name,
        icon: formData.icon,
        expiryDate: formData.expiryDate || undefined
      };

      const response = await subscriptionApi.update(subscription.id, updateData);

      if (response.success) {
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث بيانات الاشتراك بنجاح",
        });
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: response.error || "فشل في تحديث الاشتراك",
        });
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشل في تحديث الاشتراك",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تعديل الاشتراك</DialogTitle>
          <DialogDescription>
            قم بتعديل بيانات اشتراك {subscription.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الاشتراك</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم الاشتراك..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">الأيقونة</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الأيقونة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ShieldCheck">ShieldCheck</SelectItem>
                  <SelectItem value="Building">Building</SelectItem>
                  <SelectItem value="FileText">FileText</SelectItem>
                  <SelectItem value="Users">Users</SelectItem>
                  <SelectItem value="BookUser">BookUser</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">تاريخ الانتهاء (اختياري)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري التحديث..." : "تحديث"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

