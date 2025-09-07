import { useState, useEffect } from 'react'

/**
 * Hook للتأخير في تنفيذ القيم المتغيرة (debounce)
 * مفيد للبحث لتجنب استدعاء API مع كل حرف
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // إعداد timer لتأخير تحديث القيمة
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // تنظيف timer إذا تغيرت القيمة قبل انتهاء التأخير
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook للبحث مع debounce
 * يؤخر تنفيذ البحث حتى يتوقف المستخدم عن الكتابة
 */
export function useDebouncedSearch(initialValue = '', delay = 500) {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const debouncedSearchTerm = useDebounce(searchTerm, delay)

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
  }
}
