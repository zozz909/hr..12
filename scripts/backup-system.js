const { backupManager, backupScheduler } = require('../src/lib/backup/backup-manager')

async function runBackupSystem() {
  console.log('🔄 بدء نظام النسخ الاحتياطي...')
  
  try {
    // Initialize backup system
    await backupManager.initialize()
    
    // Get command line arguments
    const args = process.argv.slice(2)
    const command = args[0]
    
    switch (command) {
      case 'create':
        console.log('📦 إنشاء نسخة احتياطية...')
        const backup = await backupManager.createFullBackup()
        console.log('✅ تم إنشاء النسخة الاحتياطية:', backup.filename)
        break
        
      case 'list':
        console.log('📋 قائمة النسخ الاحتياطية:')
        const backups = await backupManager.listBackups()
        if (backups.length === 0) {
          console.log('لا توجد نسخ احتياطية')
        } else {
          backups.forEach(backup => {
            console.log(`- ${backup.filename} (${formatFileSize(backup.size)}) - ${new Date(backup.createdAt).toLocaleString('ar-SA')}`)
          })
        }
        break
        
      case 'restore':
        const filename = args[1]
        if (!filename) {
          console.error('❌ يرجى تحديد اسم الملف للاستعادة')
          process.exit(1)
        }
        console.log(`🔄 استعادة من النسخة الاحتياطية: ${filename}`)
        await backupManager.restoreFromBackup(filename)
        console.log('✅ تمت الاستعادة بنجاح')
        break
        
      case 'clean':
        console.log('🧹 تنظيف النسخ الاحتياطية القديمة...')
        await backupManager.cleanOldBackups()
        console.log('✅ تم تنظيف النسخ القديمة')
        break
        
      case 'schedule':
        const hours = parseInt(args[1]) || 24
        console.log(`⏰ جدولة النسخ الاحتياطية كل ${hours} ساعة`)
        backupScheduler.scheduleBackups(hours)
        
        // Keep the process running
        process.on('SIGINT', () => {
          console.log('\n🛑 إيقاف النسخ الاحتياطي المجدول...')
          backupScheduler.stopScheduledBackups()
          process.exit(0)
        })
        
        console.log('✅ تم تفعيل النسخ الاحتياطي المجدول (اضغط Ctrl+C للإيقاف)')
        break
        
      case 'auto':
        console.log('🤖 تشغيل النسخ الاحتياطي التلقائي...')
        
        // Create initial backup
        await backupManager.createFullBackup()
        
        // Schedule regular backups (every 6 hours)
        backupScheduler.scheduleBackups(6)
        
        // Clean old backups daily
        setInterval(async () => {
          try {
            await backupManager.cleanOldBackups()
          } catch (error) {
            console.error('خطأ في تنظيف النسخ القديمة:', error)
          }
        }, 24 * 60 * 60 * 1000) // 24 hours
        
        // Keep the process running
        process.on('SIGINT', () => {
          console.log('\n🛑 إيقاف النظام التلقائي...')
          backupScheduler.stopScheduledBackups()
          process.exit(0)
        })
        
        console.log('✅ النظام التلقائي يعمل (اضغط Ctrl+C للإيقاف)')
        break
        
      default:
        console.log(`
📖 استخدام نظام النسخ الاحتياطي:

الأوامر المتاحة:
  create              إنشاء نسخة احتياطية جديدة
  list                عرض قائمة النسخ الاحتياطية
  restore <filename>  استعادة من نسخة احتياطية
  clean               حذف النسخ الاحتياطية القديمة
  schedule [hours]    جدولة النسخ الاحتياطية (افتراضي: 24 ساعة)
  auto                تشغيل النظام التلقائي (نسخ كل 6 ساعات)

أمثلة:
  node scripts/backup-system.js create
  node scripts/backup-system.js list
  node scripts/backup-system.js restore backup_1234567890_2024-01-01.sql.gz
  node scripts/backup-system.js schedule 12
  node scripts/backup-system.js auto
        `)
        break
    }
    
  } catch (error) {
    console.error('❌ خطأ في نظام النسخ الاحتياطي:', error)
    process.exit(1)
  }
}

function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run the backup system
runBackupSystem()
