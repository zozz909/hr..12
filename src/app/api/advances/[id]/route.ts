import { NextRequest, NextResponse } from 'next/server';
import { AdvanceModel } from '@/lib/models/Advance';
import { z } from 'zod';

// Validation schema for advance update
const updateAdvanceSchema = z.object({
  employeeId: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  installments: z.number().int().positive().optional(),
  status: z.enum(['pending', 'approved', 'paid', 'rejected']).optional(),
  paidAmount: z.number().min(0).optional(),
  approvedBy: z.string().optional(),
  approvedDate: z.string().optional(),
  rejectionReason: z.string().optional()
});

// GET /api/advances/[id] - Get specific advance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const advance = await AdvanceModel.findById(id);
    
    if (!advance) {
      return NextResponse.json(
        { success: false, error: 'Advance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: advance
    });
  } catch (error) {
    console.error('Error fetching advance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advance' },
      { status: 500 }
    );
  }
}

// PUT /api/advances/[id] - Update advance
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input data
    const validationResult = updateAdvanceSchema.safeParse(body);
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

    // Update the advance
    const success = await AdvanceModel.update(id, updateData);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Advance not found or update failed' },
        { status: 404 }
      );
    }

    const updatedAdvance = await AdvanceModel.findById(id);

    return NextResponse.json({
      success: true,
      data: updatedAdvance,
      message: 'Advance updated successfully'
    });

  } catch (error) {
    console.error('Error updating advance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update advance' },
      { status: 500 }
    );
  }
}

// DELETE /api/advances/[id] - Delete advance
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await AdvanceModel.delete(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Advance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Advance deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting advance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete advance' },
      { status: 500 }
    );
  }
}
