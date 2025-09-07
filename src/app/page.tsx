
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useInstitutions, useEmployees, useUnsponsoredEmployees, useExpiringEmployees } from '@/hooks/useHRData';
import { institutionApi, subscriptionApi } from '@/lib/api-client';
import Link from 'next/link';
import {
  Building,
  Users,
  FileWarning,
  ArrowLeft,
  Briefcase,
  FileText,
  AlertCircle,
  RefreshCw,
  UserX,
  PlusCircle,
  Heart,
  Shield,
  Calendar,
  CreditCard,
  Upload,
  FileX,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import * as React from 'react';
import { documentApi } from '@/lib/api-client';
import { useDocumentRefresh, RefreshProvider } from '@/hooks/use-refresh-context';



// إحصائيات المستندات والاشتراكات المنتهية - مع مراعاة المستندات غير القابلة للتجديد
function DocumentExpiryStats() {
  const [stats, setStats] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState({
    totalInstitutions: 0,
    totalExpiredDocs: 0,
    totalExpiringSoonDocs: 0,
    totalNonRenewableExpiredDocs: 0,
    totalExpiredSubs: 0,
    totalExpiringSoonSubs: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const { refreshTrigger } = useDocumentRefresh();

  const fetchExpiryStats = React.useCallback(async () => {
    try {
      setLoading(true);

      // جلب جميع المؤسسات
      const institutionsResponse = await institutionApi.getAll();
      if (!institutionsResponse.success) return;

      const institutions = institutionsResponse.data || [];
      const institutionStats = [];
      let totalExpiredDocs = 0, totalExpiringSoonDocs = 0, totalNonRenewableExpiredDocs = 0;
      let totalExpiredSubs = 0, totalExpiringSoonSubs = 0;

      for (const institution of institutions) {
        // جلب جميع المستندات للمؤسسة (تطبيق نفس منطق الاشتراكات)
        const allDocsResponse = await documentApi.getAll({ entityType: 'institution', entityId: institution.id });
        const allDocs = allDocsResponse.success ? allDocsResponse.data || [] : [];

        // جلب جميع الاشتراكات للمؤسسة
        const subscriptionsResponse = await subscriptionApi.getByInstitutionId(institution.id);
        const subscriptions = subscriptionsResponse.success ? subscriptionsResponse.data || [] : [];

        const today = new Date();
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 يوم من الآن

        // تطبيق نفس منطق الاشتراكات على المستندات
        const expiredDocs = allDocs.filter((doc: any) => {
          if (!doc.expiryDate) return false;
          const expiryDate = new Date(doc.expiryDate);
          return expiryDate < today; // منتهي بالفعل
        });

        const expiringSoonDocs = allDocs.filter((doc: any) => {
          if (!doc.expiryDate) return false;
          const expiryDate = new Date(doc.expiryDate);
          return expiryDate >= today && expiryDate <= futureDate; // ينتهي خلال 30 يوم
        });

        // تطبيق نفس منطق الاشتراكات على الاشتراكات
        const expiredSubs = subscriptions.filter((sub: any) => {
          if (!sub.expiryDate) return false;
          const expiryDate = new Date(sub.expiryDate);
          return expiryDate < today; // منتهي بالفعل
        });

        const expiringSoonSubs = subscriptions.filter((sub: any) => {
          if (!sub.expiryDate) return false;
          const expiryDate = new Date(sub.expiryDate);
          return expiryDate >= today && expiryDate <= futureDate; // ينتهي خلال 30 يوم
        });

        // تصنيف المستندات المنتهية حسب قابلية التجديد (نفس المنطق)
        const renewableExpiredDocs = expiredDocs.filter((doc: any) => doc.isRenewable !== false);
        const nonRenewableExpiredDocs = expiredDocs.filter((doc: any) => doc.isRenewable === false);

        const expiredDocsCount = renewableExpiredDocs.length;
        const expiringSoonDocsCount = expiringSoonDocs.length;
        const nonRenewableExpiredDocsCount = nonRenewableExpiredDocs.length;
        const expiredSubsCount = expiredSubs.length;
        const expiringSoonSubsCount = expiringSoonSubs.length;

        const totalIssues = expiredDocsCount + expiringSoonDocsCount + nonRenewableExpiredDocsCount + expiredSubsCount + expiringSoonSubsCount;

        // إضافة للإحصائيات الإجمالية
        totalExpiredDocs += expiredDocsCount;
        totalExpiringSoonDocs += expiringSoonDocsCount;
        totalNonRenewableExpiredDocs += nonRenewableExpiredDocsCount;
        totalExpiredSubs += expiredSubsCount;
        totalExpiringSoonSubs += expiringSoonSubsCount;

        if (totalIssues > 0) {
          institutionStats.push({
            id: institution.id,
            name: institution.name,
            renewableExpiredDocs: renewableExpiredDocs,
            nonRenewableExpiredDocs: nonRenewableExpiredDocs,
            expiringSoonDocs: expiringSoonDocs,
            expiredSubs: expiredSubs,
            expiringSoonSubs: expiringSoonSubs,
            expiredDocsCount,
            expiringSoonDocsCount,
            nonRenewableExpiredDocsCount,
            expiredSubsCount,
            expiringSoonSubsCount,
            totalIssues
          });
        }
      }

      // ترتيب حسب عدد المشاكل (الأكثر أولاً)
      institutionStats.sort((a, b) => b.totalIssues - a.totalIssues);
      setStats(institutionStats);

      // حفظ الملخص الإجمالي
      setSummary({
        totalInstitutions: institutionStats.length,
        totalExpiredDocs,
        totalExpiringSoonDocs,
        totalNonRenewableExpiredDocs,
        totalExpiredSubs,
        totalExpiringSoonSubs
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching expiry stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchExpiryStats();
  }, [fetchExpiryStats, refreshTrigger]);

  // تحديث البيانات كل 5 دقائق
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchExpiryStats();
    }, 5 * 60 * 1000); // 5 دقائق

    return () => clearInterval(interval);
  }, [fetchExpiryStats]);

  // الاستماع للأحداث العالمية للتحديث
  React.useEffect(() => {
    const handleGlobalRefresh = () => {
      fetchExpiryStats();
    };

    window.addEventListener('dashboard-refresh', handleGlobalRefresh);

    return () => {
      window.removeEventListener('dashboard-refresh', handleGlobalRefresh);
    };
  }, [fetchExpiryStats]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            إحصائيات المستندات والاشتراكات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            جاري تحميل الإحصائيات...
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalIssues = summary.totalExpiredDocs + summary.totalExpiringSoonDocs +
                     summary.totalNonRenewableExpiredDocs + summary.totalExpiredSubs +
                     summary.totalExpiringSoonSubs;

  if (totalIssues === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            إحصائيات المستندات والاشتراكات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  🎉 ممتاز! جميع المستندات والاشتراكات محدثة
                </h3>
                <p className="text-green-600 mb-4">
                  لا توجد مستندات أو اشتراكات منتهية الصلاحية حالياً
                </p>
                <div className="text-sm text-muted-foreground">
                  آخر فحص: {lastUpdated?.toLocaleString('ar-SA') || 'جاري التحديث...'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              إحصائيات المستندات والاشتراكات المنتهية
            </CardTitle>
            <CardDescription>
              المؤسسات التي تحتاج إلى تجديد مستندات أو اشتراكات (مع مراعاة المستندات غير القابلة للتجديد)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                آخر تحديث: {lastUpdated.toLocaleTimeString('ar-SA')}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchExpiryStats()}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* رسالة الحالة */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-semibold text-red-800">تحتاج إلى انتباه! ⚠️</h4>
              <p className="text-sm text-red-600">
                يوجد مستندات أو اشتراكات تحتاج إلى تجديد أو انتهت ولا يمكن تجديدها
              </p>
            </div>
          </div>
        </div>

        {/* بطاقات الملخص */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.totalExpiredDocs}</div>
            <div className="text-sm text-red-600">مستندات منتهية</div>
            <div className="text-xs text-red-500 mt-1">قابلة للتجديد</div>
          </div>

          <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{summary.totalExpiringSoonDocs}</div>
            <div className="text-sm text-orange-600">مستندات تنتهي قريباً</div>
            <div className="text-xs text-orange-500 mt-1">خلال 30 يوم</div>
          </div>

          <div className="text-center p-3 bg-gray-50 border border-gray-400 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">{summary.totalNonRenewableExpiredDocs}</div>
            <div className="text-sm text-gray-700">مستندات منتهية</div>
            <div className="text-xs text-gray-600 mt-1">غير قابلة للتجديد</div>
          </div>

          <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.totalExpiredSubs}</div>
            <div className="text-sm text-red-600">اشتراكات منتهية</div>
            <div className="text-xs text-red-500 mt-1">تحتاج تجديد</div>
          </div>

          <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{summary.totalExpiringSoonSubs}</div>
            <div className="text-sm text-orange-600">اشتراكات تنتهي قريباً</div>
            <div className="text-xs text-orange-500 mt-1">خلال 30 يوم</div>
          </div>

          <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.totalInstitutions}</div>
            <div className="text-sm text-blue-600">مؤسسات متأثرة</div>
            <div className="text-xs text-blue-500 mt-1">تحتاج متابعة</div>
          </div>
        </div>

        {/* قائمة المؤسسات */}
        <div className="space-y-4">
          {stats.map((institution, index) => (
            <div key={institution.id} className="p-4 border rounded-lg bg-gradient-to-r from-red-50 to-orange-50 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-lg">{institution.name}</h3>
                </div>
                <Badge variant="destructive" className="text-sm">
                  {institution.totalIssues} مشكلة
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-4">
                {institution.expiredDocsCount > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-red-100 rounded-md text-red-700">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{institution.expiredDocsCount} مستند منتهي (قابل للتجديد)</span>
                  </div>
                )}

                {institution.expiringSoonDocsCount > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-orange-100 rounded-md text-orange-700">
                    <FileWarning className="h-4 w-4" />
                    <span className="font-medium">{institution.expiringSoonDocsCount} مستند ينتهي قريباً</span>
                  </div>
                )}

                {institution.nonRenewableExpiredDocsCount > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md text-gray-700">
                    <FileX className="h-4 w-4" />
                    <span className="font-medium">{institution.nonRenewableExpiredDocsCount} مستند منتهي (غير قابل للتجديد)</span>
                  </div>
                )}

                {institution.expiredSubsCount > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-red-100 rounded-md text-red-700">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-medium">{institution.expiredSubsCount} اشتراك منتهي</span>
                  </div>
                )}

                {institution.expiringSoonSubsCount > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-orange-100 rounded-md text-orange-700">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{institution.expiringSoonSubsCount} اشتراك ينتهي قريباً</span>
                  </div>
                )}
              </div>

              {/* تفاصيل المستندات القابلة للتجديد */}
              {institution.renewableExpiredDocs.length > 0 && (
                <div className="mb-4 pt-4 border-t">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    مستندات منتهية قابلة للتجديد:
                  </h4>
                  <div className="space-y-2">
                    {institution.renewableExpiredDocs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                        <span className="font-medium">{doc.name || doc.documentType}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600">منتهي منذ {Math.floor((new Date().getTime() - new Date(doc.expiryDate).getTime()) / (1000 * 60 * 60 * 24))} يوم</span>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">قابل للتجديد</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* تفاصيل المستندات غير القابلة للتجديد */}
              {institution.nonRenewableExpiredDocs.length > 0 && (
                <div className="mb-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <FileX className="h-4 w-4" />
                    مستندات منتهية غير قابلة للتجديد:
                  </h4>
                  <div className="space-y-2">
                    {institution.nonRenewableExpiredDocs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span className="font-medium">{doc.name || doc.documentType}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">منتهي منذ {Math.floor((new Date().getTime() - new Date(doc.expiryDate).getTime()) / (1000 * 60 * 60 * 24))} يوم</span>
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">غير قابل للتجديد</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* تفاصيل المستندات التي تنتهي قريباً */}
              {institution.expiringSoonDocs.length > 0 && (
                <div className="mb-4 pt-4 border-t">
                  <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                    <FileWarning className="h-4 w-4" />
                    مستندات تنتهي قريباً:
                  </h4>
                  <div className="space-y-2">
                    {institution.expiringSoonDocs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-orange-50 rounded text-sm">
                        <span className="font-medium">{doc.name || doc.documentType}</span>
                        <span className="text-orange-600">ينتهي خلال {Math.ceil((new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} يوم</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* تفاصيل الاشتراكات */}
              {(institution.expiredSubs.length > 0 || institution.expiringSoonSubs.length > 0) && (
                <div className="mb-4 pt-4 border-t">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    تفاصيل الاشتراكات:
                  </h4>
                  <div className="space-y-2">
                    {institution.expiredSubs.map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                        <span className="font-medium">{sub.name}</span>
                        <span className="text-red-600">منتهي منذ {Math.floor((new Date().getTime() - new Date(sub.expiryDate).getTime()) / (1000 * 60 * 60 * 24))} يوم</span>
                      </div>
                    ))}
                    {institution.expiringSoonSubs.map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between p-2 bg-orange-50 rounded text-sm">
                        <span className="font-medium">{sub.name}</span>
                        <span className="text-orange-600">ينتهي خلال {Math.ceil((new Date(sub.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} يوم</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/institutions/${institution.id}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    عرض التفاصيل
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Dashboard component with real API data
function DashboardContent() {
  // Fetch real data from APIs using simplified hooks
  const { institutions, loading: institutionsLoading, refetch: refetchInstitutions } = useInstitutions();
  const { employees, loading: employeesLoading, refetch: refetchEmployees } = useEmployees();
  const { employees: unsponsoredEmployees } = useUnsponsoredEmployees();
  const { employees: expiringEmployees } = useExpiringEmployees(30);

  // Calculate analytics from real data
  const analytics = React.useMemo(() => {
    if (institutionsLoading || employeesLoading) {
      return {
        totalInstitutions: 0,
        totalEmployees: 0,
        unsponsoredEmployees: 0,
        expiredIqamas: 0,
        expiredWorkPermits: 0,
        expiredContracts: 0,
        expiredHealthCerts: 0,
        expiredInsurance: 0,
        expiringIqamas: 0,
        expiringWorkPermits: 0,
        expiringContracts: 0,
        expiringHealthCerts: 0,
        expiringInsurance: 0,
        employeeDistribution: []
      };
    }

    // Count expired documents by type (already expired, not expiring soon)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // بداية اليوم الحالي

    const expiredIqamas = employees?.filter(emp =>
      emp.iqamaExpiry && new Date(emp.iqamaExpiry) < today
    ).length || 0;

    const expiredWorkPermits = employees?.filter(emp =>
      emp.workPermitExpiry && new Date(emp.workPermitExpiry) < today
    ).length || 0;

    const expiredContracts = employees?.filter(emp =>
      emp.contractExpiry && new Date(emp.contractExpiry) < today
    ).length || 0;

    const expiredHealthCerts = employees?.filter(emp =>
      emp.healthCertExpiry && new Date(emp.healthCertExpiry) < today
    ).length || 0;

    const expiredInsurance = employees?.filter(emp =>
      emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) < today
    ).length || 0;

    // Count documents expiring soon (within 30 days but NOT expired) for alerts section
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const expiringIqamas = employees?.filter(emp => {
      if (!emp.iqamaExpiry) return false;
      const expiryDate = new Date(emp.iqamaExpiry);
      return expiryDate > today && expiryDate <= futureDate;
    }).length || 0;

    const expiringWorkPermits = employees?.filter(emp => {
      if (!emp.workPermitExpiry) return false;
      const expiryDate = new Date(emp.workPermitExpiry);
      return expiryDate > today && expiryDate <= futureDate;
    }).length || 0;

    const expiringContracts = employees?.filter(emp => {
      if (!emp.contractExpiry) return false;
      const expiryDate = new Date(emp.contractExpiry);
      return expiryDate > today && expiryDate <= futureDate;
    }).length || 0;

    const expiringHealthCerts = employees?.filter(emp => {
      if (!emp.healthCertExpiry) return false;
      const expiryDate = new Date(emp.healthCertExpiry);
      return expiryDate > today && expiryDate <= futureDate;
    }).length || 0;

    const expiringInsurance = employees?.filter(emp => {
      if (!emp.healthInsuranceExpiry) return false;
      const expiryDate = new Date(emp.healthInsuranceExpiry);
      return expiryDate > today && expiryDate <= futureDate;
    }).length || 0;

    // Create employee distribution chart data
    const employeeDistribution = institutions?.map(institution => ({
      institutionName: institution.name,
      employeeCount: employees?.filter(emp => emp.institutionId === institution.id).length || 0
    })) || [];

    return {
      totalInstitutions: institutions?.length || 0,
      totalEmployees: employees?.length || 0,
      unsponsoredEmployees: unsponsoredEmployees?.length || 0,
      expiredIqamas,
      expiredWorkPermits,
      expiredContracts,
      expiredHealthCerts,
      expiredInsurance,
      expiringIqamas,
      expiringWorkPermits,
      expiringContracts,
      expiringHealthCerts,
      expiringInsurance,
      employeeDistribution
    };
  }, [institutions, employees, unsponsoredEmployees, expiringEmployees, institutionsLoading, employeesLoading]);

  const analyticsCards = [
    {
      label: 'إجمالي المؤسسات',
      value: analytics.totalInstitutions,
      icon: Building,
    },
    { label: 'إجمالي الموظفين', value: analytics.totalEmployees, icon: Users },
    {
      label: 'موظفون غير مكفولين',
      value: analytics.unsponsoredEmployees,
      icon: UserX,
    },
  ];

  const chartData = analytics.employeeDistribution;

  const chartConfig = {
    employeeCount: {
      label: 'عدد الموظفين',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

function AddInstitutionForm({ setOpen, onSuccess }: { setOpen: (open: boolean) => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      crNumber: formData.get('crNumber') as string,
      crExpiryDate: formData.get('crExpiry') as string,
      status: 'active' as const,
    };

    try {
      const result = await institutionApi.create(data);

      if (result.success) {
        toast({
          title: "تم بنجاح",
          description: "تم إنشاء المؤسسة بنجاح",
        });
        setOpen(false);
        onSuccess(); // Refresh the data
      } else {
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: result.error || "فشل في إنشاء المؤسسة",
        });
      }
    } catch (error) {
      console.error('Error creating institution:', error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: error instanceof Error ? error.message : "فشل في إنشاء المؤسسة",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">اسم المؤسسة</Label>
          <Input id="name" name="name" placeholder="شركة البناة الحديثة" className="col-span-3" required />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="crNumber" className="text-right">رقم السجل</Label>
          <Input id="crNumber" name="crNumber" placeholder="1010123456" className="col-span-3" required />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="crExpiry" className="text-right">انتهاء السجل</Label>
          <Input id="crExpiry" name="crExpiry" type="date" className="col-span-3" required />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </DialogFooter>
    </form>
  );
}


  const [open, setOpen] = React.useState(false);

  const handleInstitutionAdded = () => {
    refetchInstitutions();
    refetchEmployees();
  };

  // Show loading state
  if (institutionsLoading || employeesLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div>
          <h1 className="font-headline text-4xl font-bold text-foreground">
            لوحة التحكم الرئيسية
          </h1>
          <p className="text-muted-foreground mt-2">
            نظرة شاملة على جميع المؤسسات والتحليلات.
          </p>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {analyticsCards.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* إحصائيات الوثائق المنتهية */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-red-500" />
            إحصائيات الوثائق المنتهية الصلاحية في جميع المؤسسات
          </CardTitle>
          <CardDescription>
            نظرة شاملة على جميع الوثائق المنتهية الصلاحية التي تحتاج إلى تجديد فوري
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-200">
              <CreditCard className="h-8 w-8 text-red-500 ml-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">الإقامات</p>
                <p className="text-2xl font-bold text-red-600">{analytics.expiredIqamas}</p>
                <p className="text-xs text-red-500">منتهية الصلاحية</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Briefcase className="h-8 w-8 text-yellow-500 ml-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-700">رخص العمل</p>
                <p className="text-2xl font-bold text-yellow-600">{analytics.expiredWorkPermits}</p>
                <p className="text-xs text-yellow-500">منتهية الصلاحية</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <FileText className="h-8 w-8 text-orange-500 ml-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-700">العقود</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.expiredContracts}</p>
                <p className="text-xs text-orange-500">منتهية الصلاحية</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="h-8 w-8 text-blue-500 ml-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700">التأمين الصحي</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.expiredInsurance}</p>
                <p className="text-xs text-blue-500">منتهي الصلاحية</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-pink-50 rounded-lg border border-pink-200">
              <Heart className="h-8 w-8 text-pink-500 ml-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-pink-700">الشهادة الصحية</p>
                <p className="text-2xl font-bold text-pink-600">{analytics.expiredHealthCerts}</p>
                <p className="text-xs text-pink-500">منتهية الصلاحية</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">إجمالي الوثائق المنتهية الصلاحية</p>
                <p className="text-2xl font-bold text-red-900">
                  {(analytics.expiredIqamas || 0) + (analytics.expiredWorkPermits || 0) + (analytics.expiredContracts || 0) + (analytics.expiredInsurance || 0) + (analytics.expiredHealthCerts || 0)}
                </p>
                <p className="text-xs text-red-600 mt-1">تحتاج إلى تجديد فوري</p>
              </div>
              <Button variant="destructive" asChild>
                <Link href="/employees?expired=true">
                  <AlertCircle className="ml-2 h-4 w-4" />
                  عرض الوثائق المنتهية
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>توزيع الموظفين على المؤسسات</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{ right: 40, left: 10, top: 10, bottom: 10 }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  className="text-xs"
                  width={200}
                  tick={{
                    width: 200,
                    overflow: 'visible',
                    textAnchor: 'start',
                    dx: 10,
                  }}
                  />
                <XAxis dataKey="employeeCount" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                  />
                <Bar dataKey="employeeCount" fill="var(--color-employeeCount)" radius={5} >
                   <LabelList 
                        dataKey="employeeCount" 
                        position="right" 
                        offset={8} 
                        className="fill-foreground text-xs"
                    />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  تنبيهات هامة
                </CardTitle>
                <CardDescription>
                  المستندات التي ستنتهي خلال 30 يوم وتحتاج إلى تجديد فوري
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-destructive ml-3"/>
                    <div className="flex-1">
                        <p className="font-medium">إقامات ستنتهي قريباً</p>
                        <p className="text-destructive font-bold text-lg">{analytics.expiringIqamas}</p>
                    </div>
                 </div>
                 <div className="flex items-center">
                    <FileWarning className="h-5 w-5 text-yellow-500 ml-3"/>
                     <div className="flex-1">
                        <p className="font-medium">رخص عمل ستنتهي قريباً</p>
                        <p className="font-bold text-lg">{analytics.expiringWorkPermits}</p>
                    </div>
                 </div>
                 <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-orange-500 ml-3"/>
                     <div className="flex-1">
                        <p className="font-medium">عقود ستنتهي قريباً</p>
                        <p className="font-bold text-lg">{analytics.expiringContracts}</p>
                    </div>
                 </div>
                 <div className="flex items-center">
                    <Heart className="h-5 w-5 text-red-500 ml-3"/>
                     <div className="flex-1">
                        <p className="font-medium">شهادات صحية ستنتهي قريباً</p>
                        <p className="font-bold text-lg">{analytics.expiringHealthCerts}</p>
                    </div>
                 </div>
                 <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-500 ml-3"/>
                     <div className="flex-1">
                        <p className="font-medium">تأمين صحي سينتهي قريباً</p>
                        <p className="font-bold text-lg">{analytics.expiringInsurance}</p>
                    </div>
                 </div>
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>الموظفون غير المكفولين</CardTitle>
                    <CardDescription>الموظفون الذين لا ينتمون لأي مؤسسة حالياً.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center">
                        <UserX className="h-5 w-5 text-blue-500 ml-3"/>
                        <div className="flex-1">
                            <p className="font-medium">إجمالي الموظفين غير المكفولين</p>
                            <p className="font-bold text-lg text-blue-600">{analytics.unsponsoredEmployees}</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/employees?unsponsored=true">
                                عرض الكل
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قائمة المؤسسات</CardTitle>
              <CardDescription>
                نظرة سريعة على جميع المؤسسات المسجلة.
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  إضافة مؤسسة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>إضافة مؤسسة جديدة</DialogTitle>
                  <DialogDescription>
                    أدخل تفاصيل المؤسسة الجديدة هنا. انقر على "حفظ" عند الانتهاء.
                  </DialogDescription>
                </DialogHeader>
                <AddInstitutionForm setOpen={setOpen} onSuccess={handleInstitutionAdded} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المؤسسة</TableHead>
                <TableHead>عدد الموظفين</TableHead>
                <TableHead>صلاحية الرخصة التجارية</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutions && institutions.length > 0 ? (
                institutions.map((inst) => {
                  // Calculate days remaining for CR expiry
                  const crExpiryDate = new Date(inst.crExpiryDate);
                  const today = new Date();
                  const daysRemaining = Math.ceil((crExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const progress = Math.max(0, Math.min(100, (daysRemaining / 365) * 100));

                  let status = 'نشطة';
                  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';

                  if (daysRemaining <= 0) {
                    status = 'منتهية';
                    badgeVariant = 'destructive';
                  } else if (daysRemaining <= 30) {
                    status = 'تنتهي قريباً';
                    badgeVariant = 'destructive';
                  }

                  return (
                    <TableRow key={inst.id}>
                      <TableCell className="font-medium">{inst.name}</TableCell>
                      <TableCell>{inst.employeeCount || 0}</TableCell>
                      <TableCell>
                          <div className='flex items-center gap-2'>
                               <Progress value={progress} className="w-32" />
                               <Badge variant={badgeVariant}>{status}</Badge>
                          </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/institutions/${inst.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                            عرض التفاصيل
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    لا توجد مؤسسات مسجلة حالياً
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Excel Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-500" />
            رفع بيانات الموظفين
          </CardTitle>
          <CardDescription>
            رفع معلومات الموظفين بشكل مجمع من ملف Excel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Button asChild className="flex items-center gap-2">
              <Link href="/employees/bulk-upload">
                <Upload className="h-4 w-4" />
                رفع ملف Excel
              </Link>
            </Button>
            <div className="text-sm text-muted-foreground">
              <p>• يدعم ملفات .xlsx و .xls</p>
              <p>• يمكن رفع معلومات متعددة للموظفين دفعة واحدة</p>
              <p>• تحديث البيانات الموجودة أو إضافة موظفين جدد</p>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* إحصائيات المستندات والاشتراكات المنتهية */}
      <DocumentExpiryStats />

    </div>
  );
}

export default function Dashboard() {
  return (
    <RefreshProvider>
      <DashboardContent />
    </RefreshProvider>
  );
}
