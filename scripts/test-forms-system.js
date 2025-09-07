// Script to test forms system
async function testFormsSystem() {
  console.log('📋 Testing Administrative Forms System...\n');
  
  try {
    // Step 1: Get all forms
    console.log('📊 Step 1: Getting all forms...');
    const formsResponse = await fetch('http://localhost:9004/api/forms');
    const formsResult = await formsResponse.json();
    
    if (formsResult.success) {
      console.log(`✓ Found ${formsResult.data.length} forms`);
      
      formsResult.data.forEach((form, index) => {
        console.log(`\n   Form ${index + 1}: ${form.title}`);
        console.log(`   - Category: ${form.category}`);
        console.log(`   - Icon: ${form.iconName} (${form.iconColor})`);
        console.log(`   - Description: ${form.description}`);
        console.log(`   - Has File: ${form.fileName ? 'Yes - ' + form.fileName : 'No'}`);
        console.log(`   - Downloads: ${form.downloadCount || 0}`);
        console.log(`   - Status: ${form.isActive ? 'Active' : 'Inactive'}`);
      });
    }
    
    // Step 2: Test creating a new form
    console.log('\n📝 Step 2: Creating a new form...');
    const newFormData = {
      title: 'طلب إجازة اضطرارية',
      description: 'نموذج طلب إجازة اضطرارية للموظفين في الحالات الطارئة',
      category: 'hr',
      iconName: 'Calendar',
      iconColor: '#ef4444',
      isActive: true
    };
    
    const createResponse = await fetch('http://localhost:9004/api/forms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newFormData),
    });
    
    const createResult = await createResponse.json();
    
    if (createResult.success) {
      console.log(`✅ Form created successfully!`);
      console.log(`✓ Form ID: ${createResult.data.id}`);
      console.log(`✓ Title: ${createResult.data.title}`);
      console.log(`✓ Icon: ${createResult.data.iconName} (${createResult.data.iconColor})`);
      
      // Step 3: Test filtering by category
      console.log('\n🔍 Step 3: Testing category filtering...');
      const hrFormsResponse = await fetch('http://localhost:9004/api/forms?category=hr');
      const hrFormsResult = await hrFormsResponse.json();
      
      if (hrFormsResult.success) {
        console.log(`✓ Found ${hrFormsResult.data.length} HR forms`);
        hrFormsResult.data.forEach(form => {
          console.log(`   - ${form.title} (${form.iconName})`);
        });
      }
      
      // Step 4: Test search functionality
      console.log('\n🔍 Step 4: Testing search functionality...');
      const searchResponse = await fetch('http://localhost:9004/api/forms?search=إجازة');
      const searchResult = await searchResponse.json();
      
      if (searchResult.success) {
        console.log(`✓ Found ${searchResult.data.length} forms matching "إجازة"`);
        searchResult.data.forEach(form => {
          console.log(`   - ${form.title}`);
        });
      }
      
    } else {
      console.log(`❌ Failed to create form: ${createResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error during forms test:', error.message);
  }
  
  console.log('\n🏁 Forms system test completed!');
  console.log('\n💡 The forms system supports:');
  console.log('   ✅ Creating forms with custom icons and colors');
  console.log('   ✅ Categorizing forms (HR, Finance, General)');
  console.log('   ✅ Uploading PDF files');
  console.log('   ✅ Downloading forms with counter tracking');
  console.log('   ✅ Search and filtering');
  console.log('   ✅ Beautiful icon display');
  console.log('\n🎯 Next steps:');
  console.log('   1. Go to http://localhost:9004/forms');
  console.log('   2. Click "إضافة نموذج جديد"');
  console.log('   3. Fill form details and choose icon');
  console.log('   4. Upload PDF file using "رفع ملف"');
  console.log('   5. Download and test the form');
}

// Run if called directly
if (typeof window === 'undefined') {
  testFormsSystem();
}

module.exports = { testFormsSystem };
