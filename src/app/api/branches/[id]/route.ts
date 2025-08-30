import { NextRequest, NextResponse } from 'next/server';
import { BranchModel } from '@/lib/models/Branch';
import { z } from 'zod';

// Validation schema for branch update
const updateBranchSchema = z.object({
  institutionId: z.string().optional().nullable(),
  name: z.string().min(1, 'Branch name is required').optional(),
  code: z.string().min(1, 'Branch code is required').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  managerId: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

// GET /api/branches/[id] - Get branch by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const branch = await BranchModel.findById(id);

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: branch
    });
  } catch (error) {
    console.error('Error fetching branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branch' },
      { status: 500 }
    );
  }
}

// PUT /api/branches/[id] - Update branch
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = updateBranchSchema.safeParse(body);

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

    const branchData = validationResult.data;

    // Update branch
    const updatedBranch = await BranchModel.update(id, branchData);

    if (!updatedBranch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedBranch,
      message: 'Branch updated successfully'
    });

  } catch (error) {
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update branch' },
      { status: 500 }
    );
  }
}

// DELETE /api/branches/[id] - Delete branch
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await BranchModel.delete(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Branch deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete branch' },
      { status: 500 }
    );
  }
}
