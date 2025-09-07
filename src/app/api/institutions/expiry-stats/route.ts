import { NextRequest, NextResponse } from 'next/server';
import { InstitutionModel } from '@/lib/models/Institution';
import { SubscriptionModel } from '@/lib/models/Subscription';
import { EmployeeModel } from '@/lib/models/Employee';
import { verifyAuthToken, hasPermission } from '@/lib/auth-utils';

// GET /api/institutions/expiry-stats - Get expiry statistics for all institutions
export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة والصلاحية
    const user = await verifyAuthToken(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    if (!hasPermission(user, 'institutions_view')) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية لعرض إحصائيات المؤسسات' },
        { status: 403 }
      );
    }

    // جلب جميع المؤسسات
    const institutions = await InstitutionModel.findAll();
    
    // حساب الإحصائيات لكل مؤسسة
    const institutionStats = await Promise.all(
      institutions.map(async (institution) => {
        // جلب الاشتراكات للمؤسسة
        const subscriptions = await SubscriptionModel.findByInstitutionId(institution.id);
        
        // جلب الموظفين للمؤسسة
        const employees = await EmployeeModel.getByInstitutionId(institution.id);
        
        const today = new Date();
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 يوم من الآن
        
        // حساب الاشتراكات المنتهية والتي على وشك الانتهاء
        const expiredSubscriptions = subscriptions.filter(sub => 
          sub.expiryDate && new Date(sub.expiryDate) < today
        );
        
        const expiringSoonSubscriptions = subscriptions.filter(sub => 
          sub.expiryDate && 
          new Date(sub.expiryDate) >= today && 
          new Date(sub.expiryDate) <= futureDate
        );
        
        // حساب المستندات المنتهية والتي على وشك الانتهاء
        const expiredDocuments = {
          iqamas: employees.filter(emp => 
            emp.iqamaExpiry && new Date(emp.iqamaExpiry) < today
          ).length,
          workPermits: employees.filter(emp => 
            emp.workPermitExpiry && new Date(emp.workPermitExpiry) < today
          ).length,
          contracts: employees.filter(emp => 
            emp.contractExpiry && new Date(emp.contractExpiry) < today
          ).length,
          healthCerts: employees.filter(emp => 
            emp.healthCertExpiry && new Date(emp.healthCertExpiry) < today
          ).length,
          healthInsurance: employees.filter(emp => 
            emp.healthInsuranceExpiry && new Date(emp.healthInsuranceExpiry) < today
          ).length
        };
        
        const expiringSoonDocuments = {
          iqamas: employees.filter(emp => 
            emp.iqamaExpiry && 
            new Date(emp.iqamaExpiry) >= today && 
            new Date(emp.iqamaExpiry) <= futureDate
          ).length,
          workPermits: employees.filter(emp => 
            emp.workPermitExpiry && 
            new Date(emp.workPermitExpiry) >= today && 
            new Date(emp.workPermitExpiry) <= futureDate
          ).length,
          contracts: employees.filter(emp => 
            emp.contractExpiry && 
            new Date(emp.contractExpiry) >= today && 
            new Date(emp.contractExpiry) <= futureDate
          ).length,
          healthCerts: employees.filter(emp => 
            emp.healthCertExpiry && 
            new Date(emp.healthCertExpiry) >= today && 
            new Date(emp.healthCertExpiry) <= futureDate
          ).length,
          healthInsurance: employees.filter(emp => 
            emp.healthInsuranceExpiry && 
            new Date(emp.healthInsuranceExpiry) >= today && 
            new Date(emp.healthInsuranceExpiry) <= futureDate
          ).length
        };
        
        // حساب الإجماليات
        const totalExpiredDocuments = Object.values(expiredDocuments).reduce((sum, count) => sum + count, 0);
        const totalExpiringSoonDocuments = Object.values(expiringSoonDocuments).reduce((sum, count) => sum + count, 0);
        
        return {
          institutionId: institution.id,
          institutionName: institution.name,
          subscriptions: {
            expired: expiredSubscriptions.map(sub => ({
              id: sub.id,
              name: sub.name,
              expiryDate: sub.expiryDate,
              daysOverdue: Math.floor((today.getTime() - new Date(sub.expiryDate!).getTime()) / (1000 * 60 * 60 * 24))
            })),
            expiringSoon: expiringSoonSubscriptions.map(sub => ({
              id: sub.id,
              name: sub.name,
              expiryDate: sub.expiryDate,
              daysRemaining: Math.floor((new Date(sub.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            }))
          },
          documents: {
            expired: expiredDocuments,
            expiringSoon: expiringSoonDocuments
          },
          totals: {
            expiredSubscriptions: expiredSubscriptions.length,
            expiringSoonSubscriptions: expiringSoonSubscriptions.length,
            expiredDocuments: totalExpiredDocuments,
            expiringSoonDocuments: totalExpiringSoonDocuments,
            totalExpired: expiredSubscriptions.length + totalExpiredDocuments,
            totalExpiringSoon: expiringSoonSubscriptions.length + totalExpiringSoonDocuments
          }
        };
      })
    );
    
    // حساب الإحصائيات الإجمالية
    const overallStats = {
      totalInstitutions: institutions.length,
      institutionsWithExpiredItems: institutionStats.filter(stat => stat.totals.totalExpired > 0).length,
      institutionsWithExpiringSoonItems: institutionStats.filter(stat => stat.totals.totalExpiringSoon > 0).length,
      totalExpiredSubscriptions: institutionStats.reduce((sum, stat) => sum + stat.totals.expiredSubscriptions, 0),
      totalExpiringSoonSubscriptions: institutionStats.reduce((sum, stat) => sum + stat.totals.expiringSoonSubscriptions, 0),
      totalExpiredDocuments: institutionStats.reduce((sum, stat) => sum + stat.totals.expiredDocuments, 0),
      totalExpiringSoonDocuments: institutionStats.reduce((sum, stat) => sum + stat.totals.expiringSoonDocuments, 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        overallStats,
        institutionStats: institutionStats.filter(stat => 
          stat.totals.totalExpired > 0 || stat.totals.totalExpiringSoon > 0
        )
      }
    });

  } catch (error) {
    console.error('Error fetching expiry statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expiry statistics' },
      { status: 500 }
    );
  }
}
