// Complete demo of integrated payroll system
async function demoCompletePayroll() {
  console.log('🎯 DEMO: Complete Integrated Payroll System\n');
  console.log('📋 Scenario: Employee with 5000 SAR salary, 500 SAR advance over 2 months\n');

  const employeeId = 'emp-meydwpre-ma1xf9';
  const month = '2024-03';

  try {
    // Step 1: Setup employee with proper salary
    console.log('👤 Step 1: Setting up employee with 5000 SAR salary...');
    const updateEmployeeResponse = await fetch(`http://localhost:9004/api/employees/${employeeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        salary: 5000
      }),
    });

    if (updateEmployeeResponse.ok) {
      console.log('✓ Employee salary updated to 5000 SAR');
    }

    // Step 2: Add sample advance (500 SAR over 2 months)
    console.log('\n🏦 Step 2: Adding 500 SAR advance over 2 months...');
    const advanceResponse = await fetch('http://localhost:9004/api/advances', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: employeeId,
        amount: 500,
        installments: 2,
        requestDate: '2024-03-01'
      }),
    });

    const advanceResult = await advanceResponse.json();
    let advanceId = '';

    if (advanceResult.success) {
      advanceId = advanceResult.data.id;
      console.log(`✓ Advance created: ${advanceId}`);
      console.log(`✓ Monthly deduction will be: 250 SAR (500 ÷ 2)`);

      // Approve the advance
      const approveResponse = await fetch(`http://localhost:9004/api/advances/${advanceId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvedBy: 'admin' }),
      });

      if (approveResponse.ok) {
        console.log('✓ Advance approved and ready for deduction');
      }
    }

    // Step 3: Add sample compensations for March
    console.log('\n💰 Step 3: Adding compensations for March 2024...');

    const compensations = [
      {
        employeeId: employeeId,
        type: 'reward',
        amount: 800,
        reason: 'مكافأة الأداء المتميز',
        date: '2024-03-15'
      },
      {
        employeeId: employeeId,
        type: 'reward',
        amount: 300,
        reason: 'مكافأة الحضور والانضباط',
        date: '2024-03-20'
      },
      {
        employeeId: employeeId,
        type: 'deduction',
        amount: 200,
        reason: 'خصم تأخير',
        date: '2024-03-10'
      }
    ];

    for (const comp of compensations) {
      const compResponse = await fetch('http://localhost:9004/api/compensations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comp),
      });

      if (compResponse.ok) {
        console.log(`✓ Added ${comp.type}: ${comp.amount} SAR - ${comp.reason}`);
      }
    }

    // Step 4: Calculate payroll preview
    console.log('\n📊 Step 4: Calculating payroll for March 2024...');
    const payrollResponse = await fetch('http://localhost:9004/api/payroll/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ month: month }),
    });

    const payrollResult = await payrollResponse.json();

    if (payrollResult.success) {
      const employeeCalc = payrollResult.data.calculations.find(c => c.employeeId === employeeId);

      if (employeeCalc) {
        console.log('\n🎉 COMPLETE PAYROLL CALCULATION:');
        console.log('═══════════════════════════════════════');
        console.log(`👤 Employee: ${employeeCalc.employeeName}`);
        console.log(`📋 Base Salary: ${employeeCalc.baseSalary} SAR`);
        console.log(`🎁 Total Rewards: +${employeeCalc.rewards} SAR`);
        console.log(`   - Performance Bonus: +800 SAR`);
        console.log(`   - Attendance Bonus: +300 SAR`);
        console.log(`➖ Total Deductions: -${employeeCalc.deductions} SAR`);
        console.log(`   - Late Deduction: -200 SAR`);
        console.log(`🏦 Advance Deduction: -${employeeCalc.advanceDeduction} SAR`);
        console.log(`   - Monthly installment (500÷2): -250 SAR`);
        console.log('───────────────────────────────────────');
        console.log(`💰 Gross Pay: ${employeeCalc.grossPay} SAR (${employeeCalc.baseSalary} + ${employeeCalc.rewards})`);
        console.log(`💵 NET PAY: ${employeeCalc.netPay} SAR`);
        console.log('═══════════════════════════════════════');

        console.log('\n📈 Calculation Breakdown:');
        console.log(`   Base Salary:        ${employeeCalc.baseSalary.toFixed(2)} SAR`);
        console.log(`   + Rewards:         +${employeeCalc.rewards.toFixed(2)} SAR`);
        console.log(`   = Gross Pay:        ${employeeCalc.grossPay.toFixed(2)} SAR`);
        console.log(`   - Deductions:      -${employeeCalc.deductions.toFixed(2)} SAR`);
        console.log(`   - Advance:         -${employeeCalc.advanceDeduction.toFixed(2)} SAR`);
        console.log(`   = NET PAY:          ${employeeCalc.netPay.toFixed(2)} SAR`);
      }

      console.log('\n📊 PAYROLL SUMMARY:');
      console.log(`   Total Employees: ${payrollResult.data.summary.totalEmployees}`);
      console.log(`   Total Gross: ${payrollResult.data.summary.totalGross} SAR`);
      console.log(`   Total Deductions: ${payrollResult.data.summary.totalDeductions} SAR`);
      console.log(`   Total Net: ${payrollResult.data.summary.totalNet} SAR`);
    }

    console.log('\n🎯 NEXT MONTH SIMULATION:');
    console.log('If we run payroll for April 2024:');
    console.log('   - Advance remaining: 250 SAR (500 - 250)');
    console.log('   - April deduction: 250 SAR (final installment)');
    console.log('   - Advance status: Will become "paid" after April');
    console.log('   - May payroll: No advance deduction (fully paid)');

  } catch (error) {
    console.error('❌ Error during demo:', error.message);
  }

  console.log('\n🏁 Complete payroll demo finished!');
  console.log('\n💡 The integrated system handles:');
  console.log('   ✅ Base salaries from employee records');
  console.log('   ✅ Monthly rewards and deductions from compensations');
  console.log('   ✅ Automatic advance deductions with installment tracking');
  console.log('   ✅ Accurate net pay calculation');
  console.log('   ✅ Complete audit trail for all transactions');
}

// Run if called directly
if (typeof window === 'undefined') {
  demoCompletePayroll();
}

module.exports = { demoCompletePayroll };