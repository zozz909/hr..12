import { NextRequest, NextResponse } from 'next/server';
import { CompensationModel } from '@/lib/models/Compensation';
import { z } from 'zod';

// Validation schema for compensation
const compensationSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  type: z.enum(['deduction', 'reward']),
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason is required'),
  date: z.string().min(1, 'Date is required')
});

// GET /api/compensations - Get all compensations with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const institutionId = searchParams.get('institution_id');
    const branchId = searchParams.get('branch_id');
    const type = searchParams.get('type') as 'deduction' | 'reward' | null;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const filters: any = {};
    if (employeeId) filters.employeeId = employeeId;
    if (institutionId) filters.institutionId = institutionId;
    if (branchId) filters.branchId = branchId;
    if (type) filters.type = type;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const compensations = await CompensationModel.findAll(filters);

    return NextResponse.json({
      success: true,
      data: compensations,
      count: compensations.length
    });
  } catch (error) {
    console.error('Error fetching compensations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compensations' },
      { status: 500 }
    );
  }
}

// POST /api/compensations - Create new compensation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationResult = compensationSchema.safeParse(body);
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

    const compensationData = validationResult.data;

    // Create the compensation
    const newCompensation = await CompensationModel.create(compensationData);

    return NextResponse.json({
      success: true,
      data: newCompensation,
      message: 'Compensation created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating compensation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create compensation' },
      { status: 500 }
    );
  }
}
