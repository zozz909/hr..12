

import { differenceInDays, add } from 'date-fns';
// Note: This file should not import database modules as it may be used in client-side code


export type DocumentStatus = 'active' | 'expiring_soon' | 'expired';
export type EmployeeStatus = 'active' | 'archived';

export interface Employee {
  id: string;
  name: string;
  photoUrl?: string;
  mobile: string;
  iqamaNumber: string;
  iqamaExpiry: string;
  insuranceExpiry: string;
  workPermitExpiry: string;
  healthCertExpiry: string;
  contractExpiry: string;
  institutionId: string | null;
  institutionName?: string;
  salary: number;
  fileNumber: string;
  status: EmployeeStatus;
  unsponsoredReason?: 'transferred' | 'new' | 'temporary_hold';
  lastStatusUpdate?: string;
  archiveReason?: 'terminated' | 'final_exit';
  archiveDate?: string;
}

export interface Subscription {
  id: string;
  name: string;
  icon: string;
  expiryDate: string;
}

export interface Institution {
  id: string;
  name: string;
  licenseExpiry: string;
  employeeCount: number;
  commercialRecord: {
    number: string;
    issueDate: string;
    expiryDate: string;
  };
  documents: { name: string; url: string }[];
  subscriptions: Subscription[];
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePhotoUrl?: string;
  leaveType: 'annual' | 'sick' | 'unpaid' | 'emergency';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
}

export interface Compensation {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePhotoUrl?: string;
  type: 'deduction' | 'reward';
  amount: number;
  reason: string;
  date: string;
}

export interface PayrollRun {
    id: string;
    month: string;
    runDate: string;
    institutionId: string | null;
    institutionName?: string;
    totalEmployees: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    status: 'completed' | 'pending' | 'failed';
}

export interface Advance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePhotoUrl?: string;
  amount: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  installments: number;
  paidAmount: number;
}

export interface Form {
  id: string;
  title: string;
  description: string;
  category: 'hr' | 'finance' | 'general';
}


export const getDaysRemaining = (dateStr: string) => {
  if (!dateStr) return 0;
  return differenceInDays(new Date(dateStr), new Date());
};

const getStatus = (dateStr: string): DocumentStatus => {
  const daysRemaining = getDaysRemaining(dateStr);
  if (daysRemaining <= 0) return 'expired';
  if (daysRemaining <= 30) return 'expiring_soon';
  return 'active';
};

const today = new Date();

// This data is now considered "mock" or "seed" data.
// In a real application, this would be replaced by database queries.
// For now, some functions will still use this mock data until all features are migrated.

// Database functions have been moved to API routes
// This file now only contains utility functions and mock data for development

// Mock institutions data for components that still need it
export let institutions: Institution[] = [];

export const employees: Employee[] = [
  {
    id: 'emp-101',
    name: 'محمد علي',
    photoUrl: 'https://picsum.photos/seed/emp-101/200/200',
    mobile: '+966 50 123 4567',
    iqamaNumber: '2451234567',
    iqamaExpiry: add(today, { days: 120 }).toISOString().split('T')[0],
    insuranceExpiry: add(today, { days: 80 }).toISOString().split('T')[0],
    workPermitExpiry: add(today, { days: -5 }).toISOString().split('T')[0],
    healthCertExpiry: add(today, { days: 200 }).toISOString().split('T')[0],
    contractExpiry: add(today, { days: 300 }).toISOString().split('T')[0],
    institutionId: 'inst-001',
    institutionName: 'شركة البناة الحديثة',
    salary: 6000,
    fileNumber: 'MB-001',
    status: 'active',
  },
  // ... other mock employees
];

// Re-assigning `institutions` from mock data for functions that still use it.
// This part should be removed as more features move to the database.
institutions = [
  {
    id: 'inst-001',
    name: 'شركة البناة الحديثة',
    licenseExpiry: add(today, { days: 25 }).toISOString().split('T')[0],
    employeeCount: 3,
    commercialRecord: {
      number: '1010123456',
      issueDate: '2022-01-15',
      expiryDate: add(today, { days: 25 }).toISOString().split('T')[0],
    },
    documents: [{ name: 'Commercial License.pdf', url: '#' }],
    subscriptions: [
      { id: 'sub-1-1', name: 'قوى', icon: 'ShieldCheck', expiryDate: add(today, { days: 45 }).toISOString().split('T')[0] },
      { id: 'sub-1-2', name: 'أبشر أعمال', icon: 'BookUser', expiryDate: add(today, { days: 120 }).toISOString().split('T')[0] },
      { id: 'sub-1-3', name: 'التأمينات الاجتماعية', icon: 'Users', expiryDate: add(today, { days: 300 }).toISOString().split('T')[0] },
    ],
  },
  {
    id: 'inst-002',
    name: 'شركة المستقبل التقني',
    licenseExpiry: add(today, { days: 250 }).toISOString().split('T')[0],
    employeeCount: 2,
    commercialRecord: {
      number: '1010654321',
      issueDate: '2021-08-20',
      expiryDate: add(today, { days: 250 }).toISOString().split('T')[0],
    },
    documents: [{ name: 'Tax Certificate.pdf', url: '#' }],
    subscriptions: [
      { id: 'sub-2-1', name: 'قوى', icon: 'ShieldCheck', expiryDate: add(today, { days: 20 }).toISOString().split('T')[0] },
      { id: 'sub-2-2', name: 'أبشر أعمال', icon: 'BookUser', expiryDate: add(today, { days: -10 }).toISOString().split('T')[0] },
    ],
  },
  {
    id: 'inst-003',
    name: 'الخدمات اللوجستية العالمية',
    licenseExpiry: add(today, { days: -10 }).toISOString().split('T')[0],
    employeeCount: 0,
    commercialRecord: {
      number: '1010789012',
      issueDate: '2020-05-10',
      expiryDate: add(today, { days: -10 }).toISOString().split('T')[0],
    },
    documents: [],
    subscriptions: [],
  },
];


export const leaveRequests: LeaveRequest[] = [
  // ... mock leave requests
];

export const compensations: Compensation[] = [
  {
    id: 'comp-001',
    employeeId: 'emp-001',
    employeeName: 'أحمد محمد علي',
    employeePhotoUrl: '/avatars/ahmed.jpg',
    type: 'reward',
    amount: 1500,
    reason: 'مكافأة الأداء المتميز للربع الأول',
    date: '2024-03-15'
  },
  {
    id: 'comp-002',
    employeeId: 'emp-002',
    employeeName: 'فاطمة أحمد السالم',
    employeePhotoUrl: '/avatars/fatima.jpg',
    type: 'deduction',
    amount: 200,
    reason: 'خصم تأخير (3 أيام)',
    date: '2024-03-10'
  },
  {
    id: 'comp-003',
    employeeId: 'emp-003',
    employeeName: 'محمد عبدالله الخالد',
    employeePhotoUrl: '/avatars/mohammed.jpg',
    type: 'reward',
    amount: 2000,
    reason: 'مكافأة إنجاز مشروع العميل الكبير',
    date: '2024-03-08'
  },
  {
    id: 'comp-004',
    employeeId: 'emp-004',
    employeeName: 'نورا سعد المطيري',
    employeePhotoUrl: '/avatars/nora.jpg',
    type: 'reward',
    amount: 800,
    reason: 'مكافأة تحسين العمليات',
    date: '2024-03-05'
  },
  {
    id: 'comp-005',
    employeeId: 'emp-001',
    employeeName: 'أحمد محمد علي',
    employeePhotoUrl: '/avatars/ahmed.jpg',
    type: 'deduction',
    amount: 150,
    reason: 'خصم كسر في المعدات',
    date: '2024-02-28'
  }
];

export const payrollRuns: PayrollRun[] = [
   // ... mock payroll runs
];

const advances: Advance[] = [
  // ... mock advances
];

const forms: Form[] = [
    // ... mock forms
];


// The functions below still use mock data and will need to be migrated to use the database.

export const getInstitutionById = (id: string) => {
  return institutions.find((inst) => inst.id === id);
};

export const getEmployeesByInstitutionId = (id: string) => {
  return employees.filter((emp) => emp.institutionId === id && emp.status === 'active');
};

export const getUnsponsoredEmployees = () => {
  return employees.filter((emp) => emp.institutionId === null && emp.status === 'active');
};

export const getArchivedEmployees = () => {
  return employees.filter((emp) => emp.status === 'archived');
};

export const getEmployeeById = (id: string) => {
  return employees.find((emp) => emp.id === id);
};

export const getAllActiveEmployees = () => {
  return employees.filter((emp) => emp.status === 'active');
};

export const getAllLeaveRequests = () => {
  return leaveRequests;
};

export const getAllCompensations = () => {
    return compensations;
}

export const getAllPayrollRuns = () => {
    return payrollRuns;
}

export const getAllAdvances = () => {
  return advances;
};

export const getAllForms = () => {
  return forms;
};

export const getAnalyticsForInstitution = (id: string) => {
    const institutionEmployees = getEmployeesByInstitutionId(id);
    const analytics = {
        totalEmployees: institutionEmployees.length,
        expiredIqamas: 0,
        expiredInsurances: 0,
        expiredWorkPermits: 0,
        expiredHealthCerts: 0,
        expiredContracts: 0,
    };

    institutionEmployees.forEach(emp => {
        if(getStatus(emp.iqamaExpiry) === 'expired') analytics.expiredIqamas++;
        if(getStatus(emp.insuranceExpiry) === 'expired') analytics.expiredInsurances++;
        if(getStatus(emp.workPermitExpiry) === 'expired') analytics.expiredWorkPermits++;
        if(getStatus(emp.healthCertExpiry) === 'expired') analytics.expiredHealthCerts++;
        if(getStatus(emp.contractExpiry) === 'expired') analytics.expiredContracts++;
    });

    return analytics;
}

export const getDashboardAnalytics = () => {
    const activeEmployees = employees.filter(e => e.status === 'active');
    const totalInstitutions = institutions.length;
    const totalEmployees = activeEmployees.length;
    const unsponsoredEmployees = getUnsponsoredEmployees().length;
    
    let expiringIqamas = 0;
    let expiringWorkPermits = 0;
    let expiringContracts = 0;
    let expiredIqamas = 0;

    activeEmployees.forEach(emp => {
        if (getStatus(emp.iqamaExpiry) === 'expiring_soon') expiringIqamas++;
        if (getStatus(emp.iqamaExpiry) === 'expired') expiredIqamas++;
        if (getStatus(emp.workPermitExpiry) === 'expiring_soon') expiringWorkPermits++;
        if (getStatus(emp.contractExpiry) === 'expiring_soon') expiringContracts++;
    });

    const employeeDistribution = institutions.map(inst => ({
        name: inst.name,
        employeeCount: getEmployeesByInstitutionId(inst.id).length
    }));
    
    const subscriptionAlerts: {
        institutionName: string;
        subscriptionName: string;
        daysRemaining: number;
        status: DocumentStatus;
    }[] = [];

    institutions.forEach(inst => {
        inst.subscriptions.forEach(sub => {
            const status = getStatus(sub.expiryDate);
            if(status === 'expired' || status === 'expiring_soon') {
                subscriptionAlerts.push({
                    institutionName: inst.name,
                    subscriptionName: sub.name,
                    daysRemaining: getDaysRemaining(sub.expiryDate),
                    status: status
                });
            }
        });
    });

    return {
        totalInstitutions,
        totalEmployees,
        unsponsoredEmployees,
        expiringIqamas,
        expiringWorkPermits,
        expiringContracts,
        expiredIqamas,
        employeeDistribution,
        subscriptionAlerts
    };
}
