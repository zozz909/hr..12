const fs = require('fs');
const path = require('path');

console.log('🧹 بدء تنظيف المشروع من الملفات غير المستخدمة...\n');

// إنشاء نسخة احتياطية
const backupDir = `backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
console.log(`📦 إنشاء نسخة احتياطية في: ${backupDir}`);

// قائمة الملفات والمجلدات للحذف
const filesToDelete = [
  // ملفات الاختبار المؤقتة
  'scripts/test-documents-stats.js',
  'scripts/test-expired-documents.js',
  'scripts/test-alerts-30days.js',
  'scripts/test-dashboard-updates.js',
  'scripts/test-final-dashboard.js',
  'scripts/test-health-documents.js',
  'scripts/test-integrated-payroll.js',
  'scripts/test-simple-system.js',
  'scripts/test-enhanced-permissions.js',
  'scripts/test-permissions.js',
  'scripts/test-user-management.js',
  'scripts/test-user-system.js',
  'scripts/test-forms-api.js',
  'scripts/test-forms-system.js',
  'scripts/test-export-functionality.js',
  'scripts/test-login.js',
  'scripts/test-no-settings.js',
  'scripts/quick-test-employee.js',
  'scripts/test-employee-update.js',
  'scripts/test-delete-functionality.js',
  'scripts/final-delete-test.js',
  'scripts/simple-delete-test.js',
  'scripts/clean-and-test-delete.js',
  'scripts/comprehensive-delete-test.js',
  'scripts/final-verification.js',
  
  // ملفات الإعداد المؤقتة
  'scripts/add-sample-employees.js',
  'scripts/add-sample-institutions.js',
  'scripts/add-sample-advances.js',
  'scripts/add-sample-compensations.js',
  'scripts/add-test-expiry-data.js',
  'scripts/add-test-renewable-documents.js',
  'scripts/create-simple-test-employee.js',
  'scripts/create-test-employee-for-edit.js',
  'scripts/create-test-excel.js',
  'scripts/create-test-user.js',
  'scripts/create-test-with-real-institutions.js',
  'scripts/create-sample-payroll.js',
  
  // ملفات الصيانة المؤقتة
  'scripts/debug-employee-update.js',
  'scripts/debug-institution-query.js',
  'scripts/compare-employee-data.js',
  'scripts/clean-test-users.js',
  'scripts/clear-cache-test.js',
  'scripts/fix-passwords.js',
  'scripts/fix-institution-documents.js',
  'scripts/remove-settings-completely.js',
  'scripts/reset-to-simple-system.js',
  'scripts/migrate-permissions.js',
  'scripts/update-employee-institutions.js',
  'scripts/update-employees-table.js',
  'scripts/update-existing-documents.js',
  
  // ملفات في الجذر
  'apphosting.yaml',
  'jest.config.js',
  'jest.setup.js',
  
  // UI Components غير مستخدمة
  'src/components/ui/accordion.tsx',
  'src/components/ui/carousel.tsx',
  'src/components/ui/chart.tsx',
  'src/components/ui/collapsible.tsx',
  'src/components/ui/menubar.tsx',
  'src/components/ui/radio-group.tsx',
  'src/components/ui/scroll-area.tsx',
  'src/components/ui/sheet.tsx',
  'src/components/ui/skeleton.tsx',
  'src/components/ui/slider.tsx',
  
  // مكونات مكررة
  'src/components/admin/PermissionManager.tsx',
  'src/components/protected-route.tsx',
  
  // صفحات مكررة
  'src/app/dashboard/page.tsx',
  'src/app/(main)/layout.tsx',
  
  // ملفات التوثيق المؤقتة
  'docs/blueprint.md',
  'docs/developer-guide.md',
  'docs/user-guide.md',
  'IMPLEMENTATION_GUIDE.md',
  
  // ملفات إعداد غير ضرورية
  'postcss.config.mjs',
  'tsconfig.tsbuildinfo'
];

// مجلدات للحذف
const foldersToDelete = [
  'src/app/api/employees-public',
  'src/app/api/institutions-public',
  'src/app/api/migrate',
  'src/app/api/migrate-subscriptions',
  'src/app/api/subscriptions',
  'src/app/api/test',
  'src/app/api/setup',
  'src/app/api/setup-admin',
  'src/ai',
  'src/__tests__'
];

// وظيفة حذف ملف بأمان
function safeDelete(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`✅ تم حذف المجلد: ${filePath}`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`✅ تم حذف الملف: ${filePath}`);
      }
      return true;
    } else {
      console.log(`⚠️  الملف غير موجود: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ خطأ في حذف ${filePath}: ${error.message}`);
    return false;
  }
}

// إحصائيات
let deletedFiles = 0;
let deletedFolders = 0;
let errors = 0;

console.log('\n🗑️  بدء حذف الملفات...\n');

// حذف الملفات
console.log('📄 حذف الملفات الفردية...');
filesToDelete.forEach(file => {
  if (safeDelete(file)) {
    deletedFiles++;
  } else {
    errors++;
  }
});

console.log('\n📁 حذف المجلدات...');
// حذف المجلدات
foldersToDelete.forEach(folder => {
  if (safeDelete(folder)) {
    deletedFolders++;
  } else {
    errors++;
  }
});

// تنظيف إضافي - حذف ملفات فارغة
console.log('\n🧽 تنظيف إضافي...');

// حذف مجلدات فارغة
function removeEmptyDirs(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath);
    if (files.length === 0) {
      fs.rmdirSync(dirPath);
      console.log(`✅ تم حذف مجلد فارغ: ${dirPath}`);
      return;
    }
    
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        removeEmptyDirs(fullPath);
      }
    });
    
    // تحقق مرة أخرى إذا أصبح المجلد فارغاً
    const remainingFiles = fs.readdirSync(dirPath);
    if (remainingFiles.length === 0) {
      fs.rmdirSync(dirPath);
      console.log(`✅ تم حذف مجلد فارغ: ${dirPath}`);
    }
  } catch (error) {
    // تجاهل الأخطاء في هذه المرحلة
  }
}

// تنظيف المجلدات الفارغة
['scripts', 'src/components', 'src/app/api', 'docs'].forEach(dir => {
  if (fs.existsSync(dir)) {
    removeEmptyDirs(dir);
  }
});

console.log('\n📊 ملخص التنظيف:');
console.log('='.repeat(50));
console.log(`✅ الملفات المحذوفة: ${deletedFiles}`);
console.log(`✅ المجلدات المحذوفة: ${deletedFolders}`);
console.log(`❌ الأخطاء: ${errors}`);
console.log(`📦 إجمالي العناصر المحذوفة: ${deletedFiles + deletedFolders}`);

console.log('\n🎉 انتهى تنظيف المشروع!');
console.log('\n📋 الخطوات التالية:');
console.log('1. اختبر النظام للتأكد من عمله بشكل صحيح');
console.log('2. قم بتشغيل npm run build للتأكد من عدم وجود أخطاء');
console.log('3. احذف ملفات .next و node_modules وأعد تثبيتها إذا لزم الأمر');
console.log('4. قم بعمل commit للتغييرات');

console.log('\n⚠️  تذكير: إذا واجهت أي مشاكل، يمكنك استرداد الملفات من Git');
