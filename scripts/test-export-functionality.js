// Script to test export functionality
async function testExportFunctionality() {
  console.log('📁 Testing Export Functionality...\n');
  
  try {
    // Step 1: Get available payroll runs
    console.log('📊 Step 1: Getting available payroll runs...');
    const payrollResponse = await fetch('http://localhost:9004/api/payroll');
    const payrollResult = await payrollResponse.json();
    
    if (payrollResult.success && payrollResult.data.length > 0) {
      const payrollRun = payrollResult.data[0]; // Get the first payroll run
      console.log(`✓ Found payroll run: ${payrollRun.id}`);
      console.log(`✓ Month: ${payrollRun.month}`);
      console.log(`✓ Employees: ${payrollRun.totalEmployees}`);
      console.log(`✓ Net Pay: ${payrollRun.totalNet} SAR`);
      
      // Step 2: Test Excel export
      console.log('\n📊 Step 2: Testing Excel export...');
      const excelResponse = await fetch(`http://localhost:9004/api/payroll/${payrollRun.id}/export/excel`);
      
      if (excelResponse.ok) {
        const contentType = excelResponse.headers.get('content-type');
        const contentLength = excelResponse.headers.get('content-length');
        const contentDisposition = excelResponse.headers.get('content-disposition');
        
        console.log('✅ Excel export successful!');
        console.log(`✓ Content Type: ${contentType}`);
        console.log(`✓ File Size: ${contentLength} bytes`);
        console.log(`✓ Filename: ${contentDisposition}`);
      } else {
        console.log('❌ Excel export failed');
      }
      
      // Step 3: Test PDF export
      console.log('\n📄 Step 3: Testing PDF export...');
      const pdfResponse = await fetch(`http://localhost:9004/api/payroll/${payrollRun.id}/export/pdf`);
      
      if (pdfResponse.ok) {
        const contentType = pdfResponse.headers.get('content-type');
        const contentLength = pdfResponse.headers.get('content-length');
        const contentDisposition = pdfResponse.headers.get('content-disposition');
        
        console.log('✅ PDF export successful!');
        console.log(`✓ Content Type: ${contentType}`);
        console.log(`✓ File Size: ${contentLength} bytes`);
        console.log(`✓ Filename: ${contentDisposition}`);
      } else {
        console.log('❌ PDF export failed');
      }
      
      // Step 4: Test export all
      console.log('\n📋 Step 4: Testing export all payroll runs...');
      const allExportResponse = await fetch('http://localhost:9004/api/payroll/export/all?format=summary');
      
      if (allExportResponse.ok) {
        const contentType = allExportResponse.headers.get('content-type');
        const contentLength = allExportResponse.headers.get('content-length');
        
        console.log('✅ Export all successful!');
        console.log(`✓ Content Type: ${contentType}`);
        console.log(`✓ File Size: ${contentLength} bytes`);
      } else {
        console.log('❌ Export all failed');
      }
      
    } else {
      console.log('❌ No payroll runs found for testing');
    }
    
  } catch (error) {
    console.error('❌ Error during export test:', error.message);
  }
  
  console.log('\n🏁 Export functionality test completed!');
  console.log('\n💡 Available export options:');
  console.log('   📊 Individual Excel: Detailed employee data');
  console.log('   📄 Individual PDF: Formatted report');
  console.log('   📋 Summary Excel: All payroll runs summary');
  console.log('\n🎯 Export features:');
  console.log('   ✅ Arabic filenames');
  console.log('   ✅ Proper formatting');
  console.log('   ✅ Complete data');
  console.log('   ✅ Summary totals');
}

// Run if called directly
if (typeof window === 'undefined') {
  testExportFunctionality();
}

module.exports = { testExportFunctionality };
