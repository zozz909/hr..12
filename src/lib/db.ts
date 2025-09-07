import mysql from 'serverless-mysql';
import { cacheHelpers } from '@/lib/performance/cache';
import { PerformanceMonitor } from '@/lib/monitoring/error-handler';

export const db = mysql({
  config: {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '123',
    database: process.env.MYSQL_DATABASE || 'hr_system',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    charset: 'utf8mb4',
    // إزالة timezone لتجنب مشاكل MariaDB
    // timezone: 'UTC'
  },
  // Set a longer timeout for serverless environments
});

export async function executeQuery(query: string, values: any[] = [], useCache = false): Promise<any> {
  const endTimer = PerformanceMonitor.startTimer('database_query');

  try {
    // Check cache for SELECT queries if caching is enabled
    if (useCache && query.trim().toLowerCase().startsWith('select')) {
      const cacheKey = cacheHelpers.generateDbCacheKey('query', query, values);
      const cached = cacheHelpers.getCachedDbQuery(query, values);

      if (cached !== null) {
        endTimer();
        return cached;
      }
    }

    const results = await db.query(query, values);
    await db.end();

    // Cache SELECT query results if caching is enabled
    if (useCache && query.trim().toLowerCase().startsWith('select')) {
      cacheHelpers.cacheDbQuery(query, values, results);
    }

    endTimer();
    return results;
  } catch (error) {
    endTimer();
    console.error('Database Query Error:', error);
    console.error('Query:', query);
    console.error('Values:', values);

    // إرسال الخطأ الأصلي للمطور مع تفاصيل أكثر
    if (error instanceof Error) {
      throw new Error(`Database Error: ${error.message}`);
    } else {
      throw new Error('An error occurred while accessing the database.');
    }
  }
}

// Optimized query function with automatic caching for read operations
export async function executeQueryCached(query: string, values: any[] = [], ttl = 2 * 60 * 1000): Promise<any> {
  return executeQuery(query, values, true);
}

// Batch query execution for better performance
export async function executeBatchQueries(queries: Array<{ query: string; values?: any[] }>): Promise<any[]> {
  const endTimer = PerformanceMonitor.startTimer('database_batch_query');

  try {
    const results = [];

    for (const { query, values = [] } of queries) {
      const result = await db.query(query, values);
      results.push(result);
    }

    await db.end();
    endTimer();
    return results;
  } catch (error) {
    endTimer();
    console.error('Batch Query Error:', error);
    throw new Error('An error occurred while executing batch queries.');
  }
}

// Helper function to generate unique IDs
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${prefix ? '-' : ''}${timestamp}-${random}`;
}

// Helper function to calculate document status based on expiry date
export function getDocumentStatus(expiryDate: string | Date | null): 'active' | 'expiring_soon' | 'expired' {
  if (!expiryDate) return 'active';

  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'expired';
  if (diffDays <= 30) return 'expiring_soon';
  return 'active';
}

// Helper function to format dates for MySQL
export function formatDateForMySQL(date: Date | string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// Database initialization function
export async function initializeDatabase(): Promise<void> {
  try {
    // Check if database exists, if not create it
    await executeQuery('CREATE DATABASE IF NOT EXISTS hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await executeQuery('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
