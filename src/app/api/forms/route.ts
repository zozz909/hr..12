import { NextRequest, NextResponse } from 'next/server';
import { FormModel } from '@/lib/models/Form';
import { z } from 'zod';

// Validation schema for form creation
const createFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['hr', 'finance', 'general']),
  iconName: z.string().optional(),
  iconColor: z.string().optional(),
  filePath: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  isActive: z.boolean().default(true)
});

// Validation schema for form update
const updateFormSchema = createFormSchema.partial();

// GET /api/forms - Get all forms with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as 'hr' | 'finance' | 'general' | null;
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search');

    const filters: any = {};
    if (category) filters.category = category;
    if (isActive !== null) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const forms = await FormModel.findAll(filters);

    return NextResponse.json({
      success: true,
      data: forms,
      count: forms.length
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}

// POST /api/forms - Create new form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validationResult = createFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const formData = validationResult.data;

    // Create the form
    const newForm = await FormModel.create(formData);

    return NextResponse.json({
      success: true,
      data: newForm,
      message: 'Form created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create form' },
      { status: 500 }
    );
  }
}
