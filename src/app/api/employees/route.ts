import { NextRequest, NextResponse } from 'next/server';
import { EmployeeModel } from '@/lib/models/Employee';
import { z } from 'zod';

// Validation schema for employee creation/update
const employeeSchema = z.object({
  name: z.string().min(1, 'Employee name is required'),
  mobile: z.string().min(1, 'Mobile number is required'),
  email: z.string().email().optional().or(z.literal('')),
  fileNumber: z.string().min(1, 'File number is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  position: z.string().optional(),
  branchId: z.string().nullable().optional(),
  salary: z.number().min(0, 'Salary must be non-negative').optional(),
  iqamaNumber: z.string().optional(),
  iqamaExpiry: z.string().optional(),
  workPermitExpiry: z.string().optional(),
  contractExpiry: z.string().optional(),
  healthInsuranceExpiry: z.string().optional(),
  healthCertExpiry: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  institutionId: z.string().nullable().optional(),
  status: z.enum(['active', 'archived']).optional(),
  unsponsoredReason: z.enum(['transferred', 'new', 'temporary_hold']).nullable().optional(),
  archiveReason: z.enum(['terminated', 'final_exit']).nullable().optional(),
  archiveDate: z.string().optional()
});

// GET /api/employees - Get all employees with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');
    const branchId = searchParams.get('branch_id');
    const status = searchParams.get('status') as 'active' | 'archived' | null;
    const search = searchParams.get('search');
    const unsponsored = searchParams.get('unsponsored') === 'true';
    const expiring = searchParams.get('expiring') === 'true';
    const days = searchParams.get('days');

    let employees;

    if (unsponsored) {
      employees = await EmployeeModel.findUnsponsored();
    } else if (expiring) {
      const expiringDays = days ? parseInt(days) : 30;
      employees = await EmployeeModel.getExpiringDocuments(expiringDays);
    } else {
      const filters: any = {};

      if (institutionId) {
        if (institutionId === 'none') {
          filters.institutionId = null; // For unsponsored employees
        } else {
          filters.institutionId = institutionId;
        }
      }
      if (branchId) {
        if (branchId === 'none') {
          filters.branchId = null; // For employees without branch
        } else {
          filters.branchId = branchId;
        }
      }
      if (status) filters.status = status;
      if (search) filters.search = search;

      employees = await EmployeeModel.findAll(filters);
    }

    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch employees',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = employeeSchema.safeParse(body);
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

    const employeeData = validationResult.data;

    // Create employee
    const newEmployee = await EmployeeModel.create(employeeData);

    return NextResponse.json(
      {
        success: true,
        data: newEmployee,
        message: 'Employee created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating employee:', error);

    // Handle duplicate key errors (e.g., duplicate file number)
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee with this file number or Iqama number already exists'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create employee',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}

// PUT /api/employees - Bulk update (if needed)
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Bulk updates not supported. Use /api/employees/[id] for individual updates.'
    },
    { status: 405 }
  );
}

// DELETE /api/employees - Bulk delete (if needed)
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Bulk deletes not supported. Use /api/employees/[id] for individual deletes.'
    },
    { status: 405 }
  );
}