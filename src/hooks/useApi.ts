import { useState, useEffect, useCallback } from 'react';
import { ApiResponse } from '@/types';

// Generic hook for API calls with loading and error states
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(dependencies)]); // Use JSON.stringify to avoid reference issues

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook for API mutations (create, update, delete)
export function useApiMutation<T, P = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (
    apiCall: (params: P) => Promise<ApiResponse<T>>
  ) => {
    return async (params: P): Promise<{ success: boolean; data?: T; error?: string }> => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiCall(params);

        if (response.success) {
          return { success: true, data: response.data };
        } else {
          const errorMessage = response.error || 'Operation failed';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    };
  }, []);

  return { mutate, loading, error };
}

// Hook for managing form state with API integration
export function useApiForm<T>(initialData: T) {
  const [formData, setFormData] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const updateForm = useCallback((data: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setIsDirty(true);
  }, []);

  const resetForm = useCallback((data?: T) => {
    setFormData(data || initialData);
    setIsDirty(false);
  }, [initialData]);

  return {
    formData,
    isDirty,
    updateField,
    updateForm,
    resetForm,
    setFormData
  };
}

// Simplified hook for API lists to avoid infinite loops
export function useApiList<T>(
  apiCall: (params?: any) => Promise<ApiResponse<T[]>>,
  initialFilters: any = {}
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(() => initialFilters);

  const fetchItems = useCallback(async (params?: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(params || filters);

      if (response.success && response.data) {
        setItems(response.data);
      } else {
        setError(response.error || 'Failed to fetch items');
        setItems([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Initial fetch
  useEffect(() => {
    fetchItems(filters);
  }, []); // Only run once on mount

  const updateFilters = useCallback((newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchItems(updatedFilters);
  }, [filters, fetchItems]);

  const refetch = useCallback(() => {
    fetchItems(filters);
  }, [fetchItems, filters]);

  const addItem = useCallback((item: T) => {
    setItems(prev => [item, ...prev]);
  }, []);

  const updateItem = useCallback((id: string, updatedItem: T) => {
    setItems(prev => prev.map(item =>
      (item as any).id === id ? updatedItem : item
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => (item as any).id !== id));
  }, []);

  return {
    items,
    loading,
    error,
    filters,
    updateFilters,
    refetch,
    addItem,
    updateItem,
    removeItem
  };
}