import { NextRequest, NextResponse } from 'next/server';
import { CompensationModel } from '@/lib/models/Compensation';

// GET /api/compensations/stats - Get compensation statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');
    const branchId = searchParams.get('branch_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const filters: any = {};
    if (institutionId) filters.institutionId = institutionId;
    if (branchId) filters.branchId = branchId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await CompensationModel.getStats(filters);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching compensation stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compensation statistics' },
      { status: 500 }
    );
  }
}
