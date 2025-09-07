import { NextRequest, NextResponse } from 'next/server';
import { InstitutionModel } from '@/lib/models/Institution';

// GET /api/institutions-public - Get all institutions (no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeExpiring = searchParams.get('expiring');
    const days = searchParams.get('days');

    let institutions;

    if (includeExpiring === 'true') {
      const expiringDays = days ? parseInt(days) : 30;
      institutions = await InstitutionModel.getExpiringLicenses(expiringDays);
    } else {
      institutions = await InstitutionModel.findAll();
    }

    return NextResponse.json({
      success: true,
      data: institutions,
      count: institutions.length
    });

  } catch (error) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch institutions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/institutions-public - Create new institution (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const institutionData = {
      ...body,
      status: body.status || 'active'
    };

    // Create institution
    const newInstitution = await InstitutionModel.create(institutionData);

    return NextResponse.json(
      {
        success: true,
        data: newInstitution,
        message: 'Institution created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating institution:', error);

    // Handle duplicate key errors
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Institution with this commercial registration number already exists'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create institution',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
