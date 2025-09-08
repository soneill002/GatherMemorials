'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserClient();
      
      // Get the code from the URL
      const code = new URLSearchParams(window.location.search).get('code');
      const error = new URLSearchParams(window.location.search).get('error');
      const error_description = new URLSearchParams(window.location.search).get('error_description');
      
      if (error) {
        console.error('Auth error:', error, error_description);
        router.push('/auth/signin?error=verification_failed');
        return;
      }
      
      if (code) {
        // Exchange the code for a session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (!exchangeError) {
          // Successfully verified - redirect to dashboard
          router.push('/account');
        } else {
          console.error('Error during email verification:', exchangeError);
          router.push('/auth/signin?error=verification_failed');
        }
      } else {
        // No code present, redirect to sign in
        router.push('/auth/signin');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marian-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Verifying your email...</p>
      </div>
    </div>
  );
}