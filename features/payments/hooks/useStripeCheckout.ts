import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLIC_KEY } from '@/lib/stripe/client';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

interface CheckoutOptions {
  memorialId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCheckout = async ({ 
    memorialId, 
    onSuccess, 
    onError 
  }: CheckoutOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memorialId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { checkoutUrl, sessionId } = await response.json();

      // Redirect to Stripe Checkout
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        // Fallback to Stripe.js redirect
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Stripe failed to load');
        }

        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          throw error;
        }
      }

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Checkout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/stripe/checkout?session_id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Payment verification error:', err);
      return null;
    }
  };

  return {
    initiateCheckout,
    verifyPayment,
    isLoading,
    error,
  };
}