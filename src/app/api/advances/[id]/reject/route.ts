import { NextRequest, NextResponse } from 'next/server';
import { AdvanceModel } from '@/lib/models/Advance';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required')
});

// POST /api/advances/[id]/reject - Reject advance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input data
    const validationResult = rejectSchema.safeParse(body);
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

    const { reason } = validationResult.data;

    // Reject the advance
    const success = await AdvanceModel.reject(id, reason);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Advance not found or rejection failed' },
        { status: 404 }
      );
    }

    const updatedAdvance = await AdvanceModel.findById(id);

    return NextResponse.json({
      success: true,
      data: updatedAdvance,
      message: 'Advance rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting advance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reject advance' },
      { status: 500 }
    );
  }
}
