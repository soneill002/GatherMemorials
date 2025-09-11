'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log('Dashboard: Initializing...');
        setIsLoading(true);
        setError(null);
        
        // Create Supabase client
        const supabase = createBrowserClient();
        
        // Set a timeout for the entire initialization process
        initTimeoutRef.current = setTimeout(() => {
          console.log('Dashboard: Init timeout reached, checking localStorage fallback...');
          
          // Try to get user info from localStorage as a fallback
          const authToken = localStorage.getItem('sb-gathermemorials-auth-token');
          if (authToken) {
            try {
              const parsed = JSON.parse(authToken);
              if (parsed && parsed.user) {
                console.log('Dashboard: Found user in localStorage, using that');
                setUser(parsed.user);
                loadMemorialsForUser(parsed.user.id);
                return;
              }
            } catch (e) {
              console.error('Dashboard: Failed to parse localStorage auth:', e);
            }
          }
          
          console.log('Dashboard: No valid auth found, redirecting to signin');
          setError('Session expired. Please sign in again.');
          router.push('/auth/signin?redirect=/account');
        }, 5000); // 5 second timeout
        
        // Try to get user
        console.log('Dashboard: Getting user...');
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        // Clear the timeout since we got a response
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
        
        if (currentUser) {
          console.log('Dashboard: Got user:', currentUser.email);
          setUser(currentUser);
          await loadMemorialsForUser(currentUser.id);
        } else {
          console.log('Dashboard: User auth failed, error:', userError);
          console.log('Dashboard: No user, trying getSession...');
          
          // Fallback: Try getSession instead
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (session && session.user) {
            console.log('Dashboard: Got user from session:', session.user.email);
            setUser(session.user);
            await loadMemorialsForUser(session.user.id);
          } else {
            console.log('Dashboard: No session found, redirecting to signin');
            router.push('/auth/signin?redirect=/account');
          }
        }
        
      } catch (error) {
        console.error('Dashboard: Unexpected error:', error);
        
        // Clear the timeout
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
        
        setError('Failed to load dashboard. Please try refreshing the page.');
        setIsLoading(false);
      }
    };
    
    const loadMemorialsForUser = async (userId: string) => {
      try {
        const supabase = createBrowserClient();
        console.log('Dashboard: Loading memorials for user:', userId);
        
        const { data: memorialsData, error: memorialsError } = await supabase
          .from('memorials')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (memorialsError) {
          console.error('Dashboard: Error loading memorials:', memorialsError);
          setError('Failed to load memorials. Please refresh the page.');
        } else {
          console.log('Dashboard: Loaded', memorialsData?.length || 0, 'memorials');
          setMemorials(memorialsData || []);
        }
        
        setIsLoading(false);
        console.log('Dashboard: Initialization complete');
      } catch (error) {
        console.error('Dashboard: Error in loadMemorialsForUser:', error);
        setError('Failed to load memorials. Please try refreshing the page.');
        setIsLoading(false);
      }
    };

    // Initialize dashboard
    initializeDashboard();

    // Cleanup function to clear timeout on unmount
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, []); // Empty dependency array - runs once on mount

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">This may take a moment...</p>
        </div>
      </div>
    );
  }

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
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
            <Link 
              href="/auth/signin"
              className="block w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-center transition-colors"
            >
              Sign In Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Memorials</h1>
              <p className="mt-1 text-gray-600">
                {user?.email ? `Signed in as ${user.email}` : 'Welcome to your dashboard'}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/memorials/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Memorial
              </Link>
              <button
                onClick={async () => {
                  const supabase = createBrowserClient();
                  await supabase.auth.signOut();
                  router.push('/');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Total Memorials</p>
                <p className="text-2xl font-bold text-gray-900">{memorials.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
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

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
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
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Memorials</h2>
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
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
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