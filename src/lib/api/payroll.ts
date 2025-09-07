import { ApiResponse } from '@/types';

export interface PayrollRun {
  id: string;
  month: string;
  runDate: string;
  institutionId?: string | null;
  institutionName?: string;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollEntry {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName?: string;
  employeePhotoUrl?: string;
  baseSalary: number;
  rewards: number;
  deductions: number;
  advanceDeduction: number;
  grossPay: number;
  netPay: number;
  createdAt?: string;
}

export interface PayrollCalculation {
  employeeId: string;
  employeeName: string;
  employeePhotoUrl?: string;
  baseSalary: number;
  rewards: number;
  deductions: number;
  advanceDeduction: number;
  grossPay: number;
  netPay: number;
  rewardsDetails: Array<{
    id: string;
    amount: number;
    reason: string;
    date: string;
  }>;
  deductionsDetails: Array<{
    id: string;
    amount: number;
    reason: string;
    date: string;
  }>;
  advanceDetails: Array<{
    advanceId: string;
    deductionAmount: number;
    remainingAmount: number;
  }>;
}

export interface PayrollStats {
  totalRuns: number;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  averageNetPay: number;
}

export interface PayrollFilters {
  institutionId?: string;
  status?: 'completed' | 'pending' | 'failed';
  startMonth?: string;
  endMonth?: string;
}

export const payrollApi = {
  // Get all payroll runs with optional filters
  async getAll(filters?: PayrollFilters): Promise<ApiResponse<PayrollRun[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.institutionId) params.append('institution_id', filters.institutionId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startMonth) params.append('start_month', filters.startMonth);
      if (filters?.endMonth) params.append('end_month', filters.endMonth);

      const url = `/api/payroll${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch payroll runs'
      };
    }
  },

  // Get specific payroll run with entries
  async getById(id: string): Promise<ApiResponse<{ payrollRun: PayrollRun; entries: PayrollEntry[] }>> {
    try {
      const response = await fetch(`/api/payroll/${id}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch payroll run'
      };
    }
  },

  // Calculate payroll (preview without creating run)
  async calculate(month: string, institutionId?: string): Promise<ApiResponse<{
    month: string;
    institutionId?: string;
    calculations: PayrollCalculation[];
    summary: {
      totalEmployees: number;
      totalGross: number;
      totalDeductions: number;
      totalNet: number;
      totalRewards: number;
      totalAdvanceDeductions: number;
      averageGrossPay: number;
      averageNetPay: number;
    };
  }>> {
    try {
      const response = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month, institutionId }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to calculate payroll'
      };
    }
  },

  // Create and process payroll run
  async create(month: string, institutionId?: string): Promise<ApiResponse<{
    payrollRun: PayrollRun;
    summary: {
      totalEmployees: number;
      totalGross: number;
      totalDeductions: number;
      totalNet: number;
    };
    entries: PayrollEntry[];
  }>> {
    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month, institutionId }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create payroll run'
      };
    }
  },

  // Delete payroll run
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/payroll/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete payroll run'
      };
    }
  },

  // Get payroll statistics
  async getStats(filters?: Omit<PayrollFilters, 'status'>): Promise<ApiResponse<PayrollStats>> {
    try {
      const params = new URLSearchParams();
      if (filters?.institutionId) params.append('institution_id', filters.institutionId);
      if (filters?.startMonth) params.append('start_month', filters.startMonth);
      if (filters?.endMonth) params.append('end_month', filters.endMonth);

      const url = `/api/payroll/stats${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch payroll statistics'
      };
    }
  }
};
