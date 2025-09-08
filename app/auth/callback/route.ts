// app/auth/callback/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  
  console.log('Auth callback received:', { code: !!code, error, error_description });
  
  // Handle error cases
  if (error) {
    console.error('Auth callback error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=verification_failed&message=${encodeURIComponent(error_description || 'Verification failed')}`, requestUrl.origin)
    );
  }
  
  if (code) {
    try {
      // Create a Supabase client with the code for verification
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Exchange the code for a session
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error('Session exchange error:', sessionError);
        return NextResponse.redirect(
          new URL('/auth/signin?error=verification_failed', requestUrl.origin)
        );
      }
      
      if (!sessionData.session) {
        console.error('No session returned after code exchange');
        return NextResponse.redirect(
          new URL('/auth/signin?error=verification_failed', requestUrl.origin)
        );
      }
      
      // Create response with redirect
      const response = NextResponse.redirect(
        new URL('/auth/signin?verified=true', requestUrl.origin)
      );
      
      // Manually set the auth cookies
      const cookieStore = cookies();
      
      // Set the access token cookie
      response.cookies.set('sb-gathermemorials-auth-token', JSON.stringify({
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at,
        expires_in: sessionData.session.expires_in,
        token_type: sessionData.session.token_type,
        user: sessionData.session.user
      }), {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false // Must be false for client-side access
      });
      
      // Also set individual cookies for better compatibility
      response.cookies.set('sb-access-token', sessionData.session.access_token, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: false
      });
      
      response.cookies.set('sb-refresh-token', sessionData.session.refresh_token, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: false
      });
      
      console.log('Session established successfully for user:', sessionData.session.user.email);
      
      // Check if profile exists, create if not
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const metadata = sessionData.session.user.user_metadata || {};
        await supabase
          .from('profiles')
          .insert({
            id: sessionData.session.user.id,
            email: sessionData.session.user.email,
            first_name: metadata.first_name || '',
            last_name: metadata.last_name || '',
            full_name: metadata.full_name || `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim(),
          });
        console.log('Profile created for user:', sessionData.session.user.email);
      }
      
      return response;
      
    } catch (error) {
      console.error('Unexpected error during verification:', error);
      return NextResponse.redirect(
        new URL('/auth/signin?error=verification_failed', requestUrl.origin)
      );
    }
  }
  
  // No code present, redirect to sign in
  console.log('No code present in callback, redirecting to signin');
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin));
}