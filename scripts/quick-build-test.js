const { exec } = require('child_process');

console.log('🚀 بدء اختبار البناء السريع...\n');

// Test TypeScript compilation
console.log('1️⃣ اختبار TypeScript...');
exec('npx tsc --noEmit --skipLibCheck', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ أخطاء TypeScript:');
    console.log(stderr);
    console.log('\n2️⃣ اختبار Next.js build...');
    
    // Test Next.js build even if TypeScript has errors
    exec('npm run build', (buildError, buildStdout, buildStderr) => {
      if (buildError) {
        console.log('❌ فشل في البناء:');
        console.log(buildStderr);
        
        console.log('\n📊 ملخص الحالة:');
        console.log('='.repeat(50));
        console.log('❌ TypeScript: يحتوي على أخطاء');
        console.log('❌ Next.js Build: فشل');
        console.log('🔴 الحالة: غير جاهز للنشر');
        console.log('\n💡 يحتاج إصلاح الأخطاء الحرجة أولاً');
      } else {
        console.log('✅ نجح البناء رغم أخطاء TypeScript!');
        console.log('\n📊 ملخص الحالة:');
        console.log('='.repeat(50));
        console.log('⚠️  TypeScript: يحتوي على أخطاء');
        console.log('✅ Next.js Build: نجح');
        console.log('🟡 الحالة: جاهز للاستخدام الداخلي');
        console.log('\n💡 يمكن النشر مع تجاهل أخطاء TypeScript');
      }
    });
  } else {
    console.log('✅ TypeScript نظيف!');
    console.log('\n2️⃣ اختبار Next.js build...');
    
    exec('npm run build', (buildError, buildStdout, buildStderr) => {
      if (buildError) {
        console.log('❌ فشل في البناء:');
        console.log(buildStderr);
        
        console.log('\n📊 ملخص الحالة:');
        console.log('='.repeat(50));
        console.log('✅ TypeScript: نظيف');
        console.log('❌ Next.js Build: فشل');
        console.log('🟡 الحالة: يحتاج إصلاح مشاكل البناء');
      } else {
        console.log('✅ نجح البناء بالكامل!');
        console.log('\n📊 ملخص الحالة:');
        console.log('='.repeat(50));
        console.log('✅ TypeScript: نظيف');
        console.log('✅ Next.js Build: نجح');
        console.log('🟢 الحالة: جاهز للنشر!');
        
        console.log('\n🎉 النظام جاهز للاستخدام والنشر!');
        console.log('\n📋 خطوات النشر:');
        console.log('1. تحديث متغيرات البيئة للإنتاج');
        console.log('2. إعداد قاعدة البيانات الإنتاجية');
        console.log('3. رفع الملفات للخادم');
        console.log('4. تشغيل npm start');
      }
    });
  }
});

// Test database connection
console.log('\n3️⃣ اختبار الاتصال بقاعدة البيانات...');
exec('node -e "const mysql = require(\'mysql2/promise\'); mysql.createConnection({host:\'localhost\',user:\'root\',password:\'123\',database:\'hr_system\'}).then(()=>console.log(\'✅ قاعدة البيانات متصلة\')).catch(()=>console.log(\'❌ فشل الاتصال بقاعدة البيانات\'))"', (dbError, dbStdout, dbStderr) => {
  console.log(dbStdout || dbStderr);
});

setTimeout(() => {
  console.log('\n⏰ انتهى الاختبار السريع');
}, 5000);
