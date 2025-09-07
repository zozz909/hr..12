// Script to simulate payroll run and advance deductions
async function simulatePayrollDeduction() {
  console.log('🚀 Simulating payroll run with advance deductions...\n');
  
  const employeeId = 'emp-meydwpre-ma1xf9';
  const payrollRunId = `payroll-${Date.now()}`;
  
  try {
    // Step 1: Check current advance status
    console.log('📊 Step 1: Checking current advance status...');
    const advancesResponse = await fetch(`http://localhost:9004/api/advances?employee_id=${employeeId}`);
    const advancesResult = await advancesResponse.json();
    
    if (advancesResult.success && advancesResult.data.length > 0) {
      console.log(`✓ Found ${advancesResult.data.length} advances for employee`);
      
      advancesResult.data.forEach((advance, index) => {
        console.log(`   Advance ${index + 1}:`);
        console.log(`   - Amount: ${advance.amount} SAR`);
        console.log(`   - Installments: ${advance.installments} months`);
        console.log(`   - Remaining: ${advance.remainingAmount} SAR`);
        console.log(`   - Status: ${advance.status}`);
        console.log(`   - Monthly deduction: ${advance.amount / advance.installments} SAR\n`);
      });
    }
    
    // Step 2: Calculate monthly deduction
    console.log('💰 Step 2: Calculating monthly deduction...');
    const deductionResponse = await fetch(`http://localhost:9004/api/advances/auto-deduct?employee_id=${employeeId}`);
    const deductionResult = await deductionResponse.json();
    
    if (deductionResult.success) {
      console.log(`✓ Total monthly deduction: ${deductionResult.data.totalMonthlyDeduction} SAR`);
      console.log(`✓ Number of active advances: ${deductionResult.data.advancesCount}`);
      
      deductionResult.data.activeAdvances.forEach((advance, index) => {
        console.log(`   Active Advance ${index + 1}:`);
        console.log(`   - Total: ${advance.totalAmount} SAR`);
        console.log(`   - Remaining: ${advance.remainingAmount} SAR`);
        console.log(`   - Monthly deduction: ${advance.monthlyDeduction} SAR`);
      });
      console.log('');
    }
    
    // Step 3: Process the deduction (simulate payroll run)
    console.log('⚙️ Step 3: Processing automatic deduction (Month 1)...');
    const processResponse = await fetch('http://localhost:9004/api/advances/auto-deduct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: employeeId,
        payrollRunId: payrollRunId
      }),
    });
    
    const processResult = await processResponse.json();
    
    if (processResult.success) {
      console.log(`✅ Deduction processed successfully!`);
      console.log(`✓ Total deducted: ${processResult.data.totalDeduction} SAR`);
      console.log(`✓ Number of deductions: ${processResult.data.deductionsCount}`);
      
      processResult.data.deductions.forEach((deduction, index) => {
        console.log(`   Deduction ${index + 1}:`);
        console.log(`   - Amount deducted: ${deduction.deductionAmount} SAR`);
        console.log(`   - Remaining after deduction: ${deduction.remainingAmount} SAR`);
      });
      console.log('');
    }
    
    // Step 4: Check updated advance status
    console.log('📈 Step 4: Checking updated advance status...');
    const updatedAdvancesResponse = await fetch(`http://localhost:9004/api/advances?employee_id=${employeeId}`);
    const updatedAdvancesResult = await updatedAdvancesResponse.json();
    
    if (updatedAdvancesResult.success && updatedAdvancesResult.data.length > 0) {
      console.log(`✓ Updated advances status:`);
      
      updatedAdvancesResult.data.forEach((advance, index) => {
        console.log(`   Advance ${index + 1}:`);
        console.log(`   - Original amount: ${advance.amount} SAR`);
        console.log(`   - Paid amount: ${advance.paidAmount} SAR`);
        console.log(`   - Remaining amount: ${advance.remainingAmount} SAR`);
        console.log(`   - Status: ${advance.status}`);
        console.log(`   - Progress: ${((advance.paidAmount / advance.amount) * 100).toFixed(1)}% paid\n`);
      });
    }
    
    // Step 5: Show what happens in Month 2
    console.log('🔄 Step 5: Simulating Month 2 deduction...');
    const month2PayrollId = `payroll-month2-${Date.now()}`;
    
    const month2Response = await fetch('http://localhost:9004/api/advances/auto-deduct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: employeeId,
        payrollRunId: month2PayrollId
      }),
    });
    
    const month2Result = await month2Response.json();
    
    if (month2Result.success) {
      console.log(`✅ Month 2 deduction processed!`);
      console.log(`✓ Total deducted: ${month2Result.data.totalDeduction} SAR`);
      
      // Final status check
      const finalAdvancesResponse = await fetch(`http://localhost:9004/api/advances?employee_id=${employeeId}`);
      const finalAdvancesResult = await finalAdvancesResponse.json();
      
      if (finalAdvancesResult.success) {
        console.log(`\n🎉 Final Status After 2 Months:`);
        
        finalAdvancesResult.data.forEach((advance, index) => {
          console.log(`   Advance ${index + 1}:`);
          console.log(`   - Original amount: ${advance.amount} SAR`);
          console.log(`   - Paid amount: ${advance.paidAmount} SAR`);
          console.log(`   - Remaining amount: ${advance.remainingAmount} SAR`);
          console.log(`   - Status: ${advance.status}`);
          console.log(`   - ${advance.status === 'paid' ? '✅ FULLY PAID!' : '⏳ Still pending'}\n`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error during simulation:', error.message);
  }
  
  console.log('🏁 Payroll deduction simulation completed!');
}

// Run if called directly
if (typeof window === 'undefined') {
  simulatePayrollDeduction();
}

module.exports = { simulatePayrollDeduction };
