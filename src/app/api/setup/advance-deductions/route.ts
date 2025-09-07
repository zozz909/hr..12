import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

// POST /api/setup/advance-deductions - Create advance_deductions table
export async function POST(request: NextRequest) {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS advance_deductions (
        id VARCHAR(50) PRIMARY KEY,
        advance_id VARCHAR(50) NOT NULL,
        employee_id VARCHAR(50) NOT NULL,
        payroll_run_id VARCHAR(50) NOT NULL,
        deduction_amount DECIMAL(10,2) NOT NULL,
        remaining_amount DECIMAL(10,2) NOT NULL,
        deduction_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (advance_id) REFERENCES advances(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
        INDEX idx_advance_deduction_advance (advance_id),
        INDEX idx_advance_deduction_employee (employee_id),
        INDEX idx_advance_deduction_payroll (payroll_run_id),
        INDEX idx_advance_deduction_date (deduction_date)
      )
    `;

    await executeQuery(createTableQuery);

    return NextResponse.json({
      success: true,
      message: 'Advance deductions table created successfully'
    });

  } catch (error) {
    console.error('Error creating advance_deductions table:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create advance_deductions table' },
      { status: 500 }
    );
  }
}
