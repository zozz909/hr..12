import { employeeApi, institutionApi } from '@/lib/api-client'
import { mockEmployee, mockInstitution, mockApiResponse, mockApiError } from './test-utils'

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('Employee API', () => {
    it('fetches all employees successfully', async () => {
      const mockEmployees = [mockEmployee]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse(mockEmployees),
      } as Response)

      const result = await employeeApi.getAll()

      expect(mockFetch).toHaveBeenCalledWith('/api/employees', expect.any(Object))
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockEmployees)
    })

    it('handles employee fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockApiError('Failed to fetch employees'),
      } as Response)

      const result = await employeeApi.getAll()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch employees')
    })

    it('creates employee successfully', async () => {
      const newEmployee = { ...mockEmployee, id: 'emp-2' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse(newEmployee),
      } as Response)

      const employeeData = {
        name: newEmployee.name,
        mobile: newEmployee.mobile,
        email: newEmployee.email,
        fileNumber: newEmployee.fileNumber,
        nationality: newEmployee.nationality,
        status: newEmployee.status,
      }

      const result = await employeeApi.create(employeeData)

      expect(mockFetch).toHaveBeenCalledWith('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      })
      expect(result.success).toBe(true)
      expect(result.data).toEqual(newEmployee)
    })

    it('updates employee successfully', async () => {
      const updatedEmployee = { ...mockEmployee, name: 'محمد أحمد' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse(updatedEmployee),
      } as Response)

      const updateData = { name: 'محمد أحمد' }
      const result = await employeeApi.update(mockEmployee.id, updateData)

      expect(mockFetch).toHaveBeenCalledWith(`/api/employees/${mockEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedEmployee)
    })

    it('deletes employee successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse(null),
      } as Response)

      const result = await employeeApi.delete(mockEmployee.id)

      expect(mockFetch).toHaveBeenCalledWith(`/api/employees/${mockEmployee.id}`, {
        method: 'DELETE',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Institution API', () => {
    it('fetches all institutions successfully', async () => {
      const mockInstitutions = [mockInstitution]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse(mockInstitutions),
      } as Response)

      const result = await institutionApi.getAll()

      expect(mockFetch).toHaveBeenCalledWith('/api/institutions', expect.any(Object))
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockInstitutions)
    })

    it('creates institution successfully', async () => {
      const newInstitution = { ...mockInstitution, id: 'inst-2' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse(newInstitution),
      } as Response)

      const institutionData = {
        name: newInstitution.name,
        crNumber: newInstitution.crNumber,
        crExpiryDate: newInstitution.crExpiryDate,
        email: newInstitution.email,
        phone: newInstitution.phone,
        address: newInstitution.address,
      }

      const result = await institutionApi.create(institutionData)

      expect(mockFetch).toHaveBeenCalledWith('/api/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(institutionData),
      })
      expect(result.success).toBe(true)
      expect(result.data).toEqual(newInstitution)
    })
  })
})
