import { NextRequest, NextResponse } from 'next/server';
import { BranchModel } from '@/lib/models/Branch';

// GET /api/branches/[id]/employees - Get employees by branch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employees = await BranchModel.getEmployees(params.id);

    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    console.error('Error fetching branch employees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branch employees' },
      { status: 500 }
    );
  }
}
