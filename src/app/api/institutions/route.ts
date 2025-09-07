import { NextRequest, NextResponse } from 'next/server';
import { InstitutionModel } from '@/lib/models/Institution';
import { z } from 'zod';
import { requirePermission, unauthorizedResponse, unauthenticatedResponse } from '@/lib/auth-utils';

// Validation schema for institution creation/update
const institutionSchema = z.object({
  name: z.string().min(1, 'Institution name is required'),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  crNumber: z.string().min(1, 'Commercial registration number is required'),
  crIssueDate: z.string().optional(),
  crExpiryDate: z.string().min(1, 'Commercial registration expiry date is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'suspended']).optional()
});

// GET /api/institutions - Get all institutions
export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة والصلاحية - معطل مؤقتاً للتطوير
    // const { user, hasPermission } = await requirePermission(request, 'institutions_view');

    // if (!user) {
    //   return unauthenticatedResponse();
    // }

    // if (!hasPermission) {
    //   return unauthorizedResponse('ليس لديك صلاحية لعرض المؤسسات');
    // }

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

// POST /api/institutions - Create new institution
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة والصلاحية - معطل مؤقتاً للتطوير
    // const { user, hasPermission } = await requirePermission(request, 'institutions_add');

    // if (!user) {
    //   return unauthenticatedResponse();
    // }

    // if (!hasPermission) {
    //   return unauthorizedResponse('ليس لديك صلاحية لإضافة المؤسسات');
    // }

    const body = await request.json();

    // Validate request body
    const validationResult = institutionSchema.safeParse(body);
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

    const institutionData = {
      ...validationResult.data,
      status: validationResult.data.status || 'active'
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

// PUT /api/institutions - Bulk update (if needed)
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Bulk updates not supported. Use /api/institutions/[id] for individual updates.'
    },
    { status: 405 }
  );
}

// DELETE /api/institutions - Bulk delete (if needed)
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Bulk deletes not supported. Use /api/institutions/[id] for individual deletes.'
    },
    { status: 405 }
  );
}