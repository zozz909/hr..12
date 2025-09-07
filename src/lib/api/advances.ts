import { ApiResponse } from '@/types';

export interface Advance {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeePhotoUrl?: string;
  amount: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  installments: number;
  paidAmount: number;
  remainingAmount: number;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdvanceStats {
  totalAdvances: number;
  totalPaid: number;
  totalRemaining: number;
  pendingCount: number;
  approvedCount: number;
  paidCount: number;
  rejectedCount: number;
}

export interface AdvanceFilters {
  employeeId?: string;
  institutionId?: string;
  branchId?: string;
  status?: 'pending' | 'approved' | 'paid' | 'rejected';
  startDate?: string;
  endDate?: string;
}

export const advanceApi = {
  // Get all advances with optional filters
  async getAll(filters?: AdvanceFilters): Promise<ApiResponse<Advance[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employee_id', filters.employeeId);
      if (filters?.institutionId) params.append('institution_id', filters.institutionId);
      if (filters?.branchId) params.append('branch_id', filters.branchId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('start_date', filters.startDate);
      if (filters?.endDate) params.append('end_date', filters.endDate);

      const url = `/api/advances${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch advances'
      };
    }
  },

  // Get specific advance by ID
  async getById(id: string): Promise<ApiResponse<Advance>> {
    try {
      const response = await fetch(`/api/advances/${id}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch advance'
      };
    }
  },

  // Create new advance request
  async create(data: Omit<Advance, 'id' | 'paidAmount' | 'remainingAmount' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Advance>> {
    try {
      const response = await fetch('/api/advances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create advance request'
      };
    }
  },

  // Update advance
  async update(id: string, data: Partial<Omit<Advance, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Advance>> {
    try {
      const response = await fetch(`/api/advances/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update advance'
      };
    }
  },

  // Delete advance
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/advances/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete advance'
      };
    }
  },

  // Approve advance
  async approve(id: string, approvedBy: string): Promise<ApiResponse<Advance>> {
    try {
      const response = await fetch(`/api/advances/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvedBy }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to approve advance'
      };
    }
  },

  // Reject advance
  async reject(id: string, reason: string): Promise<ApiResponse<Advance>> {
    try {
      const response = await fetch(`/api/advances/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reject advance'
      };
    }
  },

  // Mark advance as paid
  async markAsPaid(id: string): Promise<ApiResponse<Advance>> {
    try {
      const response = await fetch(`/api/advances/${id}/pay`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to mark advance as paid'
      };
    }
  },

  // Get advance statistics
  async getStats(filters?: Omit<AdvanceFilters, 'employeeId' | 'status'>): Promise<ApiResponse<AdvanceStats>> {
    try {
      const params = new URLSearchParams();
      if (filters?.institutionId) params.append('institution_id', filters.institutionId);
      if (filters?.branchId) params.append('branch_id', filters.branchId);
      if (filters?.startDate) params.append('start_date', filters.startDate);
      if (filters?.endDate) params.append('end_date', filters.endDate);

      const url = `/api/advances/stats${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch advance statistics'
      };
    }
  },

  // Calculate monthly deduction for an employee
  async calculateMonthlyDeduction(employeeId: string): Promise<ApiResponse<{
    employeeId: string;
    totalMonthlyDeduction: number;
    activeAdvances: any[];
    advancesCount: number;
  }>> {
    try {
      const response = await fetch(`/api/advances/auto-deduct?employee_id=${employeeId}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to calculate monthly deduction'
      };
    }
  },

  // Process automatic deductions for an employee in a payroll run
  async processAutoDeduction(employeeId: string, payrollRunId: string): Promise<ApiResponse<{
    totalDeduction: number;
    deductionsCount: number;
    deductions: any[];
  }>> {
    try {
      const response = await fetch('/api/advances/auto-deduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, payrollRunId }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process automatic deduction'
      };
    }
  },

  // Preview deductions for all employees
  async previewDeductions(filters?: { institutionId?: string; branchId?: string }): Promise<ApiResponse<{
    employees: any[];
    summary: {
      totalEmployees: number;
      totalDeductions: number;
      averageDeduction: number;
    };
  }>> {
    try {
      const params = new URLSearchParams();
      if (filters?.institutionId) params.append('institution_id', filters.institutionId);
      if (filters?.branchId) params.append('branch_id', filters.branchId);

      const url = `/api/advances/preview-deductions${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to preview deductions'
      };
    }
  }
};
