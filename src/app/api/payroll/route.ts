import { NextRequest, NextResponse } from 'next/server';
import { PayrollModel } from '@/lib/models/Payroll';
import { z } from 'zod';

// Validation schema for payroll run
const payrollRunSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  institutionId: z.string().optional()
});

// GET /api/payroll - Get all payroll runs with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');
    const status = searchParams.get('status') as 'completed' | 'pending' | 'failed' | null;
    const startMonth = searchParams.get('start_month');
    const endMonth = searchParams.get('end_month');

    const filters: any = {};
    if (institutionId) filters.institutionId = institutionId;
    if (status) filters.status = status;
    if (startMonth) filters.startMonth = startMonth;
    if (endMonth) filters.endMonth = endMonth;

    const payrollRuns = await PayrollModel.findAllRuns(filters);

    return NextResponse.json({
      success: true,
      data: payrollRuns,
      count: payrollRuns.length
    });
  } catch (error) {
    console.error('Error fetching payroll runs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll runs' },
      { status: 500 }
    );
  }
}

// POST /api/payroll - Create and process new payroll run
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationResult = payrollRunSchema.safeParse(body);
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

    // Check if payroll run already exists for this month and institution
    const existingRuns = await PayrollModel.findAllRuns({
      institutionId,
      startMonth: month,
      endMonth: month
    });

    if (existingRuns.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Payroll run already exists for this month and institution' },
        { status: 400 }
      );
    }

    // Create payroll run
    const payrollRun = await PayrollModel.createRun({
      month,
      institutionId
    });

    // Process the payroll run
    const result = await PayrollModel.processPayrollRun(payrollRun.id);

    return NextResponse.json({
      success: true,
      data: {
        payrollRun: await PayrollModel.findRunById(payrollRun.id),
        summary: {
          totalEmployees: result.totalEmployees,
          totalGross: result.totalGross,
          totalDeductions: result.totalDeductions,
          totalNet: result.totalNet
        },
        entries: result.entries
      },
      message: `Payroll run completed successfully for ${result.totalEmployees} employees`
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating payroll run:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payroll run' },
      { status: 500 }
    );
  }
}
