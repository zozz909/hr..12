import { NextRequest, NextResponse } from 'next/server';
import { EmployeeModel } from '@/lib/models/Employee';
import { z } from 'zod';

// Validation schema for employee updates
const updateEmployeeSchema = z.object({
  name: z.string().min(1, 'Employee name is required').optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  mobile: z.string().optional(),
  iqamaNumber: z.string().optional(),
  iqamaExpiry: z.string().optional(),
  healthInsuranceExpiry: z.string().optional(),
  workPermitExpiry: z.string().optional(),
  healthCertExpiry: z.string().optional(),
  contractExpiry: z.string().optional(),
  institutionId: z.string().nullable().optional(),
  salary: z.number().min(0, 'Salary must be non-negative').optional(),
  fileNumber: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
  unsponsoredReason: z.enum(['transferred', 'new', 'temporary_hold']).nullable().optional(),
  archiveReason: z.enum(['resignation', 'termination', 'retirement', 'transfer', 'contract_end', 'medical_leave', 'disciplinary', 'other']).nullable().optional(),
  archivedAt: z.string().optional(),
  archiveDate: z.string().optional()
});

// Transfer employee schema
const transferEmployeeSchema = z.object({
  newInstitutionId: z.string().nullable(),
  reason: z.string().optional()
});

// Archive employee schema
const archiveEmployeeSchema = z.object({
  reason: z.enum(['terminated', 'final_exit'])
});

// GET /api/employees/[id] - Get specific employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get additional data based on query parameters
    const { searchParams } = new URL(request.url);
    const includeDocuments = searchParams.get('include_documents') === 'true';

    if (includeDocuments) {
      employee.documents = await EmployeeModel.getDocuments(id);
    }

    return NextResponse.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/employees/[id] - Update specific employee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle special actions
    if (action === 'transfer') {
      const validationResult = transferEmployeeSchema.safeParse(body);
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

      const { newInstitutionId, reason } = validationResult.data;
      const success = await EmployeeModel.transfer(id, newInstitutionId, reason);

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to transfer employee' },
          { status: 500 }
        );
      }

      const updatedEmployee = await EmployeeModel.findById(id);
      return NextResponse.json({
        success: true,
        data: updatedEmployee,
        message: 'Employee transferred successfully'
      });
    }

    if (action === 'archive') {
      const validationResult = archiveEmployeeSchema.safeParse(body);
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

      const { reason } = validationResult.data;
      const success = await EmployeeModel.archive(id, reason);

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to archive employee' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Employee archived successfully'
      });
    }

    // Regular update
    const validationResult = updateEmployeeSchema.safeParse(body);
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

    // Check if employee exists
    const existingEmployee = await EmployeeModel.findById(id);
    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Update employee
    const updatedEmployee = await EmployeeModel.update(id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    console.error('Error updating employee:', error);

    // Handle duplicate key errors
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee with this Iqama number already exists'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Archive employee (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Check if employee exists
    const existingEmployee = await EmployeeModel.findById(id);
    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get reason from query params or request body
    const { searchParams } = new URL(request.url);
    let reason = searchParams.get('reason') as 'terminated' | 'final_exit' | null;

    if (!reason) {
      try {
        const body = await request.json();
        reason = body.reason;
      } catch {
        // If no body, default to terminated
        reason = 'terminated';
      }
    }

    if (!reason || !['terminated', 'final_exit'].includes(reason)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Archive reason is required and must be either "terminated" or "final_exit"'
        },
        { status: 400 }
      );
    }

    // Archive the employee
    const archived = await EmployeeModel.archive(id, reason);

    if (!archived) {
      return NextResponse.json(
        { success: false, error: 'Failed to archive employee' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Employee archived successfully with reason: ${reason}`
    });
  } catch (error) {
    console.error('Error archiving employee:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to archive employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}