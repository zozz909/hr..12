import { NextRequest, NextResponse } from 'next/server'

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  FILE_UPLOAD = 'FILE_UPLOAD',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL = 'INTERNAL',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly timestamp: string
  public readonly requestId?: string
  public readonly userId?: string
  public readonly metadata?: Record<string, any>

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode: number = 500,
    isOperational: boolean = true,
    metadata?: Record<string, any>
  ) {
    super(message)
    
    this.type = type
    this.severity = severity
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()
    this.metadata = metadata
    
    Error.captureStackTrace(this, this.constructor)
  }
}

// Error logger
export class ErrorLogger {
  private static instance: ErrorLogger
  private logs: any[] = []

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  public async log(error: Error | AppError, context?: Record<string, any>) {
    const errorLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      type: error instanceof AppError ? error.type : ErrorType.INTERNAL,
      severity: error instanceof AppError ? error.severity : ErrorSeverity.MEDIUM,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      isOperational: error instanceof AppError ? error.isOperational : false,
      context,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    }

    // Store in memory (in production, send to external service)
    this.logs.push(errorLog)

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error('ERROR LOG:', JSON.stringify(errorLog, null, 2))
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      await this.sendToMonitoringService(errorLog)
    }

    // Send critical errors immediately
    if (error instanceof AppError && error.severity === ErrorSeverity.CRITICAL) {
      await this.sendCriticalAlert(errorLog)
    }
  }

  private async sendToMonitoringService(errorLog: any) {
    try {
      // Example: Send to Sentry, LogRocket, or custom service
      // await fetch('https://monitoring-service.com/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog)
      // })
      
      console.log('PRODUCTION ERROR:', errorLog)
    } catch (err) {
      console.error('Failed to send error to monitoring service:', err)
    }
  }

  private async sendCriticalAlert(errorLog: any) {
    try {
      // Send email, SMS, or Slack notification for critical errors
      console.error('CRITICAL ERROR ALERT:', errorLog)
      
      // Example: Send to notification service
      // await notificationService.sendCriticalAlert(errorLog)
    } catch (err) {
      console.error('Failed to send critical alert:', err)
    }
  }

  public getLogs(limit = 100): any[] {
    return this.logs.slice(-limit)
  }

  public getLogsByType(type: ErrorType, limit = 100): any[] {
    return this.logs.filter(log => log.type === type).slice(-limit)
  }

  public getLogsBySeverity(severity: ErrorSeverity, limit = 100): any[] {
    return this.logs.filter(log => log.severity === severity).slice(-limit)
  }
}

// Global error handler for API routes
export function withErrorHandler(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context)
    } catch (error) {
      const logger = ErrorLogger.getInstance()
      
      // Extract request context
      const requestContext = {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        requestId: request.headers.get('x-request-id'),
      }

      await logger.log(error as Error, requestContext)

      // Return appropriate error response
      if (error instanceof AppError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            type: error.type,
            timestamp: error.timestamp,
          },
          { status: error.statusCode }
        )
      }

      // Handle unknown errors
      return NextResponse.json(
        {
          success: false,
          error: 'حدث خطأ داخلي في الخادم',
          type: ErrorType.INTERNAL,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, any[]> = new Map()

  public static startTimer(operation: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      this.recordMetric(operation, {
        duration,
        timestamp: new Date().toISOString(),
      })
    }
  }

  public static recordMetric(operation: string, data: any) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    
    const metrics = this.metrics.get(operation)!
    metrics.push(data)
    
    // Keep only last 1000 metrics per operation
    if (metrics.length > 1000) {
      metrics.shift()
    }
  }

  public static getMetrics(operation: string): any[] {
    return this.metrics.get(operation) || []
  }

  public static getAverageTime(operation: string): number {
    const metrics = this.getMetrics(operation)
    if (metrics.length === 0) return 0
    
    const totalTime = metrics.reduce((sum, metric) => sum + metric.duration, 0)
    return totalTime / metrics.length
  }

  public static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    
    for (const [operation, metrics] of this.metrics.entries()) {
      result[operation] = {
        count: metrics.length,
        averageTime: this.getAverageTime(operation),
        lastRecorded: metrics[metrics.length - 1]?.timestamp,
      }
    }
    
    return result
  }
}

// Health check utilities
export class HealthChecker {
  private static checks: Map<string, () => Promise<boolean>> = new Map()

  public static registerCheck(name: string, checkFn: () => Promise<boolean>) {
    this.checks.set(name, checkFn)
  }

  public static async runAllChecks(): Promise<Record<string, any>> {
    const results: Record<string, any> = {}
    
    for (const [name, checkFn] of this.checks.entries()) {
      try {
        const startTime = performance.now()
        const isHealthy = await checkFn()
        const duration = performance.now() - startTime
        
        results[name] = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          responseTime: Math.round(duration),
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        results[name] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }
      }
    }
    
    return results
  }

  public static async getSystemHealth(): Promise<any> {
    const checks = await this.runAllChecks()
    const metrics = PerformanceMonitor.getAllMetrics()
    
    const overallStatus = Object.values(checks).every(
      (check: any) => check.status === 'healthy'
    ) ? 'healthy' : 'degraded'
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
    }
  }
}
