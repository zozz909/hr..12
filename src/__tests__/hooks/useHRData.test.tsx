import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useInstitutions, useEmployees } from '@/hooks/useHRData'
import { mockInstitution, mockEmployee, mockApiResponse } from '../utils/test-utils'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  institutionApi: {
    getAll: jest.fn(),
  },
  employeeApi: {
    getAll: jest.fn(),
  },
}))

const { institutionApi, employeeApi } = require('@/lib/api-client')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useHRData Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useInstitutions', () => {
    it('fetches institutions successfully', async () => {
      const mockInstitutions = [mockInstitution]
      institutionApi.getAll.mockResolvedValue(mockApiResponse(mockInstitutions))

      const { result } = renderHook(() => useInstitutions(), {
        wrapper: createWrapper(),
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.institutions).toEqual([])

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.institutions).toEqual(mockInstitutions)
      expect(result.current.data).toEqual(mockInstitutions)
      expect(result.current.error).toBe(null)
    })

    it('handles fetch error', async () => {
      const errorMessage = 'Failed to fetch institutions'
      institutionApi.getAll.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useInstitutions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.institutions).toEqual([])
      expect(result.current.error).toBe(errorMessage)
    })

    it('refetches data when refetch is called', async () => {
      const mockInstitutions = [mockInstitution]
      institutionApi.getAll.mockResolvedValue(mockApiResponse(mockInstitutions))

      const { result } = renderHook(() => useInstitutions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear the mock and set up new data
      institutionApi.getAll.mockClear()
      const newMockInstitutions = [{ ...mockInstitution, name: 'Updated Institution' }]
      institutionApi.getAll.mockResolvedValue(mockApiResponse(newMockInstitutions))

      // Call refetch
      await result.current.refetch()

      expect(institutionApi.getAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('useEmployees', () => {
    it('fetches employees successfully', async () => {
      const mockEmployees = [mockEmployee]
      employeeApi.getAll.mockResolvedValue(mockApiResponse(mockEmployees))

      const { result } = renderHook(() => useEmployees(), {
        wrapper: createWrapper(),
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.employees).toEqual([])

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.employees).toEqual(mockEmployees)
      expect(result.current.error).toBe(null)
    })

    it('fetches employees with filters', async () => {
      const mockEmployees = [mockEmployee]
      employeeApi.getAll.mockResolvedValue(mockApiResponse(mockEmployees))

      const filters = { search: 'أحمد', institutionId: 'inst-1' }
      const { result } = renderHook(() => useEmployees(filters), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(employeeApi.getAll).toHaveBeenCalledWith(filters)
      expect(result.current.employees).toEqual(mockEmployees)
    })

    it('handles fetch error', async () => {
      const errorMessage = 'Failed to fetch employees'
      employeeApi.getAll.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useEmployees(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.employees).toEqual([])
      expect(result.current.error).toBe(errorMessage)
    })
  })
})
