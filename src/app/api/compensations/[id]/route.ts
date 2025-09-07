import { NextRequest, NextResponse } from 'next/server';
import { CompensationModel } from '@/lib/models/Compensation';
import { z } from 'zod';

// Validation schema for compensation update
const updateCompensationSchema = z.object({
  employeeId: z.string().min(1).optional(),
  type: z.enum(['deduction', 'reward']).optional(),
  amount: z.number().positive().optional(),
  reason: z.string().min(1).optional(),
  date: z.string().min(1).optional()
});

// GET /api/compensations/[id] - Get specific compensation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const compensation = await CompensationModel.findById(params.id);
    
    if (!compensation) {
      return NextResponse.json(
        { success: false, error: 'Compensation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: compensation
    });
  } catch (error) {
    console.error('Error fetching compensation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compensation' },
      { status: 500 }
    );
  }
}

// PUT /api/compensations/[id] - Update compensation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationResult = updateCompensationSchema.safeParse(body);
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

    const updateData = validationResult.data;

    // Update the compensation
    const success = await CompensationModel.update(params.id, updateData);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Compensation not found or update failed' },
        { status: 404 }
      );
    }

    const updatedCompensation = await CompensationModel.findById(params.id);

    return NextResponse.json({
      success: true,
      data: updatedCompensation,
      message: 'Compensation updated successfully'
    });

  } catch (error) {
    console.error('Error updating compensation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update compensation' },
      { status: 500 }
    );
  }
}

// DELETE /api/compensations/[id] - Delete compensation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await CompensationModel.delete(params.id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Compensation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Compensation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting compensation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete compensation' },
      { status: 500 }
    );
  }
}
