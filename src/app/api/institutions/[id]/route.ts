import { NextRequest, NextResponse } from 'next/server';
import { InstitutionModel } from '@/lib/models/Institution';
import { z } from 'zod';

// Validation schema for institution updates
const updateInstitutionSchema = z.object({
  name: z.string().min(1, 'Institution name is required').optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  crNumber: z.string().min(1, 'Commercial registration number is required').optional(),
  crIssueDate: z.string().optional(),
  crExpiryDate: z.string().min(1, 'Commercial registration expiry date is required').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'suspended']).optional()
});

// GET /api/institutions/[id] - Get specific institution
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    const institution = await InstitutionModel.findById(id);

    if (!institution) {
      return NextResponse.json(
        { success: false, error: 'Institution not found' },
        { status: 404 }
      );
    }

    // Get additional data based on query parameters
    const { searchParams } = new URL(request.url);
    const includeDocuments = searchParams.get('include_documents') === 'true';
    const includeSubscriptions = searchParams.get('include_subscriptions') === 'true';

    if (includeDocuments) {
      institution.documents = await InstitutionModel.getDocuments(id);
    }

    if (includeSubscriptions) {
      institution.subscriptions = await InstitutionModel.getSubscriptions(id);
    }

    return NextResponse.json({
      success: true,
      data: institution
    });
  } catch (error) {
    console.error('Error fetching institution:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch institution',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/institutions/[id] - Update specific institution
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateInstitutionSchema.safeParse(body);
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

    const updateData = validationResult.data;

    // Check if institution exists
    const existingInstitution = await InstitutionModel.findById(id);
    if (!existingInstitution) {
      return NextResponse.json(
        { success: false, error: 'Institution not found' },
        { status: 404 }
      );
    }

    // Update institution
    const updatedInstitution = await InstitutionModel.update(id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedInstitution,
      message: 'Institution updated successfully'
    });
  } catch (error) {
    console.error('Error updating institution:', error);

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
        error: 'Failed to update institution',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/institutions/[id] - Delete specific institution (hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    // Check if institution exists
    const existingInstitution = await InstitutionModel.findById(id);

    if (!existingInstitution) {
      return NextResponse.json(
        { success: false, error: 'Institution not found' },
        { status: 404 }
      );
    }

    // Hard delete the institution (permanently remove from database)
    const deleted = await InstitutionModel.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete institution' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Institution deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting institution:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete institution',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}