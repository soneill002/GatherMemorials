// lib/stripe/server.ts
// This file should ONLY be imported in API routes, never in client components

import Stripe from 'stripe';

// Only initialize Stripe on the server side
let stripe: Stripe | null = null;

// Lazy initialization to avoid errors during build
export const getStripe = () => {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    
    if (!key || key === 'sk_test_your_stripe_secret_key') {
      console.warn('Stripe Secret Key not configured properly. Payment processing disabled.');
      return null;
    }
    
    stripe = new Stripe(key, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
  }
  
  return stripe;
};

// Product and Price IDs (from Stripe Dashboard)
export const MEMORIAL_PRODUCT = {
  productId: process.env.STRIPE_MEMORIAL_PRODUCT_ID || 'prod_memorial',
  priceId: process.env.STRIPE_MEMORIAL_PRICE_ID || 'price_memorial_149',
  amount: 14900, // $149.00 in cents
  currency: 'usd',
  name: 'Digital Memorial',
  description: 'Create a beautiful, lasting tribute for your loved one',
};

// Helper to check if Stripe is properly configured
export const isStripeConfigured = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  return key && key !== 'sk_test_your_stripe_secret_key';
};