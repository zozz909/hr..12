import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionModel } from '@/lib/models/Subscription';

// GET /api/subscriptions/[id] - Get subscription by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const subscription = await SubscriptionModel.findById(id);

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/subscriptions/[id] - Update subscription
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Check if subscription exists
    const existingSubscription = await SubscriptionModel.findById(id);
    if (!existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const updatedSubscription = await SubscriptionModel.update(id, body);

    if (!updatedSubscription) {
      return NextResponse.json(
        { success: false, error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSubscription,
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions/[id] - Delete subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Check if subscription exists
    const existingSubscription = await SubscriptionModel.findById(id);
    if (!existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const success = await SubscriptionModel.delete(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
