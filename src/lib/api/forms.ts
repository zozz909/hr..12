import { ApiResponse } from '@/types';

export interface AdminForm {
  id: string;
  title: string;
  description?: string;
  category: 'hr' | 'finance' | 'general';
  iconName?: string;
  iconColor?: string;
  filePath?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  downloadCount?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormFilters {
  category?: 'hr' | 'finance' | 'general';
  isActive?: boolean;
  search?: string;
}

export interface FormStats {
  totalForms: number;
  activeFormsCount: number;
  totalDownloads: number;
  categoryCounts: { [key: string]: number };
}

export const formsApi = {
  // Get all forms with optional filters
  async getAll(filters?: FormFilters): Promise<ApiResponse<AdminForm[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.isActive !== undefined) params.append('is_active', filters.isActive.toString());
      if (filters?.search) params.append('search', filters.search);

      const url = `/api/forms${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch forms'
      };
    }
  },

  // Get specific form by ID
  async getById(id: string): Promise<ApiResponse<AdminForm>> {
    try {
      const response = await fetch(`/api/forms/${id}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch form'
      };
    }
  },

  // Create new form
  async create(data: Omit<AdminForm, 'id' | 'downloadCount' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<AdminForm>> {
    try {
      const response = await fetch('/api/forms', {
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
        error: 'Failed to create form'
      };
    }
  },

  // Update form
  async update(id: string, data: Partial<Omit<AdminForm, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<AdminForm>> {
    try {
      const response = await fetch(`/api/forms/${id}`, {
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
        error: 'Failed to update form'
      };
    }
  },

  // Delete form
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete form'
      };
    }
  },

  // Download form file
  async download(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/forms/${id}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from response headers
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition 
          ? decodeURIComponent(contentDisposition.split('filename*=UTF-8\'\'')[1])
          : 'form_download';
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      throw new Error('Failed to download form');
    }
  },

  // Upload form file
  async uploadFile(formId: string, file: File): Promise<ApiResponse<{ filePath: string; fileUrl: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'form');
      formData.append('entityId', formId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to upload file'
      };
    }
  },

  // Get forms statistics
  async getStats(): Promise<ApiResponse<FormStats>> {
    try {
      const response = await fetch('/api/forms/stats');
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch forms statistics'
      };
    }
  }
};
