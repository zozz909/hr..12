// Script to add example advance: 500 SAR over 2 months
const exampleAdvance = {
  employeeId: 'emp-meydwpre-ma1xf9',
  amount: 500,
  installments: 2,
  requestDate: '2024-03-20'
};

async function addExampleAdvance() {
  console.log('Adding example advance: 500 SAR over 2 months...');
  
  try {
    const response = await fetch('http://localhost:9004/api/advances', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exampleAdvance),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✓ Added advance: ${exampleAdvance.amount} SAR over ${exampleAdvance.installments} months`);
      console.log(`✓ Advance ID: ${result.data.id}`);
      console.log(`✓ Monthly deduction will be: ${exampleAdvance.amount / exampleAdvance.installments} SAR`);
      
      // Now approve the advance automatically for demonstration
      const approveResponse = await fetch(`http://localhost:9004/api/advances/${result.data.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvedBy: 'admin' }),
      });
      
      const approveResult = await approveResponse.json();
      
      if (approveResult.success) {
        console.log(`✓ Advance approved successfully`);
        console.log(`✓ Status: ${approveResult.data.status}`);
        console.log(`✓ Remaining amount: ${approveResult.data.remainingAmount} SAR`);
        console.log(`✓ Monthly deduction: ${approveResult.data.amount / approveResult.data.installments} SAR`);
      } else {
        console.log(`✗ Failed to approve advance: ${approveResult.error}`);
      }
      
    } else {
      console.log(`✗ Failed to add advance: ${result.error}`);
    }
  } catch (error) {
    console.log(`✗ Error adding advance:`, error.message);
  }
  
  console.log('Example advance addition completed!');
}

// Run if called directly
if (typeof window === 'undefined') {
  addExampleAdvance();
}

module.exports = { addExampleAdvance, exampleAdvance };
