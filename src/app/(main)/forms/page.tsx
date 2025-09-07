'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  FileText,
  PlusCircle,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Clock,
  UserCheck,
  TrendingUp,
  CreditCard,
  Receipt,
  Heart,
  Star,
  Gift,
  Users,
  Building,
  FileCheck,
  Search
} from 'lucide-react';
import { formsApi, type AdminForm, type FormStats } from '@/lib/api/forms';
import { cn } from '@/lib/utils';
import { useDebouncedSearch } from '@/hooks/useDebounce';

// Icon mapping for dynamic icons
const iconMap = {
  Calendar,
  DollarSign,
  Clock,
  UserCheck,
  TrendingUp,
  CreditCard,
  Receipt,
  Heart,
  Star,
  Gift,
  Users,
  Building,
  FileCheck,
  FileText
};

export default function FormsPage() {
  const { toast } = useToast();

  // State management
  const [forms, setForms] = React.useState<AdminForm[]>([]);
  const [loading, setLoading] = React.useState(true);

  // استخدام debounced search لتجنب استدعاء API مع كل حرف
  const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearch('', 500);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Dialog states
  const [newFormDialog, setNewFormDialog] = React.useState(false);
  const [editFormDialog, setEditFormDialog] = React.useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = React.useState(false);
  const [uploadDialog, setUploadDialog] = React.useState(false);

  // Form data
  const [newFormData, setNewFormData] = React.useState({
    title: '',
    description: '',
    category: 'general' as 'hr' | 'finance' | 'general',
    iconName: 'FileText',
    iconColor: '#3b82f6',
    isActive: true
  });

  const [newFormFile, setNewFormFile] = React.useState<File | null>(null);

  const [editFormData, setEditFormData] = React.useState<AdminForm | null>(null);
  const [deleteFormId, setDeleteFormId] = React.useState('');
  const [uploadFormId, setUploadFormId] = React.useState('');
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);

      const filters: any = {};
      if (selectedCategory !== 'all') {
        filters.category = selectedCategory;
      }
      if (debouncedSearchTerm) {
        filters.search = debouncedSearchTerm;
      }

      const formsRes = await formsApi.getAll(filters);

      if (formsRes.success) {
        setForms(formsRes.data || []);
      } else {
        toast({
          title: "خطأ في تحميل النماذج",
          description: formsRes.error || "حدث خطأ أثناء تحميل البيانات",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [selectedCategory, debouncedSearchTerm]);

  // Handle create new form
  const handleCreateForm = async () => {
    if (!newFormData.title) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال عنوان النموذج",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Create the form first
      const response = await formsApi.create(newFormData);

      if (response.success) {
        const newForm = response.data;

        // If file is selected, upload it
        if (newFormFile) {
          const uploadResponse = await formsApi.uploadFile(newForm.id, newFormFile);

          if (uploadResponse.success) {
            // Update form with file info
            await formsApi.update(newForm.id, {
              filePath: uploadResponse.data?.filePath,
              fileUrl: uploadResponse.data?.fileUrl,
              fileName: newFormFile.name,
              fileSize: newFormFile.size,
              mimeType: newFormFile.type
            });
          }
        }

        toast({
          title: "تم إنشاء النموذج",
          description: newFormFile
            ? "تم إنشاء النموذج ورفع الملف بنجاح"
            : "تم إنشاء النموذج بنجاح",
        });

        setNewFormDialog(false);
        setNewFormData({
          title: '',
          description: '',
          category: 'general',
          iconName: 'FileText',
          iconColor: '#3b82f6',
          isActive: true
        });
        setNewFormFile(null);

        fetchData();
      } else {
        toast({
          title: "خطأ في إنشاء النموذج",
          description: response.error || "حدث خطأ أثناء إنشاء النموذج",
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "خطأ في إنشاء النموذج",
        description: "حدث خطأ أثناء إنشاء النموذج",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle download form
  const handleDownloadForm = async (form: AdminForm) => {
    if (!form.filePath) {
      toast({
        title: "لا يوجد ملف",
        description: "لم يتم رفع ملف لهذا النموذج بعد",
        variant: "destructive",
      });
      return;
    }

    try {
      await formsApi.download(form.id);

      toast({
        title: "تم تحميل النموذج",
        description: `تم تحميل ${form.title} بنجاح`,
      });

      // Refresh data to update download count
      fetchData();
    } catch (error) {
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل النموذج",
        variant: "destructive",
      });
    }
  };

  // Handle upload file to form
  const handleUploadFile = async () => {
    if (!uploadFile) {
      toast({
        title: "لم يتم اختيار ملف",
        description: "يرجى اختيار ملف للرفع",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Upload file
      const uploadResponse = await formsApi.uploadFile(uploadFormId, uploadFile);

      if (uploadResponse.success) {
        // Update form with file info
        const updateResponse = await formsApi.update(uploadFormId, {
          filePath: uploadResponse.data?.filePath,
          fileUrl: uploadResponse.data?.fileUrl,
          fileName: uploadFile.name,
          fileSize: uploadFile.size,
          mimeType: uploadFile.type
        });

        if (updateResponse.success) {
          toast({
            title: "تم رفع الملف",
            description: "تم رفع ملف النموذج بنجاح",
          });

          setUploadDialog(false);
          setUploadFile(null);
          setUploadFormId('');
          fetchData();
        } else {
          throw new Error(updateResponse.error);
        }
      } else {
        throw new Error(uploadResponse.error);
      }

    } catch (error) {
      toast({
        title: "خطأ في رفع الملف",
        description: "حدث خطأ أثناء رفع الملف",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete form
  const handleDeleteForm = async () => {
    try {
      setSubmitting(true);

      const response = await formsApi.delete(deleteFormId);

      if (response.success) {
        toast({
          title: "تم حذف النموذج",
          description: "تم حذف النموذج بنجاح",
        });

        setDeleteConfirmDialog(false);
        setDeleteFormId('');
        fetchData();
      } else {
        toast({
          title: "خطأ في حذف النموذج",
          description: response.error || "حدث خطأ أثناء حذف النموذج",
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "خطأ في حذف النموذج",
        description: "حدث خطأ أثناء حذف النموذج",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open upload dialog
  const openUploadDialog = (formId: string) => {
    setUploadFormId(formId);
    setUploadDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (formId: string) => {
    setDeleteFormId(formId);
    setDeleteConfirmDialog(true);
  };

  // Get icon component
  const getIconComponent = (iconName?: string) => {
    if (!iconName || !iconMap[iconName as keyof typeof iconMap]) {
      return FileText;
    }
    return iconMap[iconName as keyof typeof iconMap];
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Category mapping
  const categoryMap = {
    hr: { text: 'موارد بشرية', color: 'bg-blue-100 text-blue-800' },
    finance: { text: 'مالية', color: 'bg-green-100 text-green-800' },
    general: { text: 'عامة', color: 'bg-gray-100 text-gray-800' }
  };

  // Filter forms based on search and category
  const filteredForms = forms.filter(form => {
    const matchesSearch = !searchTerm ||
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || form.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">جاري تحميل النماذج...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold text-foreground">
            النماذج الإدارية
          </h1>
          <p className="mt-2 text-muted-foreground">
            إدارة ورفع النماذج الإدارية والمستندات الرسمية مع الأيقونات.
          </p>
        </div>
        <Button onClick={() => setNewFormDialog(true)}>
          <PlusCircle className="ml-2 h-4 w-4" />
          إضافة نموذج جديد
        </Button>
      </header>



      {/* Filters */}
      <section className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث في النماذج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="جميع الفئات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            <SelectItem value="hr">موارد بشرية</SelectItem>
            <SelectItem value="finance">مالية</SelectItem>
            <SelectItem value="general">عامة</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* Forms Grid */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredForms.map((form) => {
          const IconComponent = getIconComponent(form.iconName);

          return (
            <Card key={form.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: form.iconColor ? `${form.iconColor}20` : '#3b82f620'
                      }}
                    >
                      <IconComponent
                        className="h-6 w-6"
                        style={{ color: form.iconColor || '#3b82f6' }}
                      />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{form.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {form.description}
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={categoryMap[form.category].color}>
                          {categoryMap[form.category].text}
                        </Badge>
                        {form.downloadCount && form.downloadCount > 0 && (
                          <Badge variant="outline">
                            {form.downloadCount} تحميل
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="sr-only">فتح القائمة</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => {
                        setEditFormData(form);
                        setEditFormDialog(true);
                      }}>
                        <Edit className="ml-2 h-4 w-4" />
                        <span>تعديل</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openUploadDialog(form.id)}>
                        <Upload className="ml-2 h-4 w-4" />
                        <span>رفع ملف</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(form.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="ml-2 h-4 w-4" />
                        <span>حذف</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {form.fileName && (
                    <div className="text-sm text-muted-foreground">
                      <p>📎 {form.fileName}</p>
                      {form.fileSize && (
                        <p>📏 {formatFileSize(form.fileSize)}</p>
                      )}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => handleDownloadForm(form)}
                    disabled={!form.filePath}
                  >
                    <Download className="ml-2 h-4 w-4" />
                    {form.filePath ? 'تحميل النموذج' : 'لا يوجد ملف'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredForms.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد نماذج</p>
            <p className="text-sm text-muted-foreground">ابدأ بإضافة نموذج جديد</p>
          </div>
        )}
      </section>

      {/* New Form Dialog */}
      <Dialog open={newFormDialog} onOpenChange={setNewFormDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة نموذج إداري جديد</DialogTitle>
            <DialogDescription>
              قم بإنشاء نموذج إداري جديد مع اختيار الأيقونة والفئة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="title">عنوان النموذج</Label>
              <Input
                id="title"
                value={newFormData.title}
                onChange={(e) => setNewFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: طلب إجازة"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={newFormData.description}
                onChange={(e) => setNewFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر للنموذج..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">الفئة</Label>
                <Select
                  value={newFormData.category}
                  onValueChange={(value: 'hr' | 'finance' | 'general') =>
                    setNewFormData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr">موارد بشرية</SelectItem>
                    <SelectItem value="finance">مالية</SelectItem>
                    <SelectItem value="general">عامة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="iconName">الأيقونة</Label>
                <Select
                  value={newFormData.iconName}
                  onValueChange={(value) => setNewFormData(prev => ({ ...prev, iconName: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FileText">ملف نصي</SelectItem>
                    <SelectItem value="Calendar">تقويم</SelectItem>
                    <SelectItem value="DollarSign">مالي</SelectItem>
                    <SelectItem value="Clock">وقت</SelectItem>
                    <SelectItem value="UserCheck">موظف</SelectItem>
                    <SelectItem value="TrendingUp">تقرير</SelectItem>
                    <SelectItem value="CreditCard">بطاقة</SelectItem>
                    <SelectItem value="Receipt">إيصال</SelectItem>
                    <SelectItem value="Heart">صحي</SelectItem>
                    <SelectItem value="Star">تقييم</SelectItem>
                    <SelectItem value="Gift">مكافأة</SelectItem>
                    <SelectItem value="Users">مجموعة</SelectItem>
                    <SelectItem value="Building">مؤسسة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="iconColor">لون الأيقونة</Label>
              <div className="flex gap-2">
                <Input
                  id="iconColor"
                  type="color"
                  value={newFormData.iconColor}
                  onChange={(e) => setNewFormData(prev => ({ ...prev, iconColor: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={newFormData.iconColor}
                  onChange={(e) => setNewFormData(prev => ({ ...prev, iconColor: e.target.value }))}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="grid gap-2">
              <Label htmlFor="newFormFile">ملف النموذج (PDF)</Label>
              <Input
                id="newFormFile"
                type="file"
                accept=".pdf"
                onChange={(e) => setNewFormFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                اختياري - يمكنك رفع الملف لاحقاً. الملفات المدعومة: PDF فقط
              </p>

              {newFormFile && (
                <div className="p-2 border rounded-lg bg-green-50 border-green-200">
                  <p className="text-sm font-medium text-green-800">✅ ملف مختار:</p>
                  <p className="text-xs text-green-600">📎 {newFormFile.name} • {formatFileSize(newFormFile.size)}</p>
                </div>
              )}
            </div>

            {/* Icon Preview */}
            <div className="grid gap-2">
              <Label>معاينة النموذج</Label>
              <div className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${newFormData.iconColor}20` }}
                >
                  {React.createElement(getIconComponent(newFormData.iconName), {
                    className: "h-4 w-4",
                    style: { color: newFormData.iconColor }
                  })}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{newFormData.title || 'عنوان النموذج'}</p>
                  <p className="text-xs text-muted-foreground">
                    {categoryMap[newFormData.category].text}
                    {newFormFile && ` • 📎 ${newFormFile.name}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewFormDialog(false);
              setNewFormData({
                title: '',
                description: '',
                category: 'general',
                iconName: 'FileText',
                iconColor: '#3b82f6',
                isActive: true
              });
              setNewFormFile(null);
            }}>
              إلغاء
            </Button>
            <Button onClick={handleCreateForm} disabled={submitting}>
              {submitting
                ? (newFormFile ? 'جاري الإنشاء ورفع الملف...' : 'جاري الإنشاء...')
                : (newFormFile ? 'إنشاء النموذج ورفع الملف' : 'إنشاء النموذج')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload File Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>رفع ملف النموذج</DialogTitle>
            <DialogDescription>
              اختر ملف النموذج الإداري لرفعه
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">ملف النموذج</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                الملفات المدعومة: PDF فقط
              </p>
            </div>

            {uploadFile && (
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="font-medium">الملف المختار:</p>
                <p className="text-sm text-muted-foreground">📎 {uploadFile.name}</p>
                <p className="text-sm text-muted-foreground">📏 {formatFileSize(uploadFile.size)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUploadFile} disabled={submitting || !uploadFile}>
              {submitting ? 'جاري الرفع...' : 'رفع الملف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا النموذج؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteForm} disabled={submitting}>
              {submitting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
