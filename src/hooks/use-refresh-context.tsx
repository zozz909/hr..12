'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface RefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
  isRefreshing: boolean;
  setIsRefreshing: (refreshing: boolean) => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{
      refreshTrigger,
      triggerRefresh,
      isRefreshing,
      setIsRefreshing
    }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}

// Hook للاستماع لتحديثات المستندات
export function useDocumentRefresh() {
  const { refreshTrigger, triggerRefresh } = useRefresh();

  // دالة لتحديث البيانات بعد تجديد المستندات
  const refreshAfterDocumentUpdate = useCallback(() => {
    // إضافة تأخير قصير للتأكد من تحديث قاعدة البيانات
    setTimeout(() => {
      triggerRefresh();
    }, 1000);
  }, [triggerRefresh]);

  // دالة لتحديث فوري بدون تأخير
  const refreshImmediately = useCallback(() => {
    triggerRefresh();
  }, [triggerRefresh]);

  return {
    refreshTrigger,
    refreshAfterDocumentUpdate,
    refreshImmediately
  };
}

// Hook عالمي للتحديث من أي مكان في التطبيق
export function useGlobalRefresh() {
  const { triggerRefresh } = useRefresh();

  // دالة لتحديث الإحصائيات من أي صفحة
  const refreshDashboardStats = useCallback(() => {
    // تحديث فوري
    triggerRefresh();

    // إضافة event للنافذة لتحديث جميع المكونات
    window.dispatchEvent(new CustomEvent('dashboard-refresh'));
  }, [triggerRefresh]);

  return {
    refreshDashboardStats
  };
}
