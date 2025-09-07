import { NextRequest, NextResponse } from 'next/server'
import { HealthChecker } from '@/lib/monitoring/error-handler'
import { executeQuery } from '@/lib/db'

// Register health checks
HealthChecker.registerCheck('database', async () => {
  try {
    await executeQuery('SELECT 1')
    return true
  } catch {
    return false
  }
})

HealthChecker.registerCheck('memory', async () => {
  const usage = process.memoryUsage()
  const maxMemory = 512 * 1024 * 1024 // 512MB limit
  return usage.heapUsed < maxMemory
})

HealthChecker.registerCheck('disk', async () => {
  // In production, check disk space
  // For now, always return true
  return true
})

export async function GET(request: NextRequest) {
  try {
    const health = await HealthChecker.getSystemHealth()
    
    const statusCode = health.status === 'healthy' ? 200 : 503
    
    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to check system health',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
