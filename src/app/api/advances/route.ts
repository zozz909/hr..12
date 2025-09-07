import { NextRequest, NextResponse } from 'next/server';
import { AdvanceModel } from '@/lib/models/Advance';
import { z } from 'zod';

// Validation schema for advance
const advanceSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  amount: z.number().positive('Amount must be positive'),
  installments: z.number().int().positive('Installments must be a positive integer').optional(),
  requestDate: z.string().optional()
});

// GET /api/advances - Get all advances with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const institutionId = searchParams.get('institution_id');
    const branchId = searchParams.get('branch_id');
    const status = searchParams.get('status') as 'pending' | 'approved' | 'paid' | 'rejected' | null;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const filters: any = {};
    if (employeeId) filters.employeeId = employeeId;
    if (institutionId) filters.institutionId = institutionId;
    if (branchId) filters.branchId = branchId;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const advances = await AdvanceModel.findAll(filters);

    return NextResponse.json({
      success: true,
      data: advances,
      count: advances.length
    });
  } catch (error) {
    console.error('Error fetching advances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advances' },
      { status: 500 }
    );
  }
}

// POST /api/advances - Create new advance request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationResult = advanceSchema.safeParse(body);
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

    const advanceData = validationResult.data;

    // Set default values
    const newAdvanceData = {
      ...advanceData,
      requestDate: advanceData.requestDate || new Date().toISOString(),
      status: 'pending' as const,
      installments: advanceData.installments || 1
    };

    // Create the advance
    const newAdvance = await AdvanceModel.create(newAdvanceData);

    return NextResponse.json({
      success: true,
      data: newAdvance,
      message: 'Advance request created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating advance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create advance request' },
      { status: 500 }
    );
  }
}
