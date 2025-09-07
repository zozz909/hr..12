import { ApiResponse } from '@/types';

export interface Compensation {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeePhotoUrl?: string;
  type: 'deduction' | 'reward';
  amount: number;
  reason: string;
  date: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompensationStats {
  totalRewards: number;
  totalDeductions: number;
  rewardCount: number;
  deductionCount: number;
  netAmount: number;
}

export interface CompensationFilters {
  employeeId?: string;
  institutionId?: string;
  branchId?: string;
  type?: 'deduction' | 'reward';
  startDate?: string;
  endDate?: string;
}

export const compensationApi = {
  // Get all compensations with optional filters
  async getAll(filters?: CompensationFilters): Promise<ApiResponse<Compensation[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employee_id', filters.employeeId);
      if (filters?.institutionId) params.append('institution_id', filters.institutionId);
      if (filters?.branchId) params.append('branch_id', filters.branchId);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.startDate) params.append('start_date', filters.startDate);
      if (filters?.endDate) params.append('end_date', filters.endDate);

      const url = `/api/compensations${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch compensations'
      };
    }
  },

  // Get specific compensation by ID
  async getById(id: string): Promise<ApiResponse<Compensation>> {
    try {
      const response = await fetch(`/api/compensations/${id}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch compensation'
      };
    }
  },

  // Create new compensation
  async create(data: Omit<Compensation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Compensation>> {
    try {
      const response = await fetch('/api/compensations', {
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
        error: 'Failed to create compensation'
      };
    }
  },

  // Update compensation
  async update(id: string, data: Partial<Omit<Compensation, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Compensation>> {
    try {
      const response = await fetch(`/api/compensations/${id}`, {
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
        error: 'Failed to update compensation'
      };
    }
  },

  // Delete compensation
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/compensations/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete compensation'
      };
    }
  },

  // Get compensation statistics
  async getStats(filters?: Omit<CompensationFilters, 'employeeId' | 'type'>): Promise<ApiResponse<CompensationStats>> {
    try {
      const params = new URLSearchParams();
      if (filters?.institutionId) params.append('institution_id', filters.institutionId);
      if (filters?.branchId) params.append('branch_id', filters.branchId);
      if (filters?.startDate) params.append('start_date', filters.startDate);
      if (filters?.endDate) params.append('end_date', filters.endDate);

      const url = `/api/compensations/stats${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch compensation statistics'
      };
    }
  }
};
