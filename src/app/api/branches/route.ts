import { NextRequest, NextResponse } from 'next/server';
import { BranchModel } from '@/lib/models/Branch';
import { z } from 'zod';

// Validation schema for branch
const branchSchema = z.object({
  institutionId: z.string().optional().nullable(), // Optional for independent branches
  name: z.string().min(1, 'Branch name is required'),
  code: z.string().min(1, 'Branch code is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  managerId: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

// GET /api/branches - Get all branches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');

    const branches = await BranchModel.findAll(institutionId || undefined);

    return NextResponse.json({
      success: true,
      data: branches,
      count: branches.length
    });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

// POST /api/branches - Create new branch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = branchSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const branchData = {
      ...validationResult.data,
      status: validationResult.data.status || 'active'
    };

    // Create branch
    const newBranch = await BranchModel.create(branchData);

    return NextResponse.json({
      success: true,
      data: newBranch,
      message: 'Branch created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating branch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create branch';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
