import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia', // Use latest API version
  typescript: true,
});

// Product and Price IDs (from Stripe Dashboard)
export const MEMORIAL_PRODUCT = {
  productId: process.env.STRIPE_MEMORIAL_PRODUCT_ID || 'prod_memorial',
  priceId: process.env.STRIPE_MEMORIAL_PRICE_ID || 'price_memorial_149',
  amount: 14900, // $149.00 in cents
  currency: 'usd',
  name: 'Digital Memorial',
  description: 'Create a beautiful, lasting tribute for your loved one',
};

// Stripe public key for client-side
export const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

if (!STRIPE_PUBLIC_KEY) {
  console.warn('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}