import { NextRequest, NextResponse } from 'next/server';
import { PayrollModel } from '@/lib/models/Payroll';

// GET /api/payroll/stats - Get payroll statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');
    const startMonth = searchParams.get('start_month');
    const endMonth = searchParams.get('end_month');

    const filters: any = {};
    if (institutionId) filters.institutionId = institutionId;
    if (startMonth) filters.startMonth = startMonth;
    if (endMonth) filters.endMonth = endMonth;

    const stats = await PayrollModel.getStats(filters);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching payroll stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll statistics' },
      { status: 500 }
    );
  }
}
