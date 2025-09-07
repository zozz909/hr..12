import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all active institutions
    const institutions = await executeQuery(`
      SELECT id, name 
      FROM institutions 
      WHERE status = 'active' 
      ORDER BY name ASC
    `);

    // Add "غير مكفول" option at the top
    const institutionOptions = [
      { id: 'unsponsored', name: 'غير مكفول' },
      ...institutions.map((inst: any) => ({
        id: inst.id,
        name: inst.name
      }))
    ];

    console.log(`Returning ${institutionOptions.length} institutions including unsponsored option`);

    return NextResponse.json({
      success: true,
      data: institutionOptions
    });

  } catch (error) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب قائمة المؤسسات' },
      { status: 500 }
    );
  }
}
