import { NextRequest, NextResponse } from 'next/server';
import { AdvanceModel } from '@/lib/models/Advance';
import { z } from 'zod';

const approveSchema = z.object({
  approvedBy: z.string().min(1, 'Approved by is required')
});

// POST /api/advances/[id]/approve - Approve advance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input data
    const validationResult = approveSchema.safeParse(body);
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

    const { approvedBy } = validationResult.data;

    // Approve the advance
    const success = await AdvanceModel.approve(id, approvedBy);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Advance not found or approval failed' },
        { status: 404 }
      );
    }

    const updatedAdvance = await AdvanceModel.findById(id);

    return NextResponse.json({
      success: true,
      data: updatedAdvance,
      message: 'Advance approved successfully'
    });

  } catch (error) {
    console.error('Error approving advance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve advance' },
      { status: 500 }
    );
  }
}
