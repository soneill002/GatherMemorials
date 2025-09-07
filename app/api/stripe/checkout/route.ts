import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getStripe, MEMORIAL_PRODUCT } from '@/lib/stripe/server'; // Changed to server
import type { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    // Get Stripe instance
    const stripe = getStripe();
    
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      );
    }

    // Parse request body
    const { memorialId } = await request.json();

    if (!memorialId) {
      return NextResponse.json(
        { error: 'Memorial ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = createServerComponentClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify memorial ownership
    const { data: memorial, error: memorialError } = await supabase
      .from('memorials')
      .select('*')
      .eq('id', memorialId)
      .eq('user_id', user.id)
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: 'Memorial not found or access denied' },
        { status: 404 }
      );
    }

    // Check if memorial is already paid
    if (memorial.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Memorial has already been paid for' },
        { status: 400 }
      );
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: MEMORIAL_PRODUCT.priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/memorials/${memorialId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/memorials/new?step=9&memorial=${memorialId}`,
      customer_email: profile?.email || user.email,
      metadata: {
        memorial_id: memorialId,
        user_id: user.id,
        memorial_name: memorial.name,
        deceased_name: `${memorial.first_name} ${memorial.last_name}`,
      },
      payment_intent_data: {
        metadata: {
          memorial_id: memorialId,
          user_id: user.id,
        },
      },
    });

    // Update memorial with pending payment status
    await supabase
      .from('memorials')
      .update({ 
        payment_status: 'pending',
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memorialId);

    return NextResponse.json({ 
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Retrieve session status (for success page)
export async function GET(request: NextRequest) {
  try {
    // Get Stripe instance
    const stripe = getStripe();
    
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = createServerComponentClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    });

    // Verify user owns this session
    if (session.metadata?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      status: session.payment_status,
      memorialId: session.metadata?.memorial_id,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}