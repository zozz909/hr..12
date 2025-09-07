import { NextRequest, NextResponse } from 'next/server';
import { LeaveRequestModel } from '@/lib/models/LeaveRequest';
import { z } from 'zod';

// Validation schemas
const updateLeaveRequestSchema = z.object({
  leaveType: z.enum(['annual', 'sick', 'unpaid', 'emergency']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reason: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  approvedBy: z.string().optional(),
  rejectionReason: z.string().optional()
});

const approveLeaveSchema = z.object({
  approvedBy: z.string().min(1, 'Approver ID is required')
});

const rejectLeaveSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required')
});

// GET /api/leaves/[id] - Get specific leave request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Leave request ID is required' },
        { status: 400 }
      );
    }

    const leaveRequest = await LeaveRequestModel.findById(id);

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: leaveRequest
    });
  } catch (error) {
    console.error('Error fetching leave request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leave request' },
      { status: 500 }
    );
  }
}

// PUT /api/leaves/[id] - Update leave request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Leave request ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle special actions
    if (action === 'approve') {
      const validationResult = approveLeaveSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: validationResult.error.flatten().fieldErrors
          },
          { status: 400 }
        );
      }

      const { approvedBy } = validationResult.data;
      const success = await LeaveRequestModel.approve(id, approvedBy);

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to approve leave request' },
          { status: 500 }
        );
      }

      const updatedLeaveRequest = await LeaveRequestModel.findById(id);
      return NextResponse.json({
        success: true,
        data: updatedLeaveRequest,
        message: 'Leave request approved successfully'
      });
    }

    if (action === 'reject') {
      const validationResult = rejectLeaveSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: validationResult.error.flatten().fieldErrors
          },
          { status: 400 }
        );
      }

      const { rejectionReason } = validationResult.data;
      const success = await LeaveRequestModel.reject(id, rejectionReason);

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to reject leave request' },
          { status: 500 }
        );
      }

      const updatedLeaveRequest = await LeaveRequestModel.findById(id);
      return NextResponse.json({
        success: true,
        data: updatedLeaveRequest,
        message: 'Leave request rejected successfully'
      });
    }

    // Regular update
    const validationResult = updateLeaveRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Check if leave request exists
    const existingLeaveRequest = await LeaveRequestModel.findById(id);
    if (!existingLeaveRequest) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      );
    }

    // Update leave request
    const updatedLeaveRequest = await LeaveRequestModel.update(id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedLeaveRequest,
      message: 'Leave request updated successfully'
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update leave request' },
      { status: 500 }
    );
  }
}

// DELETE /api/leaves/[id] - Delete leave request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Leave request ID is required' },
        { status: 400 }
      );
    }

    // Check if leave request exists
    const existingLeaveRequest = await LeaveRequestModel.findById(id);
    if (!existingLeaveRequest) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      );
    }

    // Delete the leave request
    const deleted = await LeaveRequestModel.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete leave request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete leave request' },
      { status: 500 }
    );
  }
}
