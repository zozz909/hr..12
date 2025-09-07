import { NextRequest, NextResponse } from 'next/server';
import { PayrollModel } from '@/lib/models/Payroll';

// GET /api/payroll/[id] - Get specific payroll run with entries
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payrollRun = await PayrollModel.findRunById(id);
    
    if (!payrollRun) {
      return NextResponse.json(
        { success: false, error: 'Payroll run not found' },
        { status: 404 }
      );
    }

    const entries = await PayrollModel.getPayrollEntries(id);

    return NextResponse.json({
      success: true,
      data: {
        payrollRun,
        entries
      }
    });
  } catch (error) {
    console.error('Error fetching payroll run:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll run' },
      { status: 500 }
    );
  }
}

// DELETE /api/payroll/[id] - Delete payroll run
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await PayrollModel.deleteRun(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Payroll run not found or deletion failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payroll run deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payroll run:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete payroll run' },
      { status: 500 }
    );
  }
}
