import { ApiResponse } from '@/types';

export interface Employee {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  fileNumber: string;
  nationality: string;
  position?: string;
  branchId?: string | null;
  branchName?: string;
  photoUrl?: string;
  iqamaNumber?: string;
  iqamaExpiry?: string;
  workPermitExpiry?: string;
  contractExpiry?: string;
  healthInsuranceExpiry?: string;
  healthCertExpiry?: string;
  institutionId?: string | null;
  institutionName?: string;
  salary?: number;
  status: 'active' | 'archived';
  unsponsoredReason?: 'transferred' | 'new' | 'temporary_hold' | null;
  lastStatusUpdate?: string;
  archiveReason?: 'resignation' | 'termination' | 'retirement' | 'transfer' | 'contract_end' | 'medical_leave' | 'disciplinary' | 'other' | null;
  archivedAt?: string;
  archiveDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeFilters {
  institutionId?: string;
  branchId?: string;
  status?: 'active' | 'archived';
  search?: string;
}

export const employeeApi = {
  // Get all employees with optional filters
  async getAll(filters?: EmployeeFilters): Promise<ApiResponse<Employee[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.institutionId) params.append('institution_id', filters.institutionId);
      if (filters?.branchId) params.append('branch_id', filters.branchId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const url = `/api/employees${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch employees'
      };
    }
  },

  // Get specific employee by ID
  async getById(id: string): Promise<ApiResponse<Employee>> {
    try {
      const response = await fetch(`/api/employees/${id}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch employee'
      };
    }
  },

  // Create new employee
  async create(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Employee>> {
    try {
      const response = await fetch('/api/employees', {
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
        error: 'Failed to create employee'
      };
    }
  },

  // Update employee
  async update(id: string, data: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Employee>> {
    try {
      const response = await fetch(`/api/employees/${id}`, {
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
        error: 'Failed to update employee'
      };
    }
  },

  // Delete employee
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete employee'
      };
    }
  },

  // Archive employee
  async archive(id: string, reason: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/employees/${id}/archive`, {
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
        error: 'Failed to archive employee'
      };
    }
  }
};
