import { NextRequest, NextResponse } from 'next/server'
import { ErrorLogger, ErrorType, ErrorSeverity } from '@/lib/monitoring/error-handler'
// import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access (simplified for now)
    // const auth = await verifyAuth(request)
    // if (!auth.success || auth.user?.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ErrorType
    const severity = searchParams.get('severity') as ErrorSeverity
    const limit = parseInt(searchParams.get('limit') || '100')

    const logger = ErrorLogger.getInstance()
    let logs

    if (type) {
      logs = logger.getLogsByType(type, limit)
    } else if (severity) {
      logs = logger.getLogsBySeverity(severity, limit)
    } else {
      logs = logger.getLogs(limit)
    }

    return NextResponse.json({
      success: true,
      data: logs,
      total: logs.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch error logs',
      },
      { status: 500 }
    )
  }
}
