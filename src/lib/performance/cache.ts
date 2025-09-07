// Simple in-memory cache implementation
export class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { data, expiry })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    
    if (!item) {
      return false
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  size(): number {
    // Clean expired items first
    this.cleanExpired()
    return this.cache.size
  }

  private cleanExpired(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    this.cleanExpired()
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Global cache instance
export const globalCache = new MemoryCache()

// Cache decorator for functions
export function cached(ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`
      
      // Try to get from cache first
      const cachedResult = globalCache.get(cacheKey)
      if (cachedResult !== null) {
        return cachedResult
      }

      // Execute the method and cache the result
      const result = await method.apply(this, args)
      globalCache.set(cacheKey, result, ttl)
      
      return result
    }
  }
}

// Cache helper functions
export const cacheHelpers = {
  // Generate cache key for API responses
  generateApiCacheKey: (endpoint: string, params?: Record<string, any>): string => {
    const paramString = params ? JSON.stringify(params) : ''
    return `api:${endpoint}:${paramString}`
  },

  // Generate cache key for database queries
  generateDbCacheKey: (table: string, query: string, params?: any[]): string => {
    const paramString = params ? JSON.stringify(params) : ''
    return `db:${table}:${query}:${paramString}`
  },

  // Cache API response
  cacheApiResponse: (key: string, data: any, ttl = 5 * 60 * 1000): void => {
    globalCache.set(key, data, ttl)
  },

  // Get cached API response
  getCachedApiResponse: (key: string): any | null => {
    return globalCache.get(key)
  },

  // Invalidate cache by pattern
  invalidateByPattern: (pattern: string): void => {
    const keys = globalCache.getStats().keys
    const regex = new RegExp(pattern)
    
    keys.forEach(key => {
      if (regex.test(key)) {
        globalCache.delete(key)
      }
    })
  },

  // Cache database query result
  cacheDbQuery: (query: string, params: any[], result: any, ttl = 2 * 60 * 1000): void => {
    const key = cacheHelpers.generateDbCacheKey('query', query, params)
    globalCache.set(key, result, ttl)
  },

  // Get cached database query result
  getCachedDbQuery: (query: string, params: any[]): any | null => {
    const key = cacheHelpers.generateDbCacheKey('query', query, params)
    return globalCache.get(key)
  },
}

// Performance optimization utilities
export class PerformanceOptimizer {
  // Debounce function calls
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null
    
    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout)
      }
      
      timeout = setTimeout(() => {
        func(...args)
      }, wait)
    }
  }

  // Throttle function calls
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => {
          inThrottle = false
        }, limit)
      }
    }
  }

  // Batch multiple operations
  static createBatcher<T>(
    batchFn: (items: T[]) => Promise<void>,
    maxBatchSize = 10,
    maxWaitTime = 1000
  ) {
    let batch: T[] = []
    let timeout: NodeJS.Timeout | null = null

    const processBatch = async () => {
      if (batch.length === 0) return
      
      const currentBatch = [...batch]
      batch = []
      
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      
      await batchFn(currentBatch)
    }

    return (item: T) => {
      batch.push(item)
      
      if (batch.length >= maxBatchSize) {
        processBatch()
      } else if (!timeout) {
        timeout = setTimeout(processBatch, maxWaitTime)
      }
    }
  }

  // Lazy loading helper
  static createLazyLoader<T>(
    loadFn: () => Promise<T>
  ): () => Promise<T> {
    let promise: Promise<T> | null = null
    
    return () => {
      if (!promise) {
        promise = loadFn()
      }
      return promise
    }
  }

  // Memory usage monitoring
  static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage()
  }

  // Check if memory usage is high
  static isMemoryUsageHigh(threshold = 0.8): boolean {
    const usage = this.getMemoryUsage()
    const totalMemory = usage.heapTotal
    const usedMemory = usage.heapUsed
    
    return (usedMemory / totalMemory) > threshold
  }

  // Force garbage collection if available
  static forceGarbageCollection(): void {
    if (global.gc) {
      global.gc()
    }
  }
}

// Database query optimization
export class QueryOptimizer {
  private static queryCache = new MemoryCache()

  // Cache database queries
  static async cachedQuery(
    query: string,
    params: any[] = [],
    ttl = 2 * 60 * 1000
  ): Promise<any> {
    const cacheKey = cacheHelpers.generateDbCacheKey('query', query, params)
    
    // Try cache first
    const cached = this.queryCache.get(cacheKey)
    if (cached !== null) {
      return cached
    }

    // Execute query (this would be replaced with actual DB call)
    // const result = await executeQuery(query, params)
    const result = [] // Placeholder
    
    // Cache the result
    this.queryCache.set(cacheKey, result, ttl)
    
    return result
  }

  // Invalidate query cache
  static invalidateQueryCache(pattern?: string): void {
    if (pattern) {
      cacheHelpers.invalidateByPattern(pattern)
    } else {
      this.queryCache.clear()
    }
  }

  // Batch database operations
  static createQueryBatcher(
    executeFn: (queries: Array<{ query: string; params: any[] }>) => Promise<any[]>
  ) {
    return PerformanceOptimizer.createBatcher(executeFn, 5, 100)
  }
}

// Image optimization utilities
export class ImageOptimizer {
  // Generate responsive image URLs
  static generateResponsiveUrls(
    baseUrl: string,
    sizes: number[] = [320, 640, 1024, 1920]
  ): Record<string, string> {
    const urls: Record<string, string> = {}
    
    sizes.forEach(size => {
      urls[`${size}w`] = `${baseUrl}?w=${size}&q=75`
    })
    
    return urls
  }

  // Generate WebP alternative
  static generateWebPUrl(imageUrl: string): string {
    return `${imageUrl}&format=webp`
  }

  // Check if browser supports WebP
  static supportsWebP(userAgent: string): boolean {
    return /Chrome|Firefox|Edge|Opera/.test(userAgent)
  }
}
