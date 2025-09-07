// Script to add sample compensations data via API
const sampleCompensations = [
  {
    employeeId: 'emp-meydwpre-ma1xf9',
    type: 'reward',
    amount: 1500,
    reason: 'مكافأة الأداء المتميز للربع الأول',
    date: '2024-03-15'
  },
  {
    employeeId: 'emp-meydwpre-ma1xf9',
    type: 'deduction',
    amount: 200,
    reason: 'خصم تأخير (3 أيام)',
    date: '2024-03-10'
  },
  {
    employeeId: 'emp-meydwpre-ma1xf9',
    type: 'reward',
    amount: 2000,
    reason: 'مكافأة إنجاز مشروع العميل الكبير',
    date: '2024-03-08'
  },
  {
    employeeId: 'emp-meydwpre-ma1xf9',
    type: 'reward',
    amount: 800,
    reason: 'مكافأة تحسين العمليات',
    date: '2024-03-05'
  },
  {
    employeeId: 'emp-meydwpre-ma1xf9',
    type: 'deduction',
    amount: 150,
    reason: 'خصم كسر في المعدات',
    date: '2024-02-28'
  }
];

async function addSampleData() {
  console.log('Adding sample compensations...');
  
  for (const compensation of sampleCompensations) {
    try {
      const response = await fetch('http://localhost:9004/api/compensations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(compensation),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✓ Added ${compensation.type} for employee ${compensation.employeeId}`);
      } else {
        console.log(`✗ Failed to add ${compensation.type} for employee ${compensation.employeeId}: ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Error adding ${compensation.type} for employee ${compensation.employeeId}:`, error.message);
    }
  }
  
  console.log('Sample data addition completed!');
}

// Run if called directly
if (typeof window === 'undefined') {
  addSampleData();
}

module.exports = { addSampleData, sampleCompensations };
