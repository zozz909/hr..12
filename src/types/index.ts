// Client-side types for HR Management System
// These types are used in the frontend and don't import server-side modules

export interface Institution {
  id: string;
  name: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  crNumber: string;
  crIssueDate?: string;
  crExpiryDate: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
  employeeCount?: number;
  documents?: InstitutionDocument[];
  subscriptions?: Subscription[];
}

export interface InstitutionDocument {
  id: string;
  institutionId: string;
  name: string;
  filePath?: string;
  fileUrl?: string;
  documentType: 'license' | 'commercial_record' | 'tax_certificate' | 'other';
  uploadDate?: string;
  createdAt?: string;
}

export interface Subscription {
  id: string;
  institutionId: string;
  name: string;
  icon?: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'expiring_soon';
  createdAt?: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  institutionId?: string | null; // Optional - for independent branches
  institutionName?: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  managerName?: string;
  status: 'active' | 'inactive';
  employeeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

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

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: 'iqama' | 'passport' | 'contract' | 'health_certificate' | 'insurance' | 'work_permit' | 'other';
  fileName: string;
  filePath?: string;
  fileUrl?: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'expiring_soon';
  uploadDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subscription {
  id: string;
  institutionId: string;
  name: string;
  icon: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'expiring_soon';
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
  count?: number;
}