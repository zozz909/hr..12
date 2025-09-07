import { useState, useEffect, useCallback } from 'react';
import { institutionApi, employeeApi, leaveApi } from '@/lib/api-client';
import { Institution, Employee } from '@/types';
import { useDebounce } from './useDebounce';
import { LeaveRequest } from '@/lib/models/LeaveRequest';

// Simple hook for institutions
export function useInstitutions() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstitutions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await institutionApi.getAll();

      if (response.success && response.data) {
        setInstitutions(response.data);
      } else {
        setError(response.error || 'Failed to fetch institutions');
        setInstitutions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  return {
    data: institutions,
    institutions,
    loading,
    error,
    refetch: fetchInstitutions
  };
}

// Simple hook for employees with debounced search
export function useEmployees(filters?: { search?: string; institutionId?: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // استخدام debounce للبحث لتجنب استدعاء API مع كل حرف
  const debouncedSearch = useDebounce(filters?.search || '', 500);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // استخدام القيمة المؤخرة للبحث
      const searchFilters = {
        ...filters,
        search: debouncedSearch || undefined
      };

      const response = await employeeApi.getAll(searchFilters);

      if (response.success && response.data) {
        setEmployees(response.data);
      } else {
        setError(response.error || 'Failed to fetch employees');
        setEmployees([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters?.institutionId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    refetch: fetchEmployees
  };
}

// Hook for unsponsored employees
export function useUnsponsoredEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeApi.getUnsponsored();

      if (response.success && response.data) {
        setEmployees(response.data);
      } else {
        setError(response.error || 'Failed to fetch unsponsored employees');
        setEmployees([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    refetch: fetchEmployees
  };
}

// Hook for expiring documents
export function useExpiringEmployees(days: number = 30) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeApi.getExpiringDocuments(days);

      if (response.success && response.data) {
        setEmployees(response.data);
      } else {
        setError(response.error || 'Failed to fetch expiring employees');
        setEmployees([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    refetch: fetchEmployees
  };
}

// Hook for leave requests
export function useLeaveRequests(filters?: {
  employeeId?: string;
  institutionId?: string;
  branchId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  leaveType?: 'annual' | 'sick' | 'unpaid' | 'emergency';
  startDate?: string;
  endDate?: string;
}) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leaveApi.getAll(filters);

      if (response.success && response.data) {
        setLeaveRequests(response.data);
      } else {
        setError(response.error || 'Failed to fetch leave requests');
        setLeaveRequests([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.employeeId, filters?.institutionId, filters?.branchId, filters?.status, filters?.leaveType, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  return {
    leaveRequests,
    loading,
    error,
    refetch: fetchLeaveRequests
  };
}