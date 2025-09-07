// Script to add sample advances data via API
const sampleAdvances = [
  {
    employeeId: 'emp-meydwpre-ma1xf9',
    amount: 5000,
    installments: 5,
    requestDate: '2024-03-15'
  },
  {
    employeeId: 'emp-meydwpre-ma1xf9',
    amount: 3000,
    installments: 3,
    requestDate: '2024-03-10'
  },
  {
    employeeId: 'emp-meydwpre-ma1xf9',
    amount: 2000,
    installments: 2,
    requestDate: '2024-03-05'
  },
  {
    employeeId: 'emp-meydwpre-ma1xf9',
    amount: 1500,
    installments: 1,
    requestDate: '2024-02-28'
  },
  {
    employeeId: 'emp-meydwpre-ma1xf9',
    amount: 4000,
    installments: 4,
    requestDate: '2024-02-20'
  }
];

async function addSampleData() {
  console.log('Adding sample advances...');
  
  for (const advance of sampleAdvances) {
    try {
      const response = await fetch('http://localhost:9004/api/advances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(advance),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✓ Added advance of ${advance.amount} SAR for employee ${advance.employeeId}`);
      } else {
        console.log(`✗ Failed to add advance for employee ${advance.employeeId}: ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Error adding advance for employee ${advance.employeeId}:`, error.message);
    }
  }
  
  console.log('Sample advances addition completed!');
}

// Run if called directly
if (typeof window === 'undefined') {
  addSampleData();
}

module.exports = { addSampleData, sampleAdvances };
