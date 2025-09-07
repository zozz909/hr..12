'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Users,
  ArrowLeft,
  FileText,
  Eye,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmployeeData {
  name: string;
  fileNumber: string;
  phone: string;
  email?: string;
  nationality: string;
  position?: string;
  institution?: string;
  salary?: number;
  iqamaExpiryDate?: string;
  workPermitExpiryDate?: string;
  contractExpiryDate?: string;
  healthInsuranceExpiryDate?: string;
  lifeCertificateExpiryDate?: string;
  hasErrors?: boolean;
  errorFields?: string[];
  rowIndex?: number;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export default function BulkUploadPage() {
  const { toast } = useToast();

  // Fetch institutions on component mount
  React.useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await fetch('/api/employees/bulk-upload/institutions');
        const result = await response.json();
        if (result.success) {
          setInstitutions(result.data);
        }
      } catch (error) {
        console.error('Error fetching institutions:', error);
      }
    };

    fetchInstitutions();
  }, []);

  const updateEmployeeInstitution = (employeeIndex: number, institutionId: string) => {
    const updatedData = [...parsedData];
    const selectedInstitution = institutions.find(inst => inst.id === institutionId);

    if (institutionId === 'unsponsored') {
      updatedData[employeeIndex] = {
        ...updatedData[employeeIndex],
        institution: 'غير مكفول',
        hasErrors: false,
        errorFields: updatedData[employeeIndex].errorFields?.filter(field => field !== 'المؤسسة / الكفيل') || []
      };
    } else if (selectedInstitution) {
      updatedData[employeeIndex] = {
        ...updatedData[employeeIndex],
        institution: selectedInstitution.name,
        hasErrors: false,
        errorFields: updatedData[employeeIndex].errorFields?.filter(field => field !== 'المؤسسة / الكفيل') || []
      };
    }

    // Update hasErrors status based on remaining errors
    updatedData[employeeIndex].hasErrors = (updatedData[employeeIndex].errorFields?.length || 0) > 0;

    // Remove institution-related validation errors
    const updatedErrors = validationErrors.filter(error =>
      !(error.row === (updatedData[employeeIndex].rowIndex || 0) + 1 && error.field === 'المؤسسة / الكفيل')
    );
    setValidationErrors(updatedErrors);

    setParsedData(updatedData);
    setEditingEmployee(null);

    toast({
      title: "تم تحديث المؤسسة",
      description: `تم تحديث مؤسسة ${updatedData[employeeIndex].name} بنجاح`,
    });
  };
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [parsedData, setParsedData] = React.useState<EmployeeData[]>([]);
  const [validationErrors, setValidationErrors] = React.useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState<any>(null);
  const [showInstructions, setShowInstructions] = React.useState(false);
  const [debugInfo, setDebugInfo] = React.useState<any>(null);
  const [showDebug, setShowDebug] = React.useState(false);
  const [institutions, setInstitutions] = React.useState<{id: string, name: string}[]>([]);
  const [editingEmployee, setEditingEmployee] = React.useState<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'text/plain',
        'text/tab-separated-values'
      ];

      const validExtensions = ['.xlsx', '.xls', '.csv', '.txt'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));

      if (validTypes.includes(selectedFile.type) || validExtensions.includes(fileExtension)) {
        setFile(selectedFile);
        setParsedData([]);
        setValidationErrors([]);
        setUploadResult(null);
      } else {
        toast({
          variant: "destructive",
          title: "نوع ملف غير صحيح",
          description: "يرجى اختيار ملف Excel (.xlsx, .xls), CSV (.csv), أو نصي (.txt)",
        });
      }
    }
  };

  const parseExcelFile = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);

      const response = await fetch('/api/employees/bulk-upload/parse', {
        method: 'POST',
        body: formData,
      });

      setProgress(60);

      const result = await response.json();

      if (result.success) {
        setParsedData(result.data);
        setValidationErrors(result.errors || []);
        setShowPreview(true);
        
        toast({
          title: "تم تحليل الملف بنجاح",
          description: `تم العثور على ${result.data.length} موظف`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطأ في تحليل الملف",
          description: result.error || "فشل في تحليل ملف Excel",
        });
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast({
        variant: "destructive",
        title: "خطأ في تحليل الملف",
        description: "حدث خطأ أثناء تحليل ملف Excel",
      });
    } finally {
      setUploading(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const debugFile = async () => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/employees/bulk-upload/debug', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setDebugInfo(result);
      setShowDebug(true);
    } catch (error) {
      console.error('Debug error:', error);
      toast({
        variant: "destructive",
        title: "خطأ في التشخيص",
        description: "حدث خطأ أثناء تشخيص الملف",
      });
    }
  };

  const uploadEmployees = async () => {
    if (parsedData.length === 0) return;

    // Filter out employees with errors
    const validEmployees = parsedData.filter(emp => !emp.hasErrors);

    if (validEmployees.length === 0) {
      toast({
        variant: "destructive",
        title: "لا يوجد موظفين صحيحين",
        description: "يرجى إصلاح الأخطاء أولاً",
      });
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const response = await fetch('/api/employees/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employees: validEmployees }),
      });

      setProgress(60);

      const result = await response.json();

      if (result.success) {
        setUploadResult(result);
        
        toast({
          title: "تم رفع البيانات بنجاح",
          description: `تم إضافة/تحديث ${result.processed} موظف`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطأ في رفع البيانات",
          description: result.error || "فشل في رفع بيانات الموظفين",
        });
      }
    } catch (error) {
      console.error('Error uploading employees:', error);
      toast({
        variant: "destructive",
        title: "خطأ في رفع البيانات",
        description: "حدث خطأ أثناء رفع بيانات الموظفين",
      });
    } finally {
      setUploading(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const downloadTemplate = (format: 'excel' | 'tsv' = 'excel') => {
    // إنشاء رابط تحميل قالب
    const link = document.createElement('a');
    if (format === 'excel') {
      link.href = '/api/employees/bulk-upload/template';
      link.download = 'employee-template.xlsx';
    } else {
      link.href = '/api/employees/bulk-upload/template-tsv';
      link.download = 'employee-template.txt';
    }
    link.click();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للوحة التحكم
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">رفع بيانات الموظفين</h1>
          <p className="text-muted-foreground">رفع معلومات الموظفين بشكل مجمع من ملف Excel</p>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-500" />
            تعليمات الاستخدام والحقول المطلوبة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Steps */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-blue-800">📋 خطوات الرفع:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li className="text-blue-700">حمل قالب Excel أو استخدم ملفك الخاص</li>
                <li className="text-blue-700">املأ البيانات المطلوبة للموظفين حسب التنسيق المحدد</li>
                <li className="text-blue-700">ارفع الملف وراجع البيانات المحللة</li>
                <li className="text-blue-700">أكد الرفع لحفظ البيانات في النظام</li>
              </ol>
            </div>

            {/* Required Fields */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-red-800">⭐ الحقول المطلوبة (لا يمكن تركها فارغة):</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <strong>اسم الموظف *</strong>
                    <Badge variant="destructive" className="text-xs">مطلوب</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mr-4">مثال: أحمد محمد علي</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <strong>رقم الملف *</strong>
                    <Badge variant="destructive" className="text-xs">مطلوب وفريد</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mr-4">مثال: EMP-001, EMP-2025-001</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <strong>رقم الجوال *</strong>
                    <Badge variant="destructive" className="text-xs">مطلوب</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mr-4">مثال: 0501234567 (يبدأ بـ 05)</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <strong>الجنسية *</strong>
                    <Badge variant="destructive" className="text-xs">مطلوب</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mr-4">مثال: سعودي، مصري، يمني، كويتي</p>
                </div>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-green-800">✅ الحقول الاختيارية:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <strong>البريد الإلكتروني</strong>
                  </div>
                  <p className="text-xs text-gray-600 mr-4">مثال: ahmed@example.com</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <strong>المنصب</strong>
                  </div>
                  <p className="text-xs text-gray-600 mr-4">مثال: مطور برمجيات، محاسب</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <strong>المؤسسة / الكفيل</strong>
                  </div>
                  <p className="text-xs text-gray-600 mr-4">مثال: شركة التقنية المتقدمة</p>
                  <p className="text-xs text-blue-600 mr-4 bg-blue-50 p-1 rounded">
                    💡 اتركه فارغاً أو اكتب "غير مكفول" للموظفين غير المكفولين
                  </p>
                  <p className="text-xs text-green-600 mr-4 bg-green-50 p-1 rounded">
                    ✏️ يمكن تعديل المؤسسة من جدول المعاينة قبل الرفع
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <strong>راتب</strong>
                  </div>
                  <p className="text-xs text-gray-600 mr-4">مثال: 8000 (بالريال السعودي)</p>
                </div>
              </div>
            </div>

            {/* Date Fields */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-yellow-800">📅 التواريخ (تنسيق mm/dd/yyyy):</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <strong className="text-yellow-800">انتهاء الإقامة</strong>
                    <p className="text-xs text-gray-600">مثال: 12/31/2025</p>
                  </div>
                  <div>
                    <strong className="text-yellow-800">انتهاء رخصة العمل</strong>
                    <p className="text-xs text-gray-600">مثال: 06/30/2025</p>
                  </div>
                  <div>
                    <strong className="text-yellow-800">انتهاء العقد</strong>
                    <p className="text-xs text-gray-600">مثال: 12/31/2026</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <strong className="text-yellow-800">انتهاء التأمين الصحي</strong>
                    <p className="text-xs text-gray-600">مثال: 03/15/2025</p>
                  </div>
                  <div>
                    <strong className="text-yellow-800">انتهاء الشهادة الحية</strong>
                    <p className="text-xs text-gray-600">مثال: 09/20/2025</p>
                  </div>
                  <div className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                    <strong>ملاحظة:</strong> استخدم تنسيق mm/dd/yyyy فقط
                  </div>
                </div>
              </div>
            </div>

            {/* Download Template */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-center">📥 تحميل القالب</h3>
              <div className="flex justify-center gap-4 flex-wrap">
                <Button
                  onClick={() => downloadTemplate('excel')}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  تحميل قالب Excel (.xlsx)
                </Button>
                <Button
                  onClick={() => downloadTemplate('tsv')}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-5 w-5" />
                  تحميل قالب نصي (.txt)
                </Button>
                <Button
                  onClick={() => setShowInstructions(true)}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <HelpCircle className="h-5 w-5" />
                  تعليمات مفصلة
                </Button>
              </div>
              <div className="text-center mt-3">
                <p className="text-xs text-gray-600">
                  💡 <strong>نصيحة:</strong> إذا لم يعمل ملف Excel بشكل صحيح، جرب الملف النصي (.txt) ثم افتحه في Excel
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-500" />
            رفع ملف Excel
          </CardTitle>
          <CardDescription>اختر ملف Excel أو CSV يحتوي على بيانات الموظفين</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excel-file" className="text-base font-medium">اختيار الملف</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
                <label htmlFor="excel-file" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-12 w-12 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">انقر لاختيار ملف</span> أو اسحب الملف هنا
                    </div>
                    <div className="text-xs text-gray-500">
                      يدعم: .xlsx, .xls, .csv, .txt (حتى 10 ميجابايت)
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {file && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <FileSpreadsheet className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800">{file.name}</p>
                      <p className="text-sm text-green-600">
                        الحجم: {(file.size / 1024).toFixed(1)} KB |
                        النوع: {file.type.includes('sheet') ? 'Excel' : 'CSV'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    ✅ جاهز للتحليل
                  </Badge>
                </div>
              </div>
            )}

            {progress > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">
                    {uploading ? 'جاري المعالجة...' : 'مكتمل'}
                  </span>
                  <span className="text-sm font-bold text-blue-600">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-blue-600">
                  {progress < 30 && 'بدء المعالجة...'}
                  {progress >= 30 && progress < 60 && 'تحليل البيانات...'}
                  {progress >= 60 && progress < 100 && 'التحقق من صحة البيانات...'}
                  {progress === 100 && 'تم الانتهاء بنجاح!'}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={parseExcelFile}
                disabled={!file || uploading}
                size="lg"
                className="flex items-center gap-2"
              >
                <Eye className="h-5 w-5" />
                {uploading ? 'جاري التحليل...' : 'تحليل ومعاينة البيانات'}
              </Button>

              <Button
                onClick={debugFile}
                disabled={!file || uploading}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <FileText className="h-5 w-5" />
                تشخيص الملف
              </Button>

              {parsedData.length > 0 && validationErrors.length === 0 && (
                <Button
                  onClick={uploadEmployees}
                  disabled={uploading}
                  size="lg"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Upload className="h-5 w-5" />
                  {uploading ? 'جاري الرفع...' : `رفع البيانات (${parsedData.filter(emp => !emp.hasErrors).length} موظف صحيح)`}
                </Button>
              )}

              {validationErrors.length > 0 && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">يرجى إصلاح الأخطاء أولاً</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              أخطاء في البيانات ({validationErrors.length})
            </CardTitle>
            <CardDescription>
              يرجى إصلاح هذه الأخطاء قبل رفع البيانات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div>
                        <strong>الصف {error.row} - {error.field}:</strong>
                        <p className="mt-1">{error.message}</p>
                        {error.value && (
                          <span className="block text-xs mt-1 opacity-75 bg-red-50 p-1 rounded">
                            القيمة الحالية: {error.value}
                          </span>
                        )}
                      </div>
                      {error.field === 'المؤسسة / الكفيل' && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                          مؤسسة غير موجودة
                        </Badge>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>

            {/* Institution errors summary */}
            {validationErrors.some(error => error.field === 'المؤسسة / الكفيل') && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">💡 حل مشاكل المؤسسات:</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• تأكد من كتابة اسم المؤسسة بالضبط كما هو في النظام</li>
                  <li>• يمكنك تعديل المؤسسة من جدول المعاينة أعلاه (زر ✏️)</li>
                  <li>• أو اكتب "غير مكفول" للموظفين غير المكفولين</li>
                  <li>• أو اتركه فارغاً وسيتم تعيينه كـ "غير مكفول" تلقائياً</li>
                </ul>
                <div className="mt-3 p-2 bg-white rounded border">
                  <strong className="text-orange-800">المؤسسات المتاحة في النظام:</strong>
                  <div className="mt-1 text-xs text-gray-600 max-h-20 overflow-y-auto">
                    {institutions.filter(inst => inst.id !== 'unsponsored').map(inst => inst.name).join(' • ')}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {showPreview && parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              معاينة البيانات ({parsedData.length} موظف)
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span>راجع البيانات قبل الرفع النهائي</span>
              {parsedData.some(emp => emp.hasErrors) && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-600 font-medium">
                    {parsedData.filter(emp => emp.hasErrors).length} موظف يحتاج إصلاح
                  </span>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الموظف</TableHead>
                    <TableHead>رقم الملف</TableHead>
                    <TableHead>رقم الجوال</TableHead>
                    <TableHead>الجنسية</TableHead>
                    <TableHead>المنصب</TableHead>
                    <TableHead>المؤسسة</TableHead>
                    <TableHead>الراتب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 10).map((employee, index) => {
                    const hasInstitutionError = employee.hasErrors && employee.errorFields?.includes('المؤسسة / الكفيل');
                    const rowClass = employee.hasErrors ? 'bg-red-50 border-l-4 border-l-red-400' : '';

                    return (
                      <TableRow key={index} className={rowClass}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {employee.hasErrors && (
                              <AlertCircle className="h-4 w-4 text-red-500" title="يحتوي على أخطاء" />
                            )}
                            {employee.name}
                          </div>
                        </TableCell>
                        <TableCell>{employee.fileNumber}</TableCell>
                        <TableCell>{employee.phone}</TableCell>
                        <TableCell>{employee.nationality}</TableCell>
                        <TableCell>{employee.position || '-'}</TableCell>
                        <TableCell className="min-w-[200px]">
                        {editingEmployee === index ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={institutions.find(inst =>
                                inst.name === employee.institution ||
                                (employee.institution === 'غير مكفول' && inst.id === 'unsponsored')
                              )?.id || ''}
                              onValueChange={(value) => updateEmployeeInstitution(index, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="اختر المؤسسة" />
                              </SelectTrigger>
                              <SelectContent>
                                {institutions.map((institution) => (
                                  <SelectItem key={institution.id} value={institution.id}>
                                    {institution.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingEmployee(null)}
                            >
                              إلغاء
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {hasInstitutionError ? (
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                  <Badge variant="destructive" className="bg-red-100 text-red-800">
                                    {employee.institution || 'غير محدد'}
                                  </Badge>
                                  <span className="text-xs text-red-600">غير موجودة</span>
                                </div>
                              ) : employee.institution === 'غير مكفول' ? (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                  غير مكفول
                                </Badge>
                              ) : employee.institution ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                  {employee.institution}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                  غير مكفول
                                </Badge>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingEmployee(index)}
                              className={`h-6 w-6 p-0 ${hasInstitutionError ? 'text-red-600 hover:bg-red-100' : ''}`}
                              title={hasInstitutionError ? 'إصلاح المؤسسة' : 'تعديل المؤسسة'}
                            >
                              {hasInstitutionError ? '🔧' : '✏️'}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                        <TableCell>{employee.salary ? `${employee.salary} ريال` : '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Table Footer Notes */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-50 border-l-4 border-l-red-400 rounded-sm"></div>
                    <span>صفوف بأخطاء (يمكن إصلاحها)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">🔧</span>
                    <span>يحتاج إصلاح المؤسسة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✏️</span>
                    <span>يمكن تعديل المؤسسة</span>
                  </div>
                </div>
                {parsedData.length > 10 && (
                  <div className="mt-2 text-gray-600">
                    <strong>ملاحظة:</strong> يتم عرض أول 10 موظفين فقط. سيتم رفع جميع الموظفين الصحيحين ({parsedData.filter(emp => !emp.hasErrors).length} موظف).
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              نتائج الرفع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{uploadResult.created || 0}</div>
                <div className="text-sm text-green-600">موظف جديد</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{uploadResult.updated || 0}</div>
                <div className="text-sm text-blue-600">موظف محدث</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{uploadResult.errors || 0}</div>
                <div className="text-sm text-red-600">خطأ</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{uploadResult.processed || 0}</div>
                <div className="text-sm text-gray-600">إجمالي معالج</div>
              </div>
            </div>

            {/* Institution Statistics */}
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">📊 إحصائيات الكفالة:</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <div className="text-xl font-bold text-green-700">
                    {parsedData.filter(emp => emp.institution && emp.institution !== 'غير مكفول').length}
                  </div>
                  <div className="text-sm text-green-600">مكفول</div>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <div className="text-xl font-bold text-orange-700">
                    {parsedData.filter(emp => !emp.institution || emp.institution === 'غير مكفول').length}
                  </div>
                  <div className="text-sm text-orange-600">غير مكفول</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-4">
              <Button asChild>
                <Link href="/employees">
                  <Users className="h-4 w-4 mr-2" />
                  عرض الموظفين
                </Link>
              </Button>
              <Button variant="outline" onClick={() => {
                setFile(null);
                setParsedData([]);
                setValidationErrors([]);
                setUploadResult(null);
                setShowPreview(false);
              }}>
                رفع ملف جديد
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              تعليمات مفصلة لرفع ملف Excel
            </DialogTitle>
            <DialogDescription>
              دليل شامل لتنسيق البيانات وتجنب الأخطاء الشائعة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Required Fields Details */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-bold text-red-800 mb-3">🔴 الحقول المطلوبة (يجب ملؤها):</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-red-500 pl-3">
                  <strong>اسم الموظف *</strong>
                  <p className="text-sm text-gray-600">الاسم الكامل للموظف</p>
                  <p className="text-xs bg-white p-2 rounded mt-1">✅ صحيح: أحمد محمد علي الأحمد</p>
                  <p className="text-xs bg-red-100 p-2 rounded mt-1">❌ خطأ: أحمد (اسم غير مكتمل)</p>
                </div>

                <div className="border-l-4 border-red-500 pl-3">
                  <strong>رقم الملف *</strong>
                  <p className="text-sm text-gray-600">رقم فريد لكل موظف</p>
                  <p className="text-xs bg-white p-2 rounded mt-1">✅ صحيح: EMP-001, EMP-2025-001, 12345</p>
                  <p className="text-xs bg-red-100 p-2 rounded mt-1">❌ خطأ: ترك الحقل فارغ أو تكرار الرقم</p>
                </div>

                <div className="border-l-4 border-red-500 pl-3">
                  <strong>رقم الجوال *</strong>
                  <p className="text-sm text-gray-600">رقم الجوال السعودي</p>
                  <p className="text-xs bg-white p-2 rounded mt-1">✅ صحيح: 0501234567, 0559876543</p>
                  <p className="text-xs bg-red-100 p-2 rounded mt-1">❌ خطأ: 501234567 (بدون 0), 966501234567 (مع كود الدولة)</p>
                </div>

                <div className="border-l-4 border-red-500 pl-3">
                  <strong>الجنسية *</strong>
                  <p className="text-sm text-gray-600">جنسية الموظف</p>
                  <p className="text-xs bg-white p-2 rounded mt-1">✅ صحيح: سعودي، مصري، يمني، كويتي، أردني، سوري</p>
                  <p className="text-xs bg-red-100 p-2 rounded mt-1">❌ خطأ: ترك الحقل فارغ</p>
                </div>
              </div>
            </div>

            {/* Date Format Details */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-bold text-yellow-800 mb-3">📅 تنسيق التواريخ (مهم جداً):</h3>
              <div className="space-y-3">
                <div className="bg-yellow-100 p-3 rounded">
                  <strong className="text-yellow-800">التنسيق المطلوب: mm/dd/yyyy</strong>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-green-700">✅ أمثلة صحيحة:</p>
                      <ul className="text-xs space-y-1 mt-1">
                        <li>12/31/2025 (31 ديسمبر 2025)</li>
                        <li>06/15/2025 (15 يونيو 2025)</li>
                        <li>01/01/2026 (1 يناير 2026)</li>
                        <li>09/30/2025 (30 سبتمبر 2025)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-red-700">❌ أمثلة خاطئة:</p>
                      <ul className="text-xs space-y-1 mt-1">
                        <li>31/12/2025 (تنسيق dd/mm/yyyy)</li>
                        <li>2025-12-31 (تنسيق yyyy-mm-dd)</li>
                        <li>31-12-2025 (تنسيق dd-mm-yyyy)</li>
                        <li>ديسمبر 31, 2025 (نص)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <strong>التواريخ المدعومة:</strong>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>انتهاء الإقامة</strong> - تاريخ انتهاء صلاحية الإقامة</li>
                    <li>• <strong>انتهاء رخصة العمل</strong> - تاريخ انتهاء رخصة العمل</li>
                    <li>• <strong>انتهاء العقد</strong> - تاريخ انتهاء عقد العمل</li>
                    <li>• <strong>انتهاء التأمين الصحي</strong> - تاريخ انتهاء التأمين الصحي</li>
                    <li>• <strong>انتهاء الشهادة الحية</strong> - تاريخ انتهاء الشهادة الحية</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Common Errors */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-bold text-orange-800 mb-3">⚠️ الأخطاء الشائعة وكيفية تجنبها:</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">1.</span>
                  <div>
                    <strong>ترك الحقول المطلوبة فارغة</strong>
                    <p className="text-gray-600">تأكد من ملء جميع الحقول المميزة بـ (*)</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">2.</span>
                  <div>
                    <strong>تكرار رقم الملف</strong>
                    <p className="text-gray-600">كل موظف يجب أن يكون له رقم ملف فريد</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">3.</span>
                  <div>
                    <strong>تنسيق رقم الجوال خاطئ</strong>
                    <p className="text-gray-600">يجب أن يبدأ بـ 05 ويكون 10 أرقام بالضبط</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">4.</span>
                  <div>
                    <strong>تنسيق التواريخ خاطئ</strong>
                    <p className="text-gray-600">استخدم mm/dd/yyyy فقط (مثل: 12/31/2025)</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">5.</span>
                  <div>
                    <strong>البريد الإلكتروني غير صحيح</strong>
                    <p className="text-gray-600">يجب أن يحتوي على @ ونطاق صحيح</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-3">💡 نصائح للنجاح:</h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>احفظ الملف بصيغة .xlsx أو .csv للحصول على أفضل النتائج</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>لا تغير أسماء الأعمدة في الصف الأول</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>يمكنك ترك الحقول الاختيارية فارغة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>تأكد من عدم وجود صفوف فارغة بين البيانات</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>يمكن رفع حتى 1000 موظف في المرة الواحدة</span>
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debug Dialog */}
      <Dialog open={showDebug} onOpenChange={setShowDebug}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              تشخيص الملف
            </DialogTitle>
            <DialogDescription>
              معلومات تفصيلية عن بنية الملف المرفوع
            </DialogDescription>
          </DialogHeader>

          {debugInfo && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📄 معلومات الملف:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>اسم الملف: <code>{debugInfo.analysis?.fileName}</code></div>
                  <div>حجم الملف: <code>{(debugInfo.analysis?.fileSize / 1024).toFixed(1)} KB</code></div>
                  <div>نوع الملف: <code>{debugInfo.analysis?.fileType}</code></div>
                  <div>إجمالي الأسطر: <code>{debugInfo.analysis?.totalLines}</code></div>
                </div>
              </div>

              {/* Separator Analysis */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🔍 تحليل الفواصل:</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>فواصل (,): <code>{debugInfo.analysis?.separatorAnalysis?.commas}</code></div>
                  <div>تابات (Tab): <code>{debugInfo.analysis?.separatorAnalysis?.tabs}</code></div>
                  <div>فاصلة منقوطة (;): <code>{debugInfo.analysis?.separatorAnalysis?.semicolons}</code></div>
                </div>
              </div>

              {/* First Few Lines */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📝 أول 5 أسطر من الملف:</h3>
                <div className="space-y-2">
                  {debugInfo.analysis?.firstFiveLines?.map((line: string, index: number) => (
                    <div key={index} className="bg-white p-2 rounded border text-xs font-mono">
                      <strong>السطر {index + 1}:</strong> {line || '(فارغ)'}
                    </div>
                  ))}
                </div>
              </div>

              {/* Parsed Lines */}
              {debugInfo.parsedLines && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">🔧 تحليل الأسطر:</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {debugInfo.parsedLines.map((line: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="font-medium text-sm">السطر {line.lineNumber}:</div>
                        {line.tabSplit && (
                          <div className="text-xs mt-1">
                            <strong>تقسيم بالتاب:</strong> {line.tabSplit.length} عمود
                            <div className="bg-gray-100 p-1 rounded mt-1 font-mono">
                              {line.tabSplit.slice(0, 3).join(' | ')}...
                            </div>
                          </div>
                        )}
                        {line.commaSplit && (
                          <div className="text-xs mt-1">
                            <strong>تقسيم بالفاصلة:</strong> {line.commaSplit.length} عمود
                            <div className="bg-gray-100 p-1 rounded mt-1 font-mono">
                              {line.commaSplit.slice(0, 3).join(' | ')}...
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
