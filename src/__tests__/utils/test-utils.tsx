import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data generators
export const mockEmployee = {
  id: 'emp-1',
  name: 'أحمد محمد',
  mobile: '0501234567',
  email: 'ahmed@example.com',
  fileNumber: 'EMP001',
  nationality: 'سعودي',
  position: 'مطور',
  institutionId: 'inst-1',
  branchId: 'branch-1',
  salary: 5000,
  status: 'active' as const,
  iqamaNumber: '1234567890',
  iqamaExpiry: '2025-12-31',
  workPermitExpiry: '2025-12-31',
  contractExpiry: '2025-12-31',
  healthInsuranceExpiry: '2025-12-31',
  healthCertExpiry: '2025-12-31',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const mockInstitution = {
  id: 'inst-1',
  name: 'شركة التقنية المتقدمة',
  crNumber: 'CR123456789',
  crExpiryDate: '2025-12-31',
  email: 'info@company.com',
  phone: '0112345678',
  address: 'الرياض، المملكة العربية السعودية',
  status: 'active' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const mockBranch = {
  id: 'branch-1',
  name: 'الفرع الرئيسي',
  code: 'MAIN',
  institutionId: 'inst-1',
  address: 'الرياض',
  phone: '0112345678',
  email: 'main@company.com',
  status: 'active' as const,
  managerId: 'user-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const mockUser = {
  id: 'user-1',
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin' as const,
  status: 'active' as const,
  permissions: ['read', 'write', 'delete'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

// API response helpers
export const mockApiResponse = <T>(data: T, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
})

export const mockApiError = (message = 'Something went wrong') => ({
  success: false,
  error: message,
})
