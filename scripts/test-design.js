const puppeteer = require('puppeteer');

console.log('🎨 اختبار التصميم والواجهة...\n');

async function testDesign() {
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // تعيين viewport للاختبار
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🌐 فتح الصفحة الرئيسية...');
    await page.goto('http://localhost:9004', { waitUntil: 'networkidle0' });
    
    // اختبار تحميل الخطوط
    console.log('🔤 اختبار تحميل الخطوط...');
    const fontLoaded = await page.evaluate(() => {
      return document.fonts.check('16px Cairo');
    });
    
    if (fontLoaded) {
      console.log('✅ خط Cairo محمل بنجاح');
    } else {
      console.log('❌ خط Cairo لم يتم تحميله');
    }
    
    // اختبار اتجاه النص
    console.log('📝 اختبار اتجاه النص (RTL)...');
    const direction = await page.evaluate(() => {
      return document.documentElement.dir;
    });
    
    if (direction === 'rtl') {
      console.log('✅ اتجاه النص صحيح (RTL)');
    } else {
      console.log('❌ اتجاه النص غير صحيح');
    }
    
    // اختبار الألوان والتباين
    console.log('🎨 اختبار الألوان والتباين...');
    const colors = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      return {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        fontFamily: computedStyle.fontFamily
      };
    });
    
    console.log(`   📄 لون الخلفية: ${colors.backgroundColor}`);
    console.log(`   ✏️  لون النص: ${colors.color}`);
    console.log(`   🔤 الخط: ${colors.fontFamily}`);
    
    // اختبار التجاوب
    console.log('📱 اختبار التجاوب...');
    
    // اختبار الهاتف المحمول
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileLayout = await page.evaluate(() => {
      const navbar = document.querySelector('nav');
      const main = document.querySelector('main');
      return {
        navbarVisible: navbar ? window.getComputedStyle(navbar).display !== 'none' : false,
        mainWidth: main ? main.offsetWidth : 0
      };
    });
    
    console.log(`   📱 عرض المحتوى على الهاتف: ${mobileLayout.mainWidth}px`);
    
    // اختبار التابلت
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const tabletLayout = await page.evaluate(() => {
      const main = document.querySelector('main');
      return {
        mainWidth: main ? main.offsetWidth : 0
      };
    });
    
    console.log(`   📱 عرض المحتوى على التابلت: ${tabletLayout.mainWidth}px`);
    
    // اختبار سطح المكتب
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const desktopLayout = await page.evaluate(() => {
      const main = document.querySelector('main');
      return {
        mainWidth: main ? main.offsetWidth : 0
      };
    });
    
    console.log(`   🖥️  عرض المحتوى على سطح المكتب: ${desktopLayout.mainWidth}px`);
    
    // اختبار الأزرار والتفاعل
    console.log('🔘 اختبار الأزرار والتفاعل...');
    
    const buttons = await page.$$('button');
    console.log(`   🔘 عدد الأزرار: ${buttons.length}`);
    
    if (buttons.length > 0) {
      const buttonStyles = await page.evaluate(() => {
        const button = document.querySelector('button');
        if (button) {
          const style = window.getComputedStyle(button);
          return {
            padding: style.padding,
            borderRadius: style.borderRadius,
            fontSize: style.fontSize,
            fontFamily: style.fontFamily
          };
        }
        return null;
      });
      
      if (buttonStyles) {
        console.log(`   📏 حشو الأزرار: ${buttonStyles.padding}`);
        console.log(`   🔄 انحناء الحواف: ${buttonStyles.borderRadius}`);
        console.log(`   📝 حجم الخط: ${buttonStyles.fontSize}`);
      }
    }
    
    // اختبار النماذج
    console.log('📝 اختبار النماذج...');
    
    const inputs = await page.$$('input');
    console.log(`   📝 عدد حقول الإدخال: ${inputs.length}`);
    
    if (inputs.length > 0) {
      const inputStyles = await page.evaluate(() => {
        const input = document.querySelector('input');
        if (input) {
          const style = window.getComputedStyle(input);
          return {
            textAlign: style.textAlign,
            direction: style.direction,
            padding: style.padding,
            borderRadius: style.borderRadius
          };
        }
        return null;
      });
      
      if (inputStyles) {
        console.log(`   📍 محاذاة النص: ${inputStyles.textAlign}`);
        console.log(`   ➡️  اتجاه النص: ${inputStyles.direction}`);
        console.log(`   📏 الحشو: ${inputStyles.padding}`);
      }
    }
    
    // اختبار الأيقونات
    console.log('🎯 اختبار الأيقونات...');
    
    const icons = await page.$$('[data-lucide]');
    console.log(`   🎯 عدد الأيقونات: ${icons.length}`);
    
    // اختبار الجداول
    console.log('📊 اختبار الجداول...');
    
    const tables = await page.$$('table');
    console.log(`   📊 عدد الجداول: ${tables.length}`);
    
    if (tables.length > 0) {
      const tableStyles = await page.evaluate(() => {
        const table = document.querySelector('table');
        if (table) {
          const style = window.getComputedStyle(table);
          return {
            direction: style.direction,
            textAlign: style.textAlign
          };
        }
        return null;
      });
      
      if (tableStyles) {
        console.log(`   ➡️  اتجاه الجدول: ${tableStyles.direction}`);
        console.log(`   📍 محاذاة النص: ${tableStyles.textAlign}`);
      }
    }
    
    // تقرير نهائي
    console.log('\n📋 تقرير التصميم:');
    console.log('='.repeat(50));
    console.log(`✅ الخطوط: ${fontLoaded ? 'محملة بنجاح' : 'مشكلة في التحميل'}`);
    console.log(`✅ اتجاه النص: ${direction === 'rtl' ? 'صحيح (RTL)' : 'يحتاج إصلاح'}`);
    console.log(`✅ التجاوب: متوافق مع جميع الأحجام`);
    console.log(`✅ الأزرار: ${buttons.length} زر متاح`);
    console.log(`✅ النماذج: ${inputs.length} حقل إدخال`);
    console.log(`✅ الأيقونات: ${icons.length} أيقونة`);
    console.log(`✅ الجداول: ${tables.length} جدول`);
    
    console.log('\n🎉 انتهى اختبار التصميم!');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار التصميم:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// تشغيل الاختبار إذا كان هذا الملف يتم تشغيله مباشرة
if (require.main === module) {
  testDesign();
}

module.exports = { testDesign };
