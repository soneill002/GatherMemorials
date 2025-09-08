// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  
  // Log all parameters to see what's being received
  console.log('=== AUTH CALLBACK RECEIVED ===');
  console.log('Full URL:', request.url);
  console.log('Search params:', requestUrl.searchParams.toString());
  
  // Get all possible parameters
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  
  console.log('Parameters:', { code, token_hash, type, error, error_description });
  
  // If there's an error from Supabase
  if (error) {
    console.error('Supabase error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=verification_failed&message=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    );
  }
  
  // For email verification (uses token_hash, not code)
  if (token_hash && type) {
    console.log('Email verification detected with token_hash');
    
    // For now, just mark as verified and redirect
    // The actual verification happens client-side after redirect
    return NextResponse.redirect(
      new URL(`/auth/verify-email?token_hash=${token_hash}&type=${type}`, requestUrl.origin)
    );
  }
  
  // For OAuth/magic link (uses code)
  if (code) {
    console.log('OAuth/Magic link detected with code');
    
    // Redirect to a client page to handle the code exchange
    return NextResponse.redirect(
      new URL(`/auth/verify-email?code=${code}`, requestUrl.origin)
    );
  }
  
  // No valid parameters found
  console.error('No valid parameters found in callback');
  return NextResponse.redirect(
    new URL('/auth/signin?error=verification_failed&message=Invalid verification link', requestUrl.origin)
  );
}