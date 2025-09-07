import { NextRequest, NextResponse } from 'next/server';
import { LeaveRequestModel } from '@/lib/models/LeaveRequest';
import { z } from 'zod';

// Validation schema for leave request
const leaveRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  leaveType: z.enum(['annual', 'sick', 'unpaid', 'emergency']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(1, 'Reason is required'),
  status: z.enum(['pending', 'approved', 'rejected']).optional()
});

// GET /api/leaves - Get all leave requests with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const institutionId = searchParams.get('institution_id');
    const branchId = searchParams.get('branch_id');
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const leaveType = searchParams.get('leave_type') as 'annual' | 'sick' | 'unpaid' | 'emergency' | null;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const filters: any = {};
    if (employeeId) filters.employeeId = employeeId;
    if (institutionId) filters.institutionId = institutionId;
    if (branchId) filters.branchId = branchId;
    if (status) filters.status = status;
    if (leaveType) filters.leaveType = leaveType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const leaveRequests = await LeaveRequestModel.findAll(filters);

    return NextResponse.json({
      success: true,
      data: leaveRequests,
      count: leaveRequests.length
    });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}

// POST /api/leaves - Create new leave request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = leaveRequestSchema.safeParse(body);
    
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

    const leaveData = validationResult.data;

    // Validate date range
    const startDate = new Date(leaveData.startDate);
    const endDate = new Date(leaveData.endDate);

    // Reset time to compare only dates
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate < startDate) {
      return NextResponse.json(
        { success: false, error: 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية' },
        { status: 400 }
      );
    }

    // Create leave request
    const newLeaveRequest = await LeaveRequestModel.create({
      ...leaveData,
      status: leaveData.status || 'pending',
      requestDate: new Date().toISOString().split('T')[0]
    });

    return NextResponse.json({
      success: true,
      data: newLeaveRequest,
      message: 'Leave request created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create leave request' },
      { status: 500 }
    );
  }
}
