import { NextRequest, NextResponse } from 'next/server';
import { AdvanceModel } from '@/lib/models/Advance';

// POST /api/advances/[id]/pay - Mark advance as paid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Mark the advance as paid
    const success = await AdvanceModel.markAsPaid(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Advance not found or payment failed' },
        { status: 404 }
      );
    }

    const updatedAdvance = await AdvanceModel.findById(id);

    return NextResponse.json({
      success: true,
      data: updatedAdvance,
      message: 'Advance marked as paid successfully'
    });

  } catch (error) {
    console.error('Error marking advance as paid:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark advance as paid' },
      { status: 500 }
    );
  }
}
