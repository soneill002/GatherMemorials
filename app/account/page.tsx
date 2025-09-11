'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Memorial {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  headline: string | null;
  status: 'draft' | 'published';
  featured_image_url: string | null;
  cover_photo_url: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function AccountDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeDashboard = async () => {
      try {
        console.log('Account: Starting initialization...');
        
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted && isLoading) {
            console.log('Account: Timeout reached, forcing completion');
            setError('Loading timeout. Please refresh the page.');
            setIsLoading(false);
            setAuthCheckComplete(true);
          }
        }, 10000); // 10 second timeout

        const supabase = createBrowserClient();
        
        // First, try to get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error('Account: Session error:', sessionError);
          setError('Authentication error. Please sign in again.');
          setIsLoading(false);
          setAuthCheckComplete(true);
          
          // Redirect to sign in after a short delay
          setTimeout(() => {
            router.push('/auth/signin?redirect=/account');
          }, 2000);
          return;
        }
        
        if (!session || !session.user) {
          console.log('Account: No session found');
          setIsLoading(false);
          setAuthCheckComplete(true);
          router.push('/auth/signin?redirect=/account');
          return;
        }
        
        console.log('Account: User authenticated:', session.user.email);
        setUser(session.user);
        setAuthCheckComplete(true);
        
        // Load memorials - don't block on this
        try {
          const { data: memorialsData, error: memorialsError } = await supabase
            .from('memorials')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
          
          if (!mounted) return;
          
          if (memorialsError) {
            console.error('Account: Error loading memorials:', memorialsError);
            // Don't set a fatal error, just show empty memorials
            setMemorials([]);
          } else {
            setMemorials(memorialsData || []);
          }
        } catch (memorialError) {
          console.error('Account: Failed to load memorials:', memorialError);
          setMemorials([]);
        }
        
        if (mounted) {
          setIsLoading(false);
        }
        
      } catch (unexpectedError) {
        console.error('Account: Unexpected error:', unexpectedError);
        if (mounted) {
          setError('An unexpected error occurred. Please refresh the page.');
          setIsLoading(false);
          setAuthCheckComplete(true);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    initializeDashboard();

    // Listen for auth state changes
    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Account: Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        router.push('/');
      } else if (event === 'SIGNED_IN' && session) {
        if (mounted && !user) {
          setUser(session.user);
          setAuthCheckComplete(true);
        }
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [router, user]);

  const handleDeleteMemorial = async (memorialId: string) => {
    if (!confirm('Are you sure you want to delete this memorial? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('memorials')
        .delete()
        .eq('id', memorialId);

      if (error) {
        console.error('Error deleting memorial:', error);
        alert('Failed to delete memorial. Please try again.');
      } else {
        setMemorials(prev => prev.filter(m => m.id !== memorialId));
        alert('Memorial deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting memorial:', error);
      alert('An error occurred while deleting the memorial.');
    }
  };

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '';
    }
  };

  // Show loading state
  if (isLoading && !authCheckComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marian-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-marian-500 hover:text-marian-600 underline"
          >
            Taking too long? Click here to refresh
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-4 py-2 bg-marian-500 text-white rounded-lg hover:bg-marian-600 transition-colors"
            >
              Refresh Page
            </button>
            <Link 
              href="/auth/signin"
              className="block w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-center transition-colors"
            >
              Sign In Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900">My Dashboard</h1>
              <p className="mt-1 text-gray-600">
                {user?.email ? `Welcome back, ${user.email}` : 'Welcome to your dashboard'}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/memorials/new"
                className="inline-flex items-center px-4 py-2 bg-marian-500 text-white rounded-full hover:bg-marian-600 transition-all hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Memorial
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-marian-50 rounded-lg p-3">
                <svg className="w-6 h-6 text-marian-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Total Memorials</p>
                <p className="text-2xl font-bold text-gray-900">{memorials.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-50 rounded-lg p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {memorials.filter(m => m.status === 'published').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-50 rounded-lg p-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {memorials.filter(m => m.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Memorials List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-serif font-semibold text-gray-900">Your Memorials</h2>
          </div>
          
          {memorials.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">You haven't created any memorials yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first memorial.</p>
              <div className="mt-6">
                <Link
                  href="/memorials/new"
                  className="inline-flex items-center px-4 py-2 bg-marian-500 text-white rounded-full hover:bg-marian-600 transition-all hover:shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Memorial
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {memorials.map((memorial) => (
                <div key={memorial.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {memorial.first_name} {memorial.last_name}
                        </h3>
                        {memorial.status === 'published' ? (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Published
                          </span>
                        ) : (
                          <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Draft
                          </span>
                        )}
                      </div>
                      {memorial.headline && (
                        <p className="mt-1 text-sm text-gray-600">{memorial.headline}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-500">
                        {memorial.date_of_birth && memorial.date_of_death && (
                          <span>
                            {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {memorial.status === 'published' && (
                        <Link
                          href={`/memorials/${memorial.id}`}
                          className="px-3 py-1 text-sm text-marian-500 hover:text-marian-600"
                        >
                          View
                        </Link>
                      )}
                      <Link
                        href={`/memorials/new?id=${memorial.id}`}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteMemorial(memorial.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}