'use client';

import { notFound } from 'next/navigation';
import { employeeApi, documentApi } from '@/lib/api-client';
import { Employee, EmployeeDocument } from '@/types';
import Image from 'next/image';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Phone,
  Briefcase,
  BadgeCent,
  FileText,
  HeartPulse,
  ShieldCheck,
  CalendarClock,
  RefreshCcw,
  Upload,
  Edit,
  Archive,
  Trash2,
  Building2,
  MapPin,
  Download,
  Eye,
  Plus,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CalendarOff } from 'lucide-react';

// Helper function to calculate days remaining
function getDaysRemaining(dateString: string): number {
  if (!dateString) return -1;
  const today = new Date();
  const expiryDate = new Date(dateString);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

interface StatusCardProps {
  title: string;
  icon: React.ElementType;
  expiryDate: string;
  idNumber?: string;
  onRenew?: () => void;
}

const StatusCard = ({ title, icon: Icon, expiryDate, idNumber, onRenew }: StatusCardProps) => {
  const daysRemaining = getDaysRemaining(expiryDate);
  const status = daysRemaining <= 0 ? 'منتهية' : daysRemaining <= 30 ? 'تنتهي قريباً' : 'نشطة';
  const statusColor = daysRemaining <= 0 ? 'destructive' : daysRemaining <= 30 ? 'secondary' : 'default';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-muted-foreground" />
                <CardTitle>{title}</CardTitle>
            </div>
             <Badge variant={statusColor}>{status}</Badge>
        </div>
        {idNumber && <CardDescription>{idNumber}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">تاريخ الانتهاء: {expiryDate || 'غير محدد'}</span>
          </div>
          {daysRemaining > 0 && (
            <div className="flex items-center gap-2">
              <CalendarOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">باقي {daysRemaining} يوم</span>
            </div>
          )}
          {onRenew && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onRenew}
            >
              <RefreshCcw className="ml-2 h-4 w-4" />
              تجديد
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { toast } = useToast();
  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [renewLoading, setRenewLoading] = React.useState<string | null>(null);
  const [renewDialog, setRenewDialog] = React.useState<{
    open: boolean;
    documentType: string;
    documentName: string;
  }>({
    open: false,
    documentType: '',
    documentName: ''
  });
  const [renewalPeriod, setRenewalPeriod] = React.useState<string>('');

  // Documents state
  const [documents, setDocuments] = React.useState<EmployeeDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = React.useState(false);
  const [uploadDialog, setUploadDialog] = React.useState(false);
  const [uploadLoading, setUploadLoading] = React.useState(false);
  const [uploadForm, setUploadForm] = React.useState({
    documentType: 'other',
    fileName: '',
    expiryDate: '',
    file: null as File | null
  });

  // Edit employee state
  const [editDialog, setEditDialog] = React.useState(false);
  const [editLoading, setEditLoading] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: '',
    phone: '',
    position: '',
    salary: '',
    institutionId: ''
  });

  // Archive employee state
  const [archiveDialog, setArchiveDialog] = React.useState(false);
  const [archiveLoading, setArchiveLoading] = React.useState(false);
  const [archiveReason, setArchiveReason] = React.useState('');

  // Fetch employee documents
  const fetchDocuments = React.useCallback(async () => {
    if (!id) return;
    try {
      setDocumentsLoading(true);
      const response = await documentApi.getAll({ entityType: 'employee', entityId: id });
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    const fetchEmployee = async () => {
      try {
        console.log('Fetching employee with ID:', id);
        setLoading(true);
        const response = await employeeApi.getById(id);
        console.log('API Response:', response);
        if (response.success && response.data) {
          console.log('Employee data received:', response.data);
          setEmployee(response.data);
          // Fetch documents after employee data is loaded
          fetchDocuments();
        } else {
          console.error('API response not successful or no data:', response);
          notFound();
        }
      } catch (error) {
        console.error('Error fetching employee:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, fetchDocuments]);

  const handleRenew = (documentType: string) => {
    const documentName = getDocumentName(documentType);
    setRenewDialog({
      open: true,
      documentType,
      documentName
    });
    setRenewalPeriod('');
  };

  const handleRenewConfirm = async () => {
    if (!employee || !renewalPeriod) return;

    try {
      setRenewLoading(renewDialog.documentType);

      // Calculate new expiry date based on selected period
      const today = new Date();
      let newExpiryDate = new Date(today);

      switch (renewalPeriod) {
        case '3months':
          newExpiryDate.setMonth(today.getMonth() + 3);
          break;
        case '6months':
          newExpiryDate.setMonth(today.getMonth() + 6);
          break;
        case '1year':
          newExpiryDate.setFullYear(today.getFullYear() + 1);
          break;
        case '2years':
          newExpiryDate.setFullYear(today.getFullYear() + 2);
          break;
        case '3years':
          newExpiryDate.setFullYear(today.getFullYear() + 3);
          break;
        default:
          return;
      }

      const formattedDate = newExpiryDate.toISOString().split('T')[0];

      // Update the employee record
      const updateData: any = {};
      updateData[renewDialog.documentType] = formattedDate;

      console.log('Updating employee with data:', updateData);
      const response = await employeeApi.update(employee.id, updateData);
      console.log('Update response:', response);

      if (response.success) {
        // Refetch employee data from database to ensure consistency
        const refreshResponse = await employeeApi.getById(employee.id);
        if (refreshResponse.success && refreshResponse.data) {
          setEmployee(refreshResponse.data);
        }

        // Show success message
        toast({
          title: "تم التجديد بنجاح",
          description: `تم تجديد ${renewDialog.documentName} بنجاح حتى ${newExpiryDate.toLocaleDateString('ar-SA')}`,
          variant: "default",
        });

        // Close dialog
        setRenewDialog({ open: false, documentType: '', documentName: '' });
        setRenewalPeriod('');
      } else {
        toast({
          title: "خطأ في التجديد",
          description: "حدث خطأ أثناء التجديد",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error renewing document:', error);
      toast({
        title: "خطأ في التجديد",
        description: "حدث خطأ أثناء التجديد",
        variant: "destructive",
      });
    } finally {
      setRenewLoading(null);
    }
  };

  // Handle document upload
  const handleUploadDocument = async () => {
    if (!employee || !uploadForm.fileName || !uploadForm.file) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة واختيار ملف",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadLoading(true);

      // First, upload the file
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('entityType', 'employee');
      formData.append('entityId', employee.id);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload file');
      }

      // Then, save document metadata
      const documentData: any = {
        entityType: 'employee',
        entityId: employee.id,
        documentType: uploadForm.documentType,
        fileName: uploadForm.fileName,
      };

      // Add optional fields only if they exist
      if (uploadResult.data.filePath) {
        documentData.filePath = uploadResult.data.filePath;
      }
      if (uploadResult.data.fileUrl) {
        documentData.fileUrl = uploadResult.data.fileUrl;
      }
      if (uploadForm.expiryDate) {
        documentData.expiryDate = uploadForm.expiryDate;
      }
      if (uploadResult.data.fileName) {
        documentData.originalName = uploadResult.data.fileName;
      }
      if (uploadResult.data.fileSize) {
        documentData.fileSize = uploadResult.data.fileSize;
      }
      if (uploadResult.data.mimeType) {
        documentData.mimeType = uploadResult.data.mimeType;
      }

      console.log('Document data to be sent:', documentData);
      const response = await documentApi.create(documentData);
      console.log('Document API response:', response);

      if (response.success) {
        toast({
          title: "تم رفع المستند بنجاح",
          description: `تم رفع مستند ${uploadForm.fileName} بنجاح`,
          variant: "default",
        });

        // Reset form and close dialog
        setUploadForm({
          documentType: 'other',
          fileName: '',
          expiryDate: '',
          file: null
        });
        setUploadDialog(false);

        // Refresh documents list
        fetchDocuments();
      } else {
        console.error('Document creation failed:', response);
        let errorMessage = response.error || "حدث خطأ أثناء رفع المستند";

        // If there are validation details, show them
        if (response.details) {
          const detailsText = Object.entries(response.details)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
          errorMessage += `\n\nتفاصيل الخطأ:\n${detailsText}`;
        }

        toast({
          title: "خطأ في رفع المستند",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "خطأ في رفع المستند",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء رفع المستند",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await documentApi.delete(documentId);
      if (response.success) {
        toast({
          title: "تم حذف المستند",
          description: "تم حذف المستند بنجاح",
          variant: "default",
        });
        fetchDocuments();
      } else {
        toast({
          title: "خطأ في حذف المستند",
          description: response.error || "حدث خطأ أثناء حذف المستند",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "خطأ في حذف المستند",
        description: "حدث خطأ أثناء حذف المستند",
        variant: "destructive",
      });
    }
  };

  const getDocumentName = (documentType: string): string => {
    const names: Record<string, string> = {
      'iqamaExpiry': 'الإقامة',
      'workPermitExpiry': 'رخصة العمل',
      'contractExpiry': 'العقد',
      'healthInsuranceExpiry': 'التأمين الصحي',
      'healthCertExpiry': 'الشهادة الصحية'
    };
    return names[documentType] || documentType;
  };

  const getDocumentTypeName = (documentType: string): string => {
    switch (documentType) {
      case 'iqama': return 'الإقامة';
      case 'passport': return 'جواز السفر';
      case 'contract': return 'العقد';
      case 'health_certificate': return 'الشهادة الصحية';
      case 'insurance': return 'التأمين الصحي';
      case 'work_permit': return 'رخصة العمل';
      case 'other': return 'أخرى';
      default: return documentType;
    }
  };

  // Handle edit employee
  const handleEditEmployee = () => {
    if (!employee) return;

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
    if (!employee) return;

    try {
      setEditLoading(true);

      const updateData: any = {};
      if (editForm.name !== employee.name) updateData.name = editForm.name;
      if (editForm.phone !== employee.phone) updateData.phone = editForm.phone;
      if (editForm.position !== employee.position) updateData.position = editForm.position;
      if (editForm.salary !== employee.salary?.toString()) updateData.salary = parseFloat(editForm.salary) || 0;
      if (editForm.institutionId !== employee.institutionId) updateData.institutionId = editForm.institutionId;

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "لا توجد تغييرات",
          description: "لم يتم إجراء أي تغييرات على بيانات الموظف",
          variant: "default",
        });
        setEditDialog(false);
        return;
      }

      const response = await employeeApi.update(employee.id, updateData);

      if (response.success) {
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث بيانات الموظف بنجاح",
          variant: "default",
        });
        setEditDialog(false);

        // Update local employee data
        setEmployee(prev => prev ? { ...prev, ...updateData } : null);
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
  const handleArchiveEmployee = () => {
    setArchiveReason(''); // Reset reason
    setArchiveDialog(true);
  };

  const handleConfirmArchive = async () => {
    if (!employee || !archiveReason) {
      toast({
        title: "سبب الأرشفة مطلوب",
        description: "يرجى اختيار سبب الأرشفة قبل المتابعة",
        variant: "destructive",
      });
      return;
    }

    try {
      setArchiveLoading(true);

      // Use the dedicated archive API
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: archiveReason }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "تم الأرشفة بنجاح",
          description: `تم أرشفة الموظف ${employee.name} بنجاح`,
          variant: "default",
        });
        setArchiveDialog(false);
        setArchiveReason('');

        // Refresh employee data to get updated archive info
        if (id) {
          const updatedEmployee = await employeeApi.getById(id);
          if (updatedEmployee.success) {
            setEmployee(updatedEmployee.data);
          }
        }
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

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'expiring_soon': return 'text-yellow-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDocumentStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'expiring_soon': return 'ينتهي قريباً';
      case 'expired': return 'منتهي';
      default: return status;
    }
  };

  const canPreviewDocument = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['pdf', 'jpg', 'jpeg', 'png', 'txt'].includes(extension || '');
  };

  const getViewUrl = (doc: EmployeeDocument) => {
    if (canPreviewDocument(doc.fileName)) {
      // For previewable files, open directly
      return doc.fileUrl;
    } else {
      // For non-previewable files, force download
      return getDownloadUrl(doc);
    }
  };

  const getDownloadUrl = (doc: EmployeeDocument) => {
    // Remove leading slash from fileUrl if it exists to avoid double slashes
    const cleanFileUrl = doc.fileUrl?.startsWith('/') ? doc.fileUrl.substring(1) : doc.fileUrl;
    return `/api/download/${cleanFileUrl}`;
  };

  // Get archive reason name in Arabic
  const getArchiveReasonName = (reason: string): string => {
    switch (reason) {
      case 'terminated': return 'إنهاء خدمات';
      case 'final_exit': return 'خروج نهائي';
      default: return reason;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  if (!employee) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted">
            {employee.photoUrl ? (
              <Image
                src={employee.photoUrl}
                alt={employee.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{employee.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>رقم الملف: {employee.fileNumber || 'غير محدد'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>{employee.institutionName || 'غير محدد'}</span>
              </div>
              {employee.branchName && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{employee.branchName}</span>
                </div>
              )}
            </div>
            <Badge variant={employee.status === 'active' ? 'default' : 'destructive'} className="mt-2">
              {employee.status === 'active' ? 'نشط' : 'مؤرشف'}
            </Badge>
            {employee.status === 'archived' && employee.archiveReason && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="flex items-center gap-2 text-destructive">
                  <Archive className="h-4 w-4" />
                  <span className="font-medium">سبب الأرشفة: {getArchiveReasonName(employee.archiveReason)}</span>
                </div>
                {employee.archivedAt && (
                  <div className="text-sm text-muted-foreground mt-1">
                    تاريخ الأرشفة: {new Date(employee.archivedAt).toLocaleDateString('ar-SA')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditEmployee}>
            <Edit className="h-4 w-4 mr-2" />
            تعديل
          </Button>
          <Button variant="outline" onClick={handleArchiveEmployee}>
            <Archive className="h-4 w-4 mr-2" />
            أرشفة
          </Button>
        </div>
      </div>

      <Separator />

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              المعلومات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">الجنسية:</span>
              <span>{employee.nationality || 'غير محدد'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الجوال:</span>
              <span>{employee.mobile || 'غير محدد'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">البريد الإلكتروني:</span>
              <span>{employee.email || 'غير محدد'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المنصب:</span>
              <span>{employee.position || 'غير محدد'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الراتب:</span>
              <span>{employee.salary ? `${employee.salary} ريال` : 'غير محدد'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              معلومات العمل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المؤسسة:</span>
              <span>{employee.institutionName || 'غير محدد'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الفرع:</span>
              <span>{employee.branchName || 'بدون فرع'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">تاريخ التوظيف:</span>
              <span>{employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatusCard
          title="الإقامة"
          icon={ShieldCheck}
          expiryDate={employee.iqamaExpiry || ''}
          idNumber={employee.iqamaNumber}
          onRenew={() => handleRenew('iqamaExpiry')}
        />
        <StatusCard
          title="رخصة العمل"
          icon={Briefcase}
          expiryDate={employee.workPermitExpiry || ''}
          onRenew={() => handleRenew('workPermitExpiry')}
        />
        <StatusCard
          title="العقد"
          icon={FileText}
          expiryDate={employee.contractExpiry || ''}
          onRenew={() => handleRenew('contractExpiry')}
        />
        <StatusCard
          title="التأمين الصحي"
          icon={HeartPulse}
          expiryDate={employee.healthInsuranceExpiry || ''}
          onRenew={() => handleRenew('healthInsuranceExpiry')}
        />
        <StatusCard
          title="الشهادة الصحية"
          icon={HeartPulse}
          expiryDate={employee.healthCertExpiry || ''}
          onRenew={() => handleRenew('healthCertExpiry')}
        />
      </div>

      {/* Documents Section */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
              <CardTitle>المستندات</CardTitle>
            </div>
            <Button onClick={() => setUploadDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              رفع مستند
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مستندات مرفوعة</p>
              <p className="text-sm">انقر على "رفع مستند" لإضافة مستندات جديدة</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{doc.fileName}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>النوع: {getDocumentTypeName(doc.documentType)}</span>
                        {doc.expiryDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            ينتهي: {new Date(doc.expiryDate).toLocaleDateString('ar-SA')}
                          </span>
                        )}
                        <span className={getDocumentStatusColor(doc.status)}>
                          {getDocumentStatusText(doc.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.fileUrl && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={getViewUrl(doc)}
                            target={canPreviewDocument(doc.fileName) ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {canPreviewDocument(doc.fileName) ? 'عرض' : 'فتح'}
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={getDownloadUrl(doc)} download={doc.fileName}>
                            <Download className="h-4 w-4 mr-1" />
                            تحميل
                          </a>
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>رفع مستند جديد</DialogTitle>
            <DialogDescription>
              اختر نوع المستند وارفع الملف المطلوب
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">نوع المستند</Label>
              <Select
                value={uploadForm.documentType}
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع المستند..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iqama">الإقامة</SelectItem>
                  <SelectItem value="passport">جواز السفر</SelectItem>
                  <SelectItem value="contract">العقد</SelectItem>
                  <SelectItem value="health_certificate">الشهادة الصحية</SelectItem>
                  <SelectItem value="insurance">التأمين الصحي</SelectItem>
                  <SelectItem value="work_permit">رخصة العمل</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileName">اسم المستند</Label>
              <input
                id="fileName"
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={uploadForm.fileName}
                onChange={(e) => setUploadForm(prev => ({ ...prev, fileName: e.target.value }))}
                placeholder="أدخل اسم المستند..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">تاريخ الانتهاء (اختياري)</Label>
              <input
                id="expiryDate"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={uploadForm.expiryDate}
                onChange={(e) => setUploadForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">الملف</Label>
              <input
                id="file"
                type="file"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUploadDialog(false);
                setUploadForm({
                  documentType: 'other',
                  fileName: '',
                  expiryDate: '',
                  file: null
                });
              }}
              disabled={uploadLoading}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleUploadDocument}
              disabled={!uploadForm.fileName || !uploadForm.file || uploadLoading}
            >
              {uploadLoading ? "جاري الرفع..." : "رفع المستند"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renewal Dialog */}
      <Dialog open={renewDialog.open} onOpenChange={(open) => {
        if (!open) {
          setRenewDialog({ open: false, documentType: '', documentName: '' });
          setRenewalPeriod('');
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تجديد {renewDialog.documentName}</DialogTitle>
            <DialogDescription>
              اختر فترة التجديد المطلوبة لـ {renewDialog.documentName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="renewalPeriod">فترة التجديد</Label>
              <Select value={renewalPeriod} onValueChange={setRenewalPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فترة التجديد..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">3 أشهر</SelectItem>
                  <SelectItem value="6months">6 أشهر</SelectItem>
                  <SelectItem value="1year">سنة واحدة</SelectItem>
                  <SelectItem value="2years">سنتان</SelectItem>
                  <SelectItem value="3years">3 سنوات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRenewDialog({ open: false, documentType: '', documentName: '' });
                setRenewalPeriod('');
              }}
              disabled={renewLoading !== null}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleRenewConfirm}
              disabled={!renewalPeriod || renewLoading !== null}
            >
              {renewLoading === renewDialog.documentType ? "جاري التجديد..." : "تجديد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الموظف</DialogTitle>
            <DialogDescription>
              قم بتعديل البيانات المطلوبة للموظف {employee?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">الاسم</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم الموظف..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">رقم الهاتف</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="رقم الهاتف..."
              />
            </div>
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
              <Label htmlFor="edit-salary">الراتب</Label>
              <Input
                id="edit-salary"
                type="number"
                value={editForm.salary}
                onChange={(e) => setEditForm(prev => ({ ...prev, salary: e.target.value }))}
                placeholder="راتب الموظف..."
              />
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
              أرشفة الموظف <strong>{employee?.name}</strong>
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
                  <SelectItem value="terminated">إنهاء خدمات</SelectItem>
                  <SelectItem value="final_exit">خروج نهائي</SelectItem>
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
    </div>
  );
}
