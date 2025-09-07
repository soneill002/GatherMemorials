import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/server'; // Changed from client to server
import { createClient } from '@/lib/supabase/server';

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

    const { sessionId, memorialId } = await request.json();

    if (!sessionId || !memorialId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    // Verify the session is paid
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { verified: false, error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Verify the memorial ID matches
    if (session.metadata?.memorialId !== memorialId) {
      return NextResponse.json(
        { verified: false, error: 'Memorial ID mismatch' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = createClient();

    // Verify the memorial is published in the database
    const { data: memorial, error: memorialError } = await supabase
      .from('memorials')
      .select('id, status, published_at')
      .eq('id', memorialId)
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { verified: false, error: 'Memorial not found' },
        { status: 404 }
      );
    }

    // Check if memorial is published
    if (memorial.status !== 'published') {
      // If not published but payment is verified, publish it now
      // This is a backup in case the webhook didn't fire
      const { error: updateError } = await supabase
        .from('memorials')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', memorialId);

      if (updateError) {
        console.error('Error publishing memorial:', updateError);
        return NextResponse.json(
          { verified: false, error: 'Failed to publish memorial' },
          { status: 500 }
        );
      }
    }

    // Verify payment record exists
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, status')
      .eq('memorial_id', memorialId)
      .eq('stripe_session_id', sessionId)
      .single();

    if (paymentError || !payment) {
      // Create payment record if it doesn't exist (backup for webhook failure)
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          memorial_id: memorialId,
          stripe_session_id: sessionId,
          stripe_payment_intent: (session.payment_intent as any)?.id || null,
          amount: session.amount_total || 14900, // $149 in cents
          currency: session.currency || 'usd',
          status: 'completed',
          paid_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating payment record:', insertError);
        // Don't fail the verification if we can't create the payment record
        // The memorial is what matters most
      }
    }

    return NextResponse.json({
      verified: true,
      memorial: {
        id: memorial.id,
        status: memorial.status || 'published',
        publishedAt: memorial.published_at
      }
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        verified: false, 
        error: error.message || 'Failed to verify payment' 
      },
      { status: 500 }
    );
  }
}