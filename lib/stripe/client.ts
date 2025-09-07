// lib/stripe/client.ts  
// This file is safe to import in client components

import { loadStripe } from '@stripe/stripe-js';

// Stripe public key for client-side
export const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Check if Stripe is properly configured
export const isStripeConfigured = () => {
  return STRIPE_PUBLIC_KEY && STRIPE_PUBLIC_KEY !== 'pk_test_your_stripe_publishable_key';
};

// Lazy load Stripe.js
let stripePromise: ReturnType<typeof loadStripe> | null = null;

export const getStripe = () => {
  if (!isStripeConfigured()) {
    console.warn('Stripe public key not configured. Payment processing disabled.');
    return null;
  }
  
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  
  return stripePromise;
};

// Product info (safe for client-side)
export const MEMORIAL_PRODUCT = {
  priceId: process.env.NEXT_PUBLIC_STRIPE_MEMORIAL_PRICE_ID || 'price_memorial_149',
  amount: 14900, // $149.00 in cents
  currency: 'usd',
  name: 'Digital Memorial',
  description: 'Create a beautiful, lasting tribute for your loved one',
};

// Helper function to create checkout session
export const createCheckoutSession = async (memorialId: string) => {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please contact support.');
  }
  
  try {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memorialId,
        priceId: MEMORIAL_PRODUCT.priceId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }
    
    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Helper to redirect to Stripe Checkout
export const redirectToCheckout = async (memorialId: string) => {
  const stripe = await getStripe();
  
  if (!stripe) {
    console.error('Stripe not loaded');
    return;
  }
  
  const sessionId = await createCheckoutSession(memorialId);
  
  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });
  
  if (error) {
    console.error('Stripe redirect error:', error);
    throw error;
  }
};