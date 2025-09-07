import { NextRequest, NextResponse } from 'next/server';
import { FormModel } from '@/lib/models/Form';

// GET /api/forms/stats - Get forms statistics
export async function GET(request: NextRequest) {
  try {
    const stats = await FormModel.getStats();

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching forms stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch forms statistics' },
      { status: 500 }
    );
  }
}
