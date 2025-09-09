'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { MemorialWizard } from '@/features/memorials/components/MemorialWizard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

function NewMemorialContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
const supabase = createBrowserClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [memorialData, setMemorialData] = useState(null);
  
  const memorialId = searchParams.get('id');

  useEffect(() => {
    checkAuthAndLoadMemorial();
  }, [memorialId]);

  const checkAuthAndLoadMemorial = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Just set the auth state, don't redirect
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // If there's an ID in search params, load the memorial
      if (memorialId) {
        const { data: memorial, error } = await supabase
          .from('memorials')
          .select('*')
          .eq('id', memorialId)
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error loading memorial:', error);
          // If memorial doesn't exist or user doesn't own it, redirect to new memorial
          router.push('/memorials/new');
          return;
        }

        setMemorialData(memorial);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show the custom authentication UI
  if (!isAuthenticated) {
    const redirectPath = memorialId 
      ? `/memorials/new?id=${memorialId}`
      : '/memorials/new';

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to sign in to create a memorial. It's quick and easy to get started.
          </p>
          <div className="space-y-3">
            <Link href={`/auth/signin?redirect=${encodeURIComponent(redirectPath)}`}>
              <Button variant="primary" className="w-full">
                Sign In to Continue
              </Button>
            </Link>
            <Link href={`/auth/signup?redirect=${encodeURIComponent(redirectPath)}`}>
              <Button variant="secondary" className="w-full">
                Create New Account
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Creating an account allows you to save your progress, manage your memorials, and receive important updates.
          </p>
        </div>
      </div>
    );
  }

  // Render the wizard
  return (
    <MemorialWizard 
      memorialId={memorialId || undefined}
      initialData={memorialData || undefined}
    />
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Main export with Suspense wrapper
export default function NewMemorialPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewMemorialContent />
    </Suspense>
  );
}