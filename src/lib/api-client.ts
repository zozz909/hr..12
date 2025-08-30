// API Client for HR Management System
// Centralized API calls with error handling and type safety

import { Institution, Employee, ApiResponse } from '@/types';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Generic API client class
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}/api${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;

    return this.request<T>(url, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new ApiClient();

// Institution API methods
export const institutionApi = {
  // Get all institutions
  getAll: (params?: { expiring?: boolean; days?: number }) => {
    const queryParams: Record<string, string> = {};
    if (params?.expiring) queryParams.expiring = 'true';
    if (params?.days) queryParams.days = params.days.toString();

    return apiClient.get<Institution[]>('/institutions', queryParams);
  },

  // Get institution by ID
  getById: (id: string, options?: { includeDocuments?: boolean; includeSubscriptions?: boolean }) => {
    const queryParams: Record<string, string> = {};
    if (options?.includeDocuments) queryParams.include_documents = 'true';
    if (options?.includeSubscriptions) queryParams.include_subscriptions = 'true';

    return apiClient.get<Institution>(`/institutions/${id}`, queryParams);
  },

  // Create new institution
  create: (data: Omit<Institution, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiClient.post<Institution>('/institutions', data);
  },

  // Update institution
  update: (id: string, data: Partial<Institution>) => {
    return apiClient.put<Institution>(`/institutions/${id}`, data);
  },

  // Delete institution
  delete: (id: string) => {
    return apiClient.delete(`/institutions/${id}`);
  },

  // Get expiring licenses
  getExpiringLicenses: (days: number = 30) => {
    return apiClient.get<Institution[]>('/institutions', { expiring: 'true', days: days.toString() });
  },
};

// Employee API methods
export const employeeApi = {
  // Get all employees
  getAll: (params?: {
    institutionId?: string;
    branchId?: string;
    status?: 'active' | 'archived';
    search?: string;
    unsponsored?: boolean;
    expiring?: boolean;
    days?: number;
  }) => {
    const queryParams: Record<string, string> = {};
    if (params?.institutionId) queryParams.institution_id = params.institutionId;
    if (params?.branchId) queryParams.branch_id = params.branchId;
    if (params?.status) queryParams.status = params.status;
    if (params?.search) queryParams.search = params.search;
    if (params?.unsponsored) queryParams.unsponsored = 'true';
    if (params?.expiring) queryParams.expiring = 'true';
    if (params?.days) queryParams.days = params.days.toString();

    return apiClient.get<Employee[]>('/employees', queryParams);
  },

  // Get employee by ID
  getById: (id: string, options?: { includeDocuments?: boolean }) => {
    const queryParams: Record<string, string> = {};
    if (options?.includeDocuments) queryParams.include_documents = 'true';

    return apiClient.get<Employee>(`/employees/${id}`, queryParams);
  },

  // Create new employee
  create: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiClient.post<Employee>('/employees', data);
  },

  // Update employee
  update: (id: string, data: Partial<Employee>) => {
    return apiClient.put<Employee>(`/employees/${id}`, data);
  },

  // Transfer employee
  transfer: (id: string, newInstitutionId: string | null, reason?: string) => {
    return apiClient.put<Employee>(`/employees/${id}?action=transfer`, {
      newInstitutionId,
      reason,
    });
  },

  // Archive employee
  archive: (id: string, reason: 'terminated' | 'final_exit') => {
    return apiClient.put(`/employees/${id}?action=archive`, { reason });
  },

  // Delete employee (archive)
  delete: (id: string, reason: 'terminated' | 'final_exit' = 'terminated') => {
    return apiClient.delete(`/employees/${id}?reason=${reason}`);
  },

  // Get unsponsored employees
  getUnsponsored: () => {
    return apiClient.get<Employee[]>('/employees', { unsponsored: 'true' });
  },

  // Get employees with expiring documents
  getExpiringDocuments: (days: number = 30) => {
    return apiClient.get<Employee[]>('/employees', { expiring: 'true', days: days.toString() });
  },
};

// Document API methods
export const documentApi = {
  // Get all documents
  getAll: (params?: {
    entityType?: 'employee' | 'institution';
    entityId?: string;
    documentType?: string;
    expiring?: boolean;
    expired?: boolean;
    days?: number;
  }) => {
    const queryParams: Record<string, string> = {};
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.entityId) queryParams.entity_id = params.entityId;
    if (params?.documentType) queryParams.document_type = params.documentType;
    if (params?.expiring) queryParams.expiring = 'true';
    if (params?.expired) queryParams.expired = 'true';
    if (params?.days) queryParams.days = params.days.toString();

    return apiClient.get<any[]>('/documents', queryParams);
  },

  // Get document by ID
  getById: (id: string) => {
    return apiClient.get<any>(`/documents/${id}`);
  },

  // Get all documents for an entity (helper function)
  getByEntityId: (entityType: 'employee' | 'institution', entityId: string) => {
    return documentApi.getAll({ entityType, entityId });
  },

  // Upload/Create new document
  create: (data: {
    entityType: 'employee' | 'institution';
    entityId: string;
    documentType: string;
    fileName: string;
    filePath?: string;
    fileUrl?: string;
    expiryDate?: string;
    originalName?: string;
    fileSize?: number;
    mimeType?: string;
  }) => {
    return apiClient.post<any>('/documents', data);
  },

  // Update document
  update: (id: string, data: {
    fileName?: string;
    filePath?: string;
    fileUrl?: string;
    expiryDate?: string;
    documentType?: string;
  }) => {
    return apiClient.put<any>(`/documents/${id}`, data);
  },

  // Delete document
  delete: (id: string) => {
    return apiClient.delete(`/documents/${id}`);
  },

  // Get expiring documents
  getExpiring: (days: number = 30) => {
    return apiClient.get<any[]>('/documents', { expiring: 'true', days: days.toString() });
  },

  // Get expired documents
  getExpired: () => {
    return apiClient.get<any[]>('/documents', { expired: 'true' });
  },
};

// Utility functions for error handling and notifications
export const handleApiError = (error: ApiResponse<any>, defaultMessage: string = 'An error occurred') => {
  console.error('API Error:', error);
  return error.error || error.message || defaultMessage;
};

export const showApiSuccess = (response: ApiResponse<any>, defaultMessage: string = 'Operation successful') => {
  return response.message || defaultMessage;
};

// Branch API endpoints
export const branchApi = {
  // Get all branches
  getAll: (params?: { institutionId?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params?.institutionId) queryParams.institution_id = params.institutionId;

    return apiClient.get<Branch[]>('/branches', queryParams);
  },

  // Get branch by ID
  getById: (id: string) => {
    return apiClient.get<Branch>(`/branches/${id}`);
  },

  // Create new branch
  create: (data: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiClient.post<Branch>('/branches', data);
  },

  // Update branch
  update: (id: string, data: Partial<Branch>) => {
    return apiClient.put<Branch>(`/branches/${id}`, data);
  },

  // Delete branch
  delete: (id: string) => {
    return apiClient.delete(`/branches/${id}`);
  },

  // Transfer employee to branch
  transferEmployee: (employeeId: string, branchId: string) => {
    return apiClient.post(`/employees/${employeeId}/transfer`, { branchId });
  },

  // Get employees by branch
  getEmployees: (branchId: string) => {
    return apiClient.get<Employee[]>(`/branches/${branchId}/employees`);
  }
};

// Subscription API
export const subscriptionApi = {
  // Get all subscriptions for an institution
  getByInstitutionId: (institutionId: string) => {
    return apiClient.get<any[]>('/subscriptions', { institution_id: institutionId });
  },

  // Get subscription by ID
  getById: (id: string) => {
    return apiClient.get<any>(`/subscriptions/${id}`);
  },

  // Create new subscription
  create: (data: any) => {
    return apiClient.post<any>('/subscriptions', data);
  },

  // Update subscription
  update: (id: string, data: any) => {
    return apiClient.put<any>(`/subscriptions/${id}`, data);
  },

  // Delete subscription
  delete: (id: string) => {
    return apiClient.delete(`/subscriptions/${id}`);
  }
};

// API response type is now imported from @/types