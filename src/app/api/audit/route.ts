import { NextRequest, NextResponse } from 'next/server';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'warning';
  metadata?: Record<string, any>;
}

// في التطبيق الحقيقي، ستكون هذه البيانات في قاعدة البيانات
let auditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    user: 'أحمد محمد',
    userId: '1',
    action: 'edit',
    resource: 'employee',
    resourceId: 'emp_123',
    details: 'تعديل بيانات الموظف: فاطمة علي - تحديث الراتب الأساسي',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success',
    metadata: { oldSalary: 5000, newSalary: 5500 }
  },
  {
    id: '2',
    timestamp: '2024-01-15T09:15:00Z',
    user: 'فاطمة علي',
    userId: '2',
    action: 'create',
    resource: 'payroll',
    resourceId: 'payroll_202401',
    details: 'إنشاء كشف راتب جديد للشهر 01/2024',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success'
  },
  {
    id: '3',
    timestamp: '2024-01-15T08:45:00Z',
    user: 'محمد سالم',
    userId: '3',
    action: 'login',
    resource: 'system',
    details: 'تسجيل دخول ناجح من جهاز جديد',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success'
  },
  {
    id: '4',
    timestamp: '2024-01-15T08:30:00Z',
    user: 'مستخدم غير معروف',
    userId: 'unknown',
    action: 'login',
    resource: 'system',
    details: 'محاولة تسجيل دخول فاشلة - كلمة مرور خاطئة للبريد: test@company.com',
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'failed'
  },
  {
    id: '5',
    timestamp: '2024-01-15T07:20:00Z',
    user: 'أحمد محمد',
    userId: '1',
    action: 'create',
    resource: 'user',
    resourceId: 'user_456',
    details: 'إنشاء مستخدم جديد: سارة أحمد - دور: موظف',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success'
  },
  {
    id: '6',
    timestamp: '2024-01-14T16:45:00Z',
    user: 'فاطمة علي',
    userId: '2',
    action: 'delete',
    resource: 'advance',
    resourceId: 'adv_789',
    details: 'حذف طلب سلفة مرفوض للموظف: خالد محمد',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success'
  }
];

// GET - جلب سجل المراجعة مع إمكانية التصفية
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const user = searchParams.get('user');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    let filteredLogs = [...auditLogs];

    // تطبيق المرشحات
    if (user) {
      filteredLogs = filteredLogs.filter(log => 
        log.user.toLowerCase().includes(user.toLowerCase())
      );
    }

    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }

    if (resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === resource);
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(startDate)
      );
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(endDate)
      );
    }

    if (search) {
      filteredLogs = filteredLogs.filter(log => 
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.user.toLowerCase().includes(search.toLowerCase())
      );
    }

    // ترتيب حسب التاريخ (الأحدث أولاً)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // تطبيق التصفح
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / limit)
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب سجل المراجعة' },
      { status: 500 }
    );
  }
}

// POST - إضافة سجل جديد للمراجعة
export async function POST(request: NextRequest) {
  try {
    const { 
      user, 
      userId, 
      action, 
      resource, 
      resourceId, 
      details, 
      status = 'success',
      metadata 
    } = await request.json();

    // الحصول على معلومات الطلب
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const newLog: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user,
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      status,
      metadata
    };

    auditLogs.push(newLog);

    return NextResponse.json({
      success: true,
      log: newLog,
      message: 'تم إضافة السجل بنجاح'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في إضافة السجل' },
      { status: 500 }
    );
  }
}

// DELETE - حذف سجلات قديمة (للصيانة)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan'); // تاريخ بصيغة ISO

    if (!olderThan) {
      return NextResponse.json(
        { success: false, error: 'تاريخ الحد الأدنى مطلوب' },
        { status: 400 }
      );
    }

    const cutoffDate = new Date(olderThan);
    const initialCount = auditLogs.length;
    
    auditLogs = auditLogs.filter(log => 
      new Date(log.timestamp) >= cutoffDate
    );

    const deletedCount = initialCount - auditLogs.length;

    return NextResponse.json({
      success: true,
      message: `تم حذف ${deletedCount} سجل قديم`,
      deletedCount
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'خطأ في حذف السجلات القديمة' },
      { status: 500 }
    );
  }
}
