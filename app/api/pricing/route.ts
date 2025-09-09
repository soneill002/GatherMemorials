// app/api/pricing/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // This is a temporary fix for the pricing route
  // You can expand this later with actual pricing data
  const pricingData = {
    plans: [
      {
        id: 'basic',
        name: 'Basic Memorial',
        price: 49.99,
        features: [
          'Lifetime memorial page',
          'Photo gallery (up to 50 photos)',
          'Guestbook',
          'Service information',
          'Privacy controls'
        ]
      }
    ]
  };

  return NextResponse.json(pricingData);
}