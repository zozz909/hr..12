import { NextRequest, NextResponse } from 'next/server'
import { backupManager } from '@/lib/backup/backup-manager'
// import { verifyAuth } from '@/lib/auth'
import { withErrorHandler } from '@/lib/monitoring/error-handler'

async function handleBackupRequest(request: NextRequest) {
  // Verify admin access (simplified for now)
  // const auth = await verifyAuth(request)
  // if (!auth.success || auth.user?.role !== 'admin') {
  //   return NextResponse.json(
  //     { success: false, error: 'Unauthorized' },
  //     { status: 401 }
  //   )
  // }

  const { method } = request
  const { searchParams } = new URL(request.url)

  switch (method) {
    case 'GET':
      // List backups
      const backups = await backupManager.listBackups()
      return NextResponse.json({
        success: true,
        data: backups,
      })

    case 'POST':
      const action = searchParams.get('action')
      
      if (action === 'create') {
        // Create new backup
        const backup = await backupManager.createFullBackup()
        return NextResponse.json({
          success: true,
          data: backup,
          message: 'تم إنشاء النسخة الاحتياطية بنجاح',
        })
      }
      
      if (action === 'restore') {
        const body = await request.json()
        const { filename } = body
        
        if (!filename) {
          return NextResponse.json(
            { success: false, error: 'اسم الملف مطلوب' },
            { status: 400 }
          )
        }
        
        await backupManager.restoreFromBackup(filename)
        return NextResponse.json({
          success: true,
          message: 'تمت استعادة النسخة الاحتياطية بنجاح',
        })
      }
      
      if (action === 'clean') {
        await backupManager.cleanOldBackups()
        return NextResponse.json({
          success: true,
          message: 'تم تنظيف النسخ الاحتياطية القديمة',
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'إجراء غير صحيح' },
        { status: 400 }
      )

    default:
      return NextResponse.json(
        { success: false, error: 'طريقة غير مدعومة' },
        { status: 405 }
      )
  }
}

export const GET = withErrorHandler(handleBackupRequest)
export const POST = withErrorHandler(handleBackupRequest)
