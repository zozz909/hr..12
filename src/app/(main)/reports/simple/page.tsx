'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileDown, 
  Eye,
  Users, 
  Building2, 
  FileText,
  AlertTriangle,
  DollarSign,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useInstitutions } from '@/hooks/useHRData';
import { useToast } from '@/hooks/use-toast';

// أنواع التقارير المبسطة
const REPORT_TYPES = [
  { id: 'employees', name: 'تقرير الموظفين', icon: Users, description: 'قائمة بجميع الموظفين' },
  { id: 'institutions', name: 'تقرير المؤسسات', icon: Building2, description: 'قائمة بجميع المؤسسات' },
  { id: 'documents', name: 'الوثائق المنتهية', icon: AlertTriangle, description: 'الوثائق المنتهية أو التي تنتهي قريباً' },
  { id: 'payroll', name: 'تقرير الرواتب', icon: DollarSign, description: 'ملخص الرواتب الشهرية' },
  { id: 'leaves', name: 'تقرير الإجازات', icon: FileText, description: 'جميع طلبات الإجازات' },
  { id: 'compensations', name: 'الخصومات والمكافآت', icon: RefreshCw, description: 'جميع الخصومات والمكافآت' },
  { id: 'advances', name: 'تقرير السلف', icon: DollarSign, description: 'جميع طلبات السلف' }
];

export default function SimpleReportsPage() {
  const { toast } = useToast();
  const { institutions } = useInstitutions();
  
  const [selectedReport, setSelectedReport] = React.useState('');
  const [selectedInstitution, setSelectedInstitution] = React.useState('all');
  const [reportData, setReportData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);

  // جلب بيانات التقرير
  const fetchReportData = async () => {
    if (!selectedReport) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار نوع التقرير أولاً',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/reports/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: selectedReport,
          institutionId: selectedInstitution === 'all' ? undefined : selectedInstitution
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data.data || []);
        setShowPreview(true);
        toast({
          title: 'تم تحميل البيانات',
          description: `تم العثور على ${data.data?.length || 0} سجل`
        });
      } else {
        throw new Error('فشل في جلب البيانات');
      }
    } catch (error) {
      toast({
        title: 'خطأ في جلب البيانات',
        description: 'حدث خطأ أثناء جلب بيانات التقرير',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // تصدير التقرير
  const exportReport = async () => {
    if (!reportData.length) {
      toast({
        title: 'لا توجد بيانات',
        description: 'يرجى عرض التقرير أولاً قبل التصدير',
        variant: 'destructive'
      });
      return;
    }

    try {
      const reportType = REPORT_TYPES.find(r => r.id === selectedReport);
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: reportType?.name || selectedReport,
          filters: {
            institution: selectedInstitution === 'all' ? undefined : selectedInstitution
          }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType?.name || selectedReport}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'تم التصدير بنجاح',
          description: 'تم تحميل ملف التقرير'
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ في التصدير',
        description: 'حدث خطأ أثناء تصدير التقرير',
        variant: 'destructive'
      });
    }
  };

  // عرض البيانات حسب نوع التقرير
  const renderReportPreview = () => {
    if (!showPreview || !reportData.length) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>اختر نوع التقرير واضغط "عرض التقرير" لمشاهدة البيانات</p>
        </div>
      );
    }

    switch (selectedReport) {
      case 'employees':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>رقم الملف</TableHead>
                <TableHead>الجوال</TableHead>
                <TableHead>المنصب</TableHead>
                <TableHead>المؤسسة</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.slice(0, 10).map((employee, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.file_number}</TableCell>
                  <TableCell>{employee.mobile}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.institution_name}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                      {employee.status === 'active' ? 'نشط' : 'مؤرشف'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'institutions':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المؤسسة</TableHead>
                <TableHead>رقم السجل التجاري</TableHead>
                <TableHead>عدد الموظفين</TableHead>
                <TableHead>إجمالي الرواتب</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.slice(0, 10).map((institution, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{institution.name}</TableCell>
                  <TableCell>{institution.cr_number}</TableCell>
                  <TableCell>{institution.total_employees}</TableCell>
                  <TableCell>{institution.total_salaries?.toLocaleString()} ريال</TableCell>
                  <TableCell>
                    <Badge variant={institution.status === 'active' ? 'default' : 'secondary'}>
                      {institution.status === 'active' ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'documents':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الموظف</TableHead>
                <TableHead>رقم الملف</TableHead>
                <TableHead>انتهاء الإقامة</TableHead>
                <TableHead>انتهاء تصريح العمل</TableHead>
                <TableHead>انتهاء العقد</TableHead>
                <TableHead>المؤسسة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.slice(0, 10).map((doc, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{doc.employee_name}</TableCell>
                  <TableCell>{doc.file_number}</TableCell>
                  <TableCell>
                    <Badge variant={doc.iqama_status === 'منتهية' ? 'destructive' : 'outline'}>
                      {doc.iqama_expiry ? new Date(doc.iqama_expiry).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={doc.work_permit_status === 'منتهية' ? 'destructive' : 'outline'}>
                      {doc.work_permit_expiry ? new Date(doc.work_permit_expiry).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={doc.contract_status === 'منتهي' ? 'destructive' : 'outline'}>
                      {doc.contract_expiry ? new Date(doc.contract_expiry).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </Badge>
                  </TableCell>
                  <TableCell>{doc.institution_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'leaves':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الموظف</TableHead>
                <TableHead>نوع الإجازة</TableHead>
                <TableHead>تاريخ البداية</TableHead>
                <TableHead>تاريخ النهاية</TableHead>
                <TableHead>عدد الأيام</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المؤسسة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.slice(0, 10).map((leave, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{leave.employee_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {leave.leave_type === 'annual' ? 'سنوية' :
                       leave.leave_type === 'sick' ? 'مرضية' :
                       leave.leave_type === 'emergency' ? 'طارئة' : 'بدون راتب'}
                    </Badge>
                  </TableCell>
                  <TableCell>{leave.start_date ? new Date(leave.start_date).toLocaleDateString('ar-SA') : 'غير محدد'}</TableCell>
                  <TableCell>{leave.end_date ? new Date(leave.end_date).toLocaleDateString('ar-SA') : 'غير محدد'}</TableCell>
                  <TableCell>{leave.days_count || 0} يوم</TableCell>
                  <TableCell>
                    <Badge variant={
                      leave.status === 'approved' ? 'default' :
                      leave.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {leave.status === 'approved' ? 'موافق عليها' :
                       leave.status === 'rejected' ? 'مرفوضة' : 'معلقة'}
                    </Badge>
                  </TableCell>
                  <TableCell>{leave.institution_name || 'غير محدد'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'compensations':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الموظف</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>السبب</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>المؤسسة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.slice(0, 10).map((comp, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{comp.employee_name}</TableCell>
                  <TableCell>
                    <Badge variant={comp.type === 'reward' ? 'default' : 'destructive'}>
                      {comp.type === 'reward' ? 'مكافأة' : 'خصم'}
                    </Badge>
                  </TableCell>
                  <TableCell className={comp.type === 'reward' ? 'text-green-600' : 'text-red-600'}>
                    {comp.type === 'reward' ? '+' : '-'}{comp.amount?.toLocaleString()} ريال
                  </TableCell>
                  <TableCell>{comp.reason}</TableCell>
                  <TableCell>{comp.date ? new Date(comp.date).toLocaleDateString('ar-SA') : 'غير محدد'}</TableCell>
                  <TableCell>{comp.institution_name || 'غير محدد'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'advances':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الموظف</TableHead>
                <TableHead>مبلغ السلفة</TableHead>
                <TableHead>المبلغ المدفوع</TableHead>
                <TableHead>المبلغ المتبقي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الطلب</TableHead>
                <TableHead>المؤسسة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.slice(0, 10).map((advance, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{advance.employee_name}</TableCell>
                  <TableCell>{advance.amount?.toLocaleString()} ريال</TableCell>
                  <TableCell className="text-green-600">{advance.paid_amount?.toLocaleString()} ريال</TableCell>
                  <TableCell className="text-orange-600">{advance.remaining_amount?.toLocaleString()} ريال</TableCell>
                  <TableCell>
                    <Badge variant={
                      advance.status === 'paid' ? 'default' :
                      advance.status === 'approved' ? 'secondary' :
                      advance.status === 'rejected' ? 'destructive' : 'outline'
                    }>
                      {advance.status === 'paid' ? 'مدفوعة' :
                       advance.status === 'approved' ? 'موافق عليها' :
                       advance.status === 'rejected' ? 'مرفوضة' : 'معلقة'}
                    </Badge>
                  </TableCell>
                  <TableCell>{advance.request_date ? new Date(advance.request_date).toLocaleDateString('ar-SA') : 'غير محدد'}</TableCell>
                  <TableCell>{advance.institution_name || 'غير محدد'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return (
          <div className="text-center py-8">
            <p>نوع تقرير غير مدعوم</p>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التقارير المبسطة</h1>
          <p className="text-gray-600 mt-2">عرض وتصدير التقارير بسهولة</p>
        </div>
      </div>

      {/* إعدادات التقرير */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            إعدادات التقرير
          </CardTitle>
          <CardDescription>
            اختر نوع التقرير والفلاتر المطلوبة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">نوع التقرير</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع التقرير..." />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(report => (
                    <SelectItem key={report.id} value={report.id}>
                      <div className="flex items-center gap-2">
                        <report.icon className="h-4 w-4" />
                        {report.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">المؤسسة</label>
              <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المؤسسة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المؤسسات</SelectItem>
                  {institutions.map(institution => (
                    <SelectItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchReportData} disabled={loading || !selectedReport}>
              {loading ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="ml-2 h-4 w-4" />
              )}
              عرض التقرير
            </Button>

            <Button 
              variant="outline" 
              onClick={exportReport} 
              disabled={!showPreview || !reportData.length}
            >
              <FileDown className="ml-2 h-4 w-4" />
              تصدير Excel
            </Button>

            {showPreview && (
              <Button variant="ghost" onClick={() => setShowPreview(false)}>
                <RefreshCw className="ml-2 h-4 w-4" />
                إخفاء المعاينة
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* معاينة التقرير */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              معاينة التقرير
            </div>
            {showPreview && reportData.length > 0 && (
              <Badge variant="outline">
                {reportData.length} سجل
                {reportData.length > 10 && ' (عرض أول 10 سجلات)'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderReportPreview()}
        </CardContent>
      </Card>
    </div>
  );
}
