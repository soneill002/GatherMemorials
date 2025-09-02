import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@supabase/supabase-js';
import type { Stripe } from 'stripe';

// Create Supabase admin client for webhook
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract metadata
        const memorialId = session.metadata?.memorial_id;
        const userId = session.metadata?.user_id;

        if (!memorialId || !userId) {
          console.error('Missing metadata in checkout session:', session.id);
          break;
        }

        // Update memorial status to published
        const { error: updateError } = await supabaseAdmin
          .from('memorials')
          .update({
            payment_status: 'paid',
            status: 'published',
            published_at: new Date().toISOString(),
            stripe_payment_id: session.payment_intent as string,
            updated_at: new Date().toISOString(),
          })
          .eq('id', memorialId)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Failed to update memorial:', updateError);
          throw updateError;
        }

        // Create payment record
        const { error: paymentError } = await supabaseAdmin
          .from('payments')
          .insert({
            memorial_id: memorialId,
            user_id: userId,
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent as string,
            amount: session.amount_total! / 100, // Convert from cents
            currency: session.currency!,
            status: 'completed',
            customer_email: session.customer_email!,
            created_at: new Date().toISOString(),
          });

        if (paymentError) {
          console.error('Failed to create payment record:', paymentError);
        }

        // Send confirmation email (implement with your email service)
        // await sendPaymentConfirmationEmail(session.customer_email!, memorialId);

        console.log(`✅ Payment successful for memorial ${memorialId}`);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const memorialId = session.metadata?.memorial_id;

        if (memorialId) {
          // Reset payment status
          await supabaseAdmin
            .from('memorials')
            .update({
              payment_status: 'unpaid',
              stripe_session_id: null,
            })
            .eq('id', memorialId);

          console.log(`Session expired for memorial ${memorialId}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const memorialId = paymentIntent.metadata?.memorial_id;

        if (memorialId) {
          // Update payment status
          await supabaseAdmin
            .from('memorials')
            .update({
              payment_status: 'failed',
            })
            .eq('id', memorialId);

          console.log(`Payment failed for memorial ${memorialId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}