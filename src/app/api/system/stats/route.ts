import { NextRequest, NextResponse } from 'next/server';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
  customRoles: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastBackup: string;
  auditLogCount: number;
  failedLoginAttempts: number;
  systemUptime: string;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeConnections: number;
  totalEmployees: number;
  totalInstitutions: number;
  lastLoginActivity: string;
}

// محاكاة بيانات النظام
function generateSystemStats(): SystemStats {
  const now = new Date();
  const uptimeStart = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)); // 15 يوم
  
  return {
    totalUsers: 25,
    activeUsers: 23,
    inactiveUsers: 2,
    totalRoles: 4,
    customRoles: 1,
    systemHealth: Math.random() > 0.8 ? 'warning' : 'healthy',
    lastBackup: new Date(now.getTime() - (2 * 60 * 60 * 1000)).toISOString(), // منذ ساعتين
    auditLogCount: 1247,
    failedLoginAttempts: Math.floor(Math.random() * 10),
    systemUptime: calculateUptime(uptimeStart, now),
    memoryUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
    cpuUsage: Math.floor(Math.random() * 20) + 10, // 10-30%
    diskUsage: Math.floor(Math.random() * 20) + 60, // 60-80%
    activeConnections: Math.floor(Math.random() * 50) + 20,
    totalEmployees: 150,
    totalInstitutions: 5,
    lastLoginActivity: new Date(now.getTime() - (30 * 60 * 1000)).toISOString() // منذ 30 دقيقة
  };
}

function calculateUptime(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${days} يوم، ${hours} ساعة، ${minutes} دقيقة`;
}

// GET - جلب إحصائيات النظام
export async function GET() {
  try {
    const stats = generateSystemStats();
    
    return NextResponse.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب إحصائيات النظام' },
      { status: 500 }
    );
  }
}

// POST - تحديث إحصائيات النظام (للمراقبة)
export async function POST(request: NextRequest) {
  try {
    const { metric, value } = await request.json();
    
    // في التطبيق الحقيقي، ستحفظ هذه البيانات في قاعدة البيانات
    // للمراقبة والتحليل
    
    return NextResponse.json({
      success: true,
      message: 'تم تحديث الإحصائية بنجاح'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في تحديث الإحصائية' },
      { status: 500 }
    );
  }
}
