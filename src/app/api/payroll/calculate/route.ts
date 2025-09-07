import { NextRequest, NextResponse } from 'next/server';
import { PayrollModel } from '@/lib/models/Payroll';
import { z } from 'zod';

const calculatePayrollSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  institutionId: z.string().optional()
});

// POST /api/payroll/calculate - Calculate payroll without creating run (preview)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationResult = calculatePayrollSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { month, institutionId } = validationResult.data;

    // Calculate payroll for all employees
    const calculations = await PayrollModel.calculatePayroll(month, institutionId);

    // Calculate summary
    let totalEmployees = calculations.length;
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalRewards = 0;
    let totalAdvanceDeductions = 0;

    calculations.forEach(calc => {
      totalGross += calc.grossPay;
      totalDeductions += calc.deductions + calc.advanceDeduction;
      totalNet += calc.netPay;
      totalRewards += calc.rewards;
      totalAdvanceDeductions += calc.advanceDeduction;
    });

    return NextResponse.json({
      success: true,
      data: {
        month,
        institutionId,
        calculations,
        summary: {
          totalEmployees,
          totalGross: Math.round(totalGross * 100) / 100,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          totalNet: Math.round(totalNet * 100) / 100,
          totalRewards: Math.round(totalRewards * 100) / 100,
          totalAdvanceDeductions: Math.round(totalAdvanceDeductions * 100) / 100,
          averageGrossPay: totalEmployees > 0 ? Math.round((totalGross / totalEmployees) * 100) / 100 : 0,
          averageNetPay: totalEmployees > 0 ? Math.round((totalNet / totalEmployees) * 100) / 100 : 0
        }
      },
      message: `Calculated payroll for ${totalEmployees} employees`
    });

  } catch (error) {
    console.error('Error calculating payroll:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate payroll' },
      { status: 500 }
    );
  }
}
