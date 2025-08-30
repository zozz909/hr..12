import { useState, useEffect, useCallback } from 'react';
import { institutionApi, employeeApi } from '@/lib/api-client';
import { Institution, Employee } from '@/types';

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
    institutions,
    loading,
    error,
    refetch: fetchInstitutions
  };
}

// Simple hook for employees
export function useEmployees(filters?: { search?: string; institutionId?: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeApi.getAll(filters);

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
  }, [filters?.search, filters?.institutionId]);

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