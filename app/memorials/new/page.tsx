'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MemorialWizard } from '@/features/memorials/components/MemorialWizard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, Shield, Heart, Clock } from 'lucide-react';

// Move the main component logic to a separate component that uses useSearchParams
function NewMemorialForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [memorialData, setMemorialData] = useState(null);
  const [userEmail, setUserEmail] = useState<string>('');
  
  const memorialId = searchParams.get('id');

  useEffect(() => {
    checkAuthAndLoadMemorial();
  }, [memorialId]);

  const checkAuthAndLoadMemorial = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Store the intended destination for after login
        const redirectPath = memorialId 
          ? `/memorials/new?id=${memorialId}`
          : '/memorials/new';
        
        // Small delay to show loading state briefly
        setTimeout(() => {
          router.push(`/auth/signin?redirect=${encodeURIComponent(redirectPath)}`);
        }, 500);
        return;
      }

      setIsAuthenticated(true);
      setUserEmail(session.user.email || '');

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
          // If memorial doesn't exist or user doesn't own it, create a new one
          router.push('/memorials/new');
          return;
        }

        // Transform database format to component format if needed
        const transformedData = {
          ...memorial,
          // Map database fields to component fields
          firstName: memorial.first_name,
          middleName: memorial.middle_name,
          lastName: memorial.last_name,
          birthDate: memorial.date_of_birth,
          deathDate: memorial.date_of_death,
          birthPlace: memorial.birth_place,
          deathPlace: memorial.death_place,
          featuredImage: memorial.featured_photo_url,
          coverPhoto: memorial.cover_photo_url,
          guestbookEnabled: memorial.guestbook_enabled,
          guestbookModeration: memorial.guestbook_moderation,
        };

        setMemorialData(transformedData);
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
      <div className="min-h-screen bg-gradient-to-b from-vatican-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marian-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing memorial wizard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show friendly message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vatican-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 bg-marian-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-marian-500" />
            </div>
          </div>
          <h2 className="text-2xl font-serif text-gray-900 mb-3">
            Sign In to Create a Memorial
          </h2>
          <p className="text-gray-600 mb-6">
            You need to sign in to create and manage memorial pages. It only takes a moment to get started.
          </p>
          
          <div className="space-y-3">
            <Link href="/auth/signin?redirect=/memorials/new" className="block">
              <Button variant="primary" size="large" className="w-full">
                Sign In to Continue
              </Button>
            </Link>
            <Link href="/auth/signup?redirect=/memorials/new" className="block">
              <Button variant="secondary" size="large" className="w-full">
                Create New Account
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600 space-y-3">
              <div className="flex items-start">
                <Heart className="h-4 w-4 text-marian-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Create unlimited memorial pages</span>
              </div>
              <div className="flex items-start">
                <Clock className="h-4 w-4 text-marian-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Save your progress automatically</span>
              </div>
              <div className="flex items-start">
                <Shield className="h-4 w-4 text-marian-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Secure and private memorials</span>
              </div>
            </div>
          </div>
          
          <p className="mt-6 text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-marian-500 hover:text-marian-600">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-marian-500 hover:text-marian-600">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Render the wizard with header
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header for navigation context */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link 
              href="/account"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            <div className="text-sm text-gray-500">
              {userEmail && (
                <span>Creating as {userEmail}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Memorial Wizard Component */}
      <MemorialWizard 
        memorialId={memorialId || undefined}
        initialData={memorialData || undefined}
      />
    </div>
  );
}

// Main export wraps the component in Suspense for Next.js 14 compatibility
export default function NewMemorialPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-vatican-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marian-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading memorial creation...</p>
          </div>
        </div>
      }
    >
      <NewMemorialForm />
    </Suspense>
  );
}