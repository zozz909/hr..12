import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionModel } from '@/lib/models/Subscription';

// GET /api/subscriptions - Get subscriptions by institution ID
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
      data: subscriptions,
      count: subscriptions.length
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscriptions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { institutionId, name, icon, expiryDate } = body;

    if (!institutionId || !name) {
      return NextResponse.json(
        { success: false, error: 'Institution ID and name are required' },
        { status: 400 }
      );
    }

    const subscriptionData = {
      institutionId,
      name,
      icon: icon || 'ShieldCheck',
      expiryDate
    };

    const newSubscription = await SubscriptionModel.create(subscriptionData);

    return NextResponse.json({
      success: true,
      data: newSubscription,
      message: 'Subscription created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
