// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') || '/account';
  
  // Handle error cases
  if (error) {
    console.error('Auth callback error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=verification_failed&message=${encodeURIComponent(error_description || 'Verification failed')}`, requestUrl.origin)
    );
  }
  
  if (code) {
    try {
      const supabase = createServerClient();
      
      // Exchange the code for a session
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error('Session exchange error:', sessionError);
        return NextResponse.redirect(
          new URL('/auth/signin?error=verification_failed', requestUrl.origin)
        );
      }
      
      // Get the user to verify they're authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User verification error:', userError);
        return NextResponse.redirect(
          new URL('/auth/signin?error=verification_failed', requestUrl.origin)
        );
      }
      
      // Check if profile exists, create if not
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const metadata = user.user_metadata || {};
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            first_name: metadata.first_name || '',
            last_name: metadata.last_name || '',
            full_name: metadata.full_name || `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim(),
          });
      }
      
      // Successfully verified - redirect to sign in with success message
      return NextResponse.redirect(
        new URL('/auth/signin?verified=true', requestUrl.origin)
      );
      
    } catch (error) {
      console.error('Unexpected error during verification:', error);
      return NextResponse.redirect(
        new URL('/auth/signin?error=verification_failed', requestUrl.origin)
      );
    }
  }
  
  // No code present, redirect to sign in
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin));
}