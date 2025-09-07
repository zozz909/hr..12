import { NextRequest, NextResponse } from 'next/server';
import { EmployeeModel } from '@/lib/models/Employee';

// GET /api/employees-public - Get all employees (no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');
    const branchId = searchParams.get('branch_id');
    const status = searchParams.get('status');
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
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
