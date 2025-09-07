// Script to create a sample payroll run for testing export functionality
async function createSamplePayroll() {
  console.log('🚀 Creating sample payroll run for testing exports...\n');
  
  const month = '2024-03';
  
  try {
    // Step 1: Calculate payroll preview
    console.log('📊 Step 1: Calculating payroll preview...');
    const previewResponse = await fetch('http://localhost:9004/api/payroll/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ month: month }),
    });
    
    const previewResult = await previewResponse.json();
    
    if (previewResult.success) {
      console.log(`✓ Calculated payroll for ${previewResult.data.summary.totalEmployees} employees`);
      console.log(`✓ Total Gross: ${previewResult.data.summary.totalGross} SAR`);
      console.log(`✓ Total Deductions: ${previewResult.data.summary.totalDeductions} SAR`);
      console.log(`✓ Total Net: ${previewResult.data.summary.totalNet} SAR`);
      
      // Show employee details
      previewResult.data.calculations.forEach((calc, index) => {
        console.log(`\n   Employee ${index + 1}: ${calc.employeeName}`);
        console.log(`   - Base: ${calc.baseSalary} SAR`);
        console.log(`   - Rewards: +${calc.rewards} SAR`);
        console.log(`   - Deductions: -${calc.deductions} SAR`);
        console.log(`   - Advance: -${calc.advanceDeduction} SAR`);
        console.log(`   - Net Pay: ${calc.netPay} SAR`);
      });
    }
    
    // Step 2: Create actual payroll run
    console.log('\n⚙️ Step 2: Creating payroll run...');
    const createResponse = await fetch('http://localhost:9004/api/payroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ month: month }),
    });
    
    const createResult = await createResponse.json();
    
    if (createResult.success) {
      const payrollRun = createResult.data.payrollRun;
      console.log(`✅ Payroll run created successfully!`);
      console.log(`✓ Payroll ID: ${payrollRun.id}`);
      console.log(`✓ Month: ${payrollRun.month}`);
      console.log(`✓ Status: ${payrollRun.status}`);
      console.log(`✓ Total Employees: ${payrollRun.totalEmployees}`);
      console.log(`✓ Total Net: ${payrollRun.totalNet} SAR`);
      
      console.log('\n📁 Export URLs ready:');
      console.log(`   Excel: http://localhost:9004/api/payroll/${payrollRun.id}/export/excel`);
      console.log(`   PDF: http://localhost:9004/api/payroll/${payrollRun.id}/export/pdf`);
      
      return payrollRun.id;
    } else {
      console.log(`❌ Failed to create payroll run: ${createResult.error}`);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error creating sample payroll:', error.message);
    return null;
  }
}

// Run if called directly
if (typeof window === 'undefined') {
  createSamplePayroll().then(payrollId => {
    if (payrollId) {
      console.log('\n🎉 Sample payroll created successfully!');
      console.log('💡 Now you can test the export functionality:');
      console.log('   1. Go to http://localhost:9004/payroll');
      console.log('   2. Find the payroll run in the table');
      console.log('   3. Click the actions menu (⋮)');
      console.log('   4. Try "تصدير Excel" and "تصدير PDF"');
      console.log('\n🎯 The exports will include:');
      console.log('   ✅ Employee details with photos');
      console.log('   ✅ Base salary, rewards, deductions');
      console.log('   ✅ Advance deductions');
      console.log('   ✅ Gross and net pay');
      console.log('   ✅ Summary totals');
      console.log('   ✅ Arabic formatting');
    }
  });
}

module.exports = { createSamplePayroll };
