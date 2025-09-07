import { NextRequest, NextResponse } from 'next/server';
import { AdvanceDeductionModel } from '@/lib/models/AdvanceDeduction';
import { z } from 'zod';

const autoDeductSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  payrollRunId: z.string().min(1, 'Payroll run ID is required')
});

// POST /api/advances/auto-deduct - Process automatic advance deductions for an employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationResult = autoDeductSchema.safeParse(body);
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

    const { employeeId, payrollRunId } = validationResult.data;

    // Process advance deductions
    const result = await AdvanceDeductionModel.processAdvanceDeductions(payrollRunId, employeeId);

    return NextResponse.json({
      success: true,
      data: {
        totalDeduction: result.totalDeduction,
        deductionsCount: result.deductions.length,
        deductions: result.deductions
      },
      message: `Processed ${result.deductions.length} advance deductions totaling ${result.totalDeduction} SAR`
    });

  } catch (error) {
    console.error('Error processing advance deductions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process advance deductions' },
      { status: 500 }
    );
  }
}

// GET /api/advances/auto-deduct?employee_id=xxx - Calculate monthly deduction for an employee
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Calculate total monthly deduction
    const totalDeduction = await AdvanceDeductionModel.calculateTotalMonthlyDeduction(employeeId);
    
    // Get active advances details
    const activeAdvances = await AdvanceDeductionModel.getActiveAdvancesForEmployee(employeeId);

    return NextResponse.json({
      success: true,
      data: {
        employeeId,
        totalMonthlyDeduction: totalDeduction,
        activeAdvances: activeAdvances,
        advancesCount: activeAdvances.length
      }
    });

  } catch (error) {
    console.error('Error calculating advance deductions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate advance deductions' },
      { status: 500 }
    );
  }
}
