import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionModel } from '@/lib/models/Subscription';
import { z } from 'zod';

// Validation schema for subscription creation
const subscriptionSchema = z.object({
  institutionId: z.string().min(1, 'Institution ID is required'),
  name: z.string().min(1, 'Subscription name is required'),
  icon: z.string().optional().default('ShieldCheck'),
  expiryDate: z.string().optional()
});

// GET /api/subscriptions - Get subscriptions by institution
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');

    if (!institutionId) {
      return NextResponse.json(
        { success: false, error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    const subscriptions = await SubscriptionModel.findByInstitutionId(institutionId);

    return NextResponse.json({
      success: true,
      data: subscriptions
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received subscription data:', body);

    // Validate request body
    const validationResult = subscriptionSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.flatten().fieldErrors);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create subscription
    const subscription = await SubscriptionModel.create(data);

    return NextResponse.json({
      success: true,
      data: subscription
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
