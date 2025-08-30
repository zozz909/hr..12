import { NextRequest, NextResponse } from 'next/server';
import { BranchModel } from '@/lib/models/Branch';
import { z } from 'zod';

// Validation schema for employee transfer
const transferSchema = z.object({
  branchId: z.string().nullable()
});

// POST /api/employees/[id]/transfer - Transfer employee to branch
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = transferSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { branchId } = validationResult.data;

    // Transfer employee
    const success = await BranchModel.transferEmployee(id, branchId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Employee not found or transfer failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Employee transferred successfully'
    });

  } catch (error) {
    console.error('Error transferring employee:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to transfer employee';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
