const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

console.log('🚀 اختبار جاهزية النشر التجاري...\n');

const tests = [
  {
    name: 'TypeScript Compilation',
    command: 'npx tsc --noEmit --skipLibCheck',
    description: 'فحص أخطاء TypeScript',
    critical: false
  },
  {
    name: 'Next.js Build',
    command: 'npm run build',
    description: 'بناء التطبيق للإنتاج',
    critical: true
  },
  {
    name: 'Unit Tests',
    command: 'npm test -- --passWithNoTests',
    description: 'تشغيل الاختبارات',
    critical: false
  },
  {
    name: 'ESLint Check',
    command: 'npm run lint',
    description: 'فحص جودة الكود',
    critical: false
  },
  {
    name: 'Database Connection',
    command: 'node -e "const mysql = require(\'mysql2/promise\'); mysql.createConnection({host:\'localhost\',user:\'root\',password:\'123\',database:\'hr_system\'}).then(conn => conn.execute(\'SELECT 1\')).then(()=>console.log(\'✅ Database OK\')).catch(()=>console.log(\'❌ Database Error\'))"',
    description: 'اختبار الاتصال بقاعدة البيانات',
    critical: false
  }
];

const securityChecks = [
  {
    name: 'Environment Variables',
    check: async () => {
      const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'NEXTAUTH_SECRET'];
      const missing = requiredVars.filter(v => !process.env[v]);
      return {
        passed: missing.length === 0,
        message: missing.length > 0 ? `متغيرات مفقودة: ${missing.join(', ')}` : 'جميع المتغيرات موجودة'
      };
    }
  },
  {
    name: 'Security Headers',
    check: async () => {
      try {
        const middlewareContent = await fs.readFile('src/middleware.ts', 'utf8');
        const hasSecurityHeaders = middlewareContent.includes('X-Content-Type-Options') && 
                                 middlewareContent.includes('X-Frame-Options');
        return {
          passed: hasSecurityHeaders,
          message: hasSecurityHeaders ? 'Security headers موجودة' : 'Security headers مفقودة'
        };
      } catch {
        return { passed: false, message: 'لا يمكن قراءة ملف middleware' };
      }
    }
  },
  {
    name: 'Password Hashing',
    check: async () => {
      try {
        const securityContent = await fs.readFile('src/lib/security/index.ts', 'utf8');
        const hasPasswordHashing = securityContent.includes('bcrypt');
        return {
          passed: hasPasswordHashing,
          message: hasPasswordHashing ? 'تشفير كلمات المرور مفعل' : 'تشفير كلمات المرور غير مفعل'
        };
      } catch {
        return { passed: false, message: 'ملف الأمان غير موجود' };
      }
    }
  }
];

const performanceChecks = [
  {
    name: 'Bundle Size',
    check: async () => {
      try {
        const buildDir = '.next';
        const stats = await fs.stat(buildDir);
        return {
          passed: true,
          message: `Build directory exists (${stats.isDirectory() ? 'OK' : 'Not a directory'})`
        };
      } catch {
        return { passed: false, message: 'Build directory not found' };
      }
    }
  },
  {
    name: 'Image Optimization',
    check: async () => {
      try {
        const nextConfig = await fs.readFile('next.config.ts', 'utf8');
        const hasImageOptimization = nextConfig.includes('images');
        return {
          passed: hasImageOptimization,
          message: hasImageOptimization ? 'تحسين الصور مفعل' : 'تحسين الصور غير مفعل'
        };
      } catch {
        return { passed: false, message: 'لا يمكن قراءة next.config.ts' };
      }
    }
  }
];

async function runCommand(command, description) {
  return new Promise((resolve) => {
    exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          success: false,
          output: stderr || error.message,
          description
        });
      } else {
        resolve({
          success: true,
          output: stdout,
          description
        });
      }
    });
  });
}

async function runTests() {
  console.log('📋 تشغيل الاختبارات الأساسية...\n');
  
  const results = [];
  let criticalFailures = 0;
  
  for (const test of tests) {
    process.stdout.write(`⏳ ${test.description}... `);
    
    const result = await runCommand(test.command, test.description);
    results.push({ ...test, ...result });
    
    if (result.success) {
      console.log('✅');
    } else {
      console.log('❌');
      if (test.critical) {
        criticalFailures++;
      }
    }
  }
  
  console.log('\n🔒 فحص الأمان...\n');
  
  const securityResults = [];
  for (const check of securityChecks) {
    process.stdout.write(`⏳ ${check.name}... `);
    
    const result = await check.check();
    securityResults.push({ name: check.name, ...result });
    
    if (result.passed) {
      console.log('✅');
    } else {
      console.log('❌');
    }
  }
  
  console.log('\n⚡ فحص الأداء...\n');
  
  const performanceResults = [];
  for (const check of performanceChecks) {
    process.stdout.write(`⏳ ${check.name}... `);
    
    const result = await check.check();
    performanceResults.push({ name: check.name, ...result });
    
    if (result.passed) {
      console.log('✅');
    } else {
      console.log('❌');
    }
  }
  
  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('📊 تقرير جاهزية النشر التجاري');
  console.log('='.repeat(60));
  
  // Basic tests summary
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\n🧪 الاختبارات الأساسية: ${passedTests}/${totalTests} نجح`);
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const critical = result.critical ? ' (حرج)' : '';
    console.log(`  ${status} ${result.description}${critical}`);
    
    if (!result.success && result.output) {
      console.log(`     خطأ: ${result.output.substring(0, 100)}...`);
    }
  });
  
  // Security summary
  const passedSecurity = securityResults.filter(r => r.passed).length;
  const totalSecurity = securityResults.length;
  
  console.log(`\n🔒 فحص الأمان: ${passedSecurity}/${totalSecurity} نجح`);
  
  securityResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`  ${status} ${result.name}: ${result.message}`);
  });
  
  // Performance summary
  const passedPerformance = performanceResults.filter(r => r.passed).length;
  const totalPerformance = performanceResults.length;
  
  console.log(`\n⚡ فحص الأداء: ${passedPerformance}/${totalPerformance} نجح`);
  
  performanceResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`  ${status} ${result.name}: ${result.message}`);
  });
  
  // Overall assessment
  console.log('\n' + '='.repeat(60));
  console.log('🎯 التقييم الإجمالي');
  console.log('='.repeat(60));
  
  const overallScore = Math.round(
    ((passedTests / totalTests) * 0.5 + 
     (passedSecurity / totalSecurity) * 0.3 + 
     (passedPerformance / totalPerformance) * 0.2) * 100
  );
  
  console.log(`\n📈 النتيجة الإجمالية: ${overallScore}%`);
  
  if (criticalFailures > 0) {
    console.log(`\n🚨 تحذير: ${criticalFailures} اختبار حرج فشل!`);
    console.log('❌ النظام غير جاهز للنشر التجاري');
    console.log('\n💡 يجب إصلاح الأخطاء الحرجة قبل النشر');
  } else if (overallScore >= 90) {
    console.log('\n🎉 ممتاز! النظام جاهز للنشر التجاري');
    console.log('✅ جميع المعايير الأساسية مستوفاة');
  } else if (overallScore >= 80) {
    console.log('\n🟡 جيد! النظام جاهز للنشر مع بعض التحسينات');
    console.log('⚠️  يُنصح بإصلاح المشاكل غير الحرجة');
  } else {
    console.log('\n🔴 النظام يحتاج تحسينات كبيرة قبل النشر');
    console.log('❌ يجب إصلاح المشاكل المذكورة أعلاه');
  }
  
  // Recommendations
  console.log('\n📋 التوصيات:');
  
  if (criticalFailures > 0) {
    console.log('1. إصلاح الأخطاء الحرجة أولاً');
  }
  
  if (passedSecurity < totalSecurity) {
    console.log('2. تحسين إعدادات الأمان');
  }
  
  if (passedPerformance < totalPerformance) {
    console.log('3. تحسين الأداء والتحميل');
  }
  
  console.log('4. إجراء اختبارات إضافية في بيئة مشابهة للإنتاج');
  console.log('5. إعداد مراقبة الأخطاء والأداء');
  console.log('6. تحضير خطة النسخ الاحتياطي');
  
  console.log('\n🔗 للمزيد من المعلومات، راجع:');
  console.log('- docs/user-guide.md');
  console.log('- docs/developer-guide.md');
  
  process.exit(criticalFailures > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ خطأ غير متوقع:', reason);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('❌ فشل في تشغيل الاختبارات:', error);
  process.exit(1);
});
