'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Shield, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Server
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastBackup: string;
  auditLogCount: number;
  failedLoginAttempts: number;
  systemUptime: string;
}

export function SystemStats() {
  const [stats, setStats] = React.useState<SystemStats>({
    totalUsers: 25,
    activeUsers: 23,
    totalRoles: 4,
    systemHealth: 'healthy',
    lastBackup: '2024-01-15T02:00:00Z',
    auditLogCount: 1247,
    failedLoginAttempts: 3,
    systemUptime: '15 يوم، 8 ساعات'
  });

  React.useEffect(() => {
    // في التطبيق الحقيقي، ستجلب هذه البيانات من API
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/system/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('خطأ في جلب إحصائيات النظام:', error);
      }
    };

    fetchStats();
    // تحديث الإحصائيات كل دقيقة
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 ml-1" />
            سليم
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 ml-1" />
            تحذير
          </Badge>
        );
      case 'critical':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 ml-1" />
            حرج
          </Badge>
        );
      default:
        return <Badge variant="outline">{health}</Badge>;
    }
  };

  const formatLastBackup = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'منذ أقل من ساعة';
    } else if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `منذ ${diffDays} يوم`;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Users Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">المستخدمين</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeUsers} نشط من أصل {stats.totalUsers}
          </p>
        </CardContent>
      </Card>

      {/* Roles Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الأدوار</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRoles}</div>
          <p className="text-xs text-muted-foreground">
            أدوار مختلفة في النظام
          </p>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">حالة النظام</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {getHealthBadge(stats.systemHealth)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            وقت التشغيل: {stats.systemUptime}
          </p>
        </CardContent>
      </Card>

      {/* Security Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الأمان</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.failedLoginAttempts}</div>
          <p className="text-xs text-muted-foreground">
            محاولات دخول فاشلة اليوم
          </p>
        </CardContent>
      </Card>

      {/* Backup Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">النسخ الاحتياطي</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">آخر نسخة</div>
          <p className="text-xs text-muted-foreground">
            {formatLastBackup(stats.lastBackup)}
          </p>
        </CardContent>
      </Card>

      {/* Audit Log Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">سجل المراجعة</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.auditLogCount.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            سجل عملية مسجلة
          </p>
        </CardContent>
      </Card>

      {/* System Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الأداء</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 ml-1" />
              ممتاز
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            استجابة سريعة
          </p>
        </CardContent>
      </Card>

      {/* Session Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الجلسات النشطة</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            مستخدم متصل حالياً
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
