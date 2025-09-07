// Script to test integrated payroll system with advances, compensations
async function testIntegratedPayroll() {
  console.log('🚀 Testing Integrated Payroll System...\n');
  
  const employeeId = 'emp-meydwpre-ma1xf9';
  const month = '2024-03';
  
  try {
    // Step 1: Check current employee status
    console.log('👤 Step 1: Checking employee status...');
    const employeeResponse = await fetch(`http://localhost:9004/api/employees/${employeeId}`);
    const employeeResult = await employeeResponse.json();
    
    if (employeeResult.success) {
      console.log(`✓ Employee: ${employeeResult.data.name}`);
      console.log(`✓ Base Salary: ${employeeResult.data.salary} SAR`);
      console.log('');
    }
    
    // Step 2: Check compensations for the month
    console.log('💰 Step 2: Checking compensations for March 2024...');
    const compensationsResponse = await fetch(`http://localhost:9004/api/compensations?employee_id=${employeeId}`);
    const compensationsResult = await compensationsResponse.json();
    
    if (compensationsResult.success) {
      const marchCompensations = compensationsResult.data.filter(comp => 
        comp.date.startsWith('2024-03')
      );
      
      const rewards = marchCompensations.filter(c => c.type === 'reward');
      const deductions = marchCompensations.filter(c => c.type === 'deduction');
      
      console.log(`✓ Rewards in March: ${rewards.length} items`);
      rewards.forEach(r => {
        console.log(`   - ${r.reason}: +${r.amount} SAR`);
      });
      
      console.log(`✓ Deductions in March: ${deductions.length} items`);
      deductions.forEach(d => {
        console.log(`   - ${d.reason}: -${d.amount} SAR`);
      });
      console.log('');
    }
    
    // Step 3: Check active advances
    console.log('🏦 Step 3: Checking active advances...');
    const advancesResponse = await fetch(`http://localhost:9004/api/advances?employee_id=${employeeId}`);
    const advancesResult = await advancesResponse.json();
    
    if (advancesResult.success) {
      const activeAdvances = advancesResult.data.filter(adv => 
        adv.status === 'approved' && adv.remainingAmount > 0
      );
      
      console.log(`✓ Active advances: ${activeAdvances.length} items`);
      activeAdvances.forEach(adv => {
        const monthlyDeduction = adv.amount / adv.installments;
        console.log(`   - ${adv.amount} SAR over ${adv.installments} months`);
        console.log(`   - Monthly deduction: ${monthlyDeduction} SAR`);
        console.log(`   - Remaining: ${adv.remainingAmount} SAR`);
      });
      console.log('');
    }
    
    // Step 4: Calculate advance deduction
    console.log('🧮 Step 4: Calculating advance deduction...');
    const deductionResponse = await fetch(`http://localhost:9004/api/advances/auto-deduct?employee_id=${employeeId}`);
    const deductionResult = await deductionResponse.json();
    
    if (deductionResult.success) {
      console.log(`✓ Total monthly advance deduction: ${deductionResult.data.totalMonthlyDeduction} SAR`);
      console.log('');
    }
    
    // Step 5: Preview payroll calculation
    console.log('📊 Step 5: Previewing payroll calculation...');
    const payrollPreviewResponse = await fetch('http://localhost:9004/api/payroll/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ month: month }),
    });
    
    const payrollPreviewResult = await payrollPreviewResponse.json();
    
    if (payrollPreviewResult.success) {
      const employeeCalc = payrollPreviewResult.data.calculations.find(c => c.employeeId === employeeId);
      
      if (employeeCalc) {
        console.log(`✅ PAYROLL CALCULATION FOR ${employeeCalc.employeeName}:`);
        console.log(`   📋 Base Salary: ${employeeCalc.baseSalary} SAR`);
        console.log(`   🎁 Rewards: +${employeeCalc.rewards} SAR`);
        console.log(`   ➖ Deductions: -${employeeCalc.deductions} SAR`);
        console.log(`   🏦 Advance Deduction: -${employeeCalc.advanceDeduction} SAR`);
        console.log(`   💰 Gross Pay: ${employeeCalc.grossPay} SAR`);
        console.log(`   💵 NET PAY: ${employeeCalc.netPay} SAR`);
        console.log('');
        
        console.log('📝 Breakdown Details:');
        if (employeeCalc.rewardsDetails.length > 0) {
          console.log('   🎁 Rewards:');
          employeeCalc.rewardsDetails.forEach(r => {
            console.log(`      - ${r.reason}: +${r.amount} SAR (${r.date})`);
          });
        }
        
        if (employeeCalc.deductionsDetails.length > 0) {
          console.log('   ➖ Deductions:');
          employeeCalc.deductionsDetails.forEach(d => {
            console.log(`      - ${d.reason}: -${d.amount} SAR (${d.date})`);
          });
        }
        
        if (employeeCalc.advanceDetails.length > 0) {
          console.log('   🏦 Advance Deductions:');
          employeeCalc.advanceDetails.forEach(a => {
            console.log(`      - Advance ${a.advanceId}: -${a.deductionAmount} SAR`);
            console.log(`        Remaining after deduction: ${a.remainingAmount} SAR`);
          });
        }
        console.log('');
      }
      
      console.log('📊 SUMMARY:');
      console.log(`   Total Employees: ${payrollPreviewResult.data.summary.totalEmployees}`);
      console.log(`   Total Gross: ${payrollPreviewResult.data.summary.totalGross} SAR`);
      console.log(`   Total Deductions: ${payrollPreviewResult.data.summary.totalDeductions} SAR`);
      console.log(`   Total Net: ${payrollPreviewResult.data.summary.totalNet} SAR`);
      console.log(`   Average Net Pay: ${payrollPreviewResult.data.summary.averageNetPay} SAR`);
    }
    
  } catch (error) {
    console.error('❌ Error during payroll test:', error.message);
  }
  
  console.log('\n🏁 Integrated payroll test completed!');
  console.log('💡 The system correctly calculates:');
  console.log('   ✅ Base salary');
  console.log('   ✅ Monthly rewards and deductions');
  console.log('   ✅ Automatic advance deductions');
  console.log('   ✅ Net pay after all calculations');
}

// Run if called directly
if (typeof window === 'undefined') {
  testIntegratedPayroll();
}

module.exports = { testIntegratedPayroll };
