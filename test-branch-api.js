// اختبار API الفروع
const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testBranchAPI() {
  try {
    console.log('🔗 اختبار API الفروع...');

    // جلب جميع الفروع
    console.log('\n📋 جلب جميع الفروع من API:');
    const data = await makeRequest('http://localhost:3000/api/branches');

    if (data.success) {
      console.log(`   عدد الفروع: ${data.count}`);
      if (data.data && data.data.length > 0) {
        data.data.forEach(branch => {
          console.log(`   - ${branch.name} (${branch.id}) - ${branch.status}`);
        });
      } else {
        console.log('   لا توجد فروع');
      }
    } else {
      console.log('   خطأ في جلب الفروع:', data.error);
    }

    // إنشاء فرع جديد للاختبار
    console.log('\n➕ إنشاء فرع جديد للاختبار:');
    const createData = await makeRequest('http://localhost:3000/api/branches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'فرع اختبار الحذف',
        code: 'TEST-DELETE',
        address: 'عنوان تجريبي',
        phone: '0501234567',
        status: 'active'
      })
    });
    if (createData.success) {
      console.log(`   تم إنشاء الفرع: ${createData.data.name} (${createData.data.id})`);
      
      // حذف الفرع المنشأ
      console.log('\n🗑️ حذف الفرع المنشأ:');
      const deleteData = await makeRequest(`http://localhost:3000/api/branches/${createData.data.id}`, {
        method: 'DELETE'
      });
      if (deleteData.success) {
        console.log('   ✅ تم حذف الفرع بنجاح');
        
        // التحقق من عدم وجود الفرع
        console.log('\n🔍 التحقق من عدم وجود الفرع بعد الحذف:');
        const checkData = await makeRequest('http://localhost:3000/api/branches');
        
        if (checkData.success) {
          const deletedBranch = checkData.data.find(b => b.id === createData.data.id);
          if (deletedBranch) {
            console.log('   ❌ الفرع ما زال موجود في النتائج!');
            console.log(`      الفرع: ${deletedBranch.name} - ${deletedBranch.status}`);
          } else {
            console.log('   ✅ الفرع غير موجود في النتائج - الحذف تم بنجاح');
          }
        }
      } else {
        console.log('   ❌ فشل في حذف الفرع:', deleteData.error);
      }
    } else {
      console.log('   ❌ فشل في إنشاء الفرع:', createData.error);
    }

  } catch (error) {
    console.error('❌ خطأ في اختبار API:', error.message);
  }
}

// تشغيل الاختبار
testBranchAPI();
