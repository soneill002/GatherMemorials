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
  const hasInitialized = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) {
      return;
    }
    
    const initializeDashboard = async () => {
      try {
        console.log('Dashboard: Initializing...');
        hasInitialized.current = true;
        
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
          setTimeout(() => {
            router.push('/auth/signin?redirect=/account');
          }, 2000);
        }, 5000); // 5 second timeout
        
        // Try multiple approaches to get the user
        console.log('Dashboard: Attempting to get user...');
        
        // First try: getUser with a Promise.race for timeout
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getUser timeout')), 4000)
        );
        
        try {
          const result = await Promise.race([getUserPromise, timeoutPromise]);
          const { data: { user: currentUser }, error: userError } = result as any;
          
          // Clear the timeout since we got a response
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
          
          if (userError) {
            console.error('Dashboard: User error:', userError);
            
            // Try refreshing the session
            console.log('Dashboard: Attempting session refresh...');
            const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
            
            if (session && session.user) {
              console.log('Dashboard: Session refreshed successfully');
              setUser(session.user);
              await loadMemorialsForUser(session.user.id);
              return;
            }
            
            // If refresh failed, clear auth and redirect
            await supabase.auth.signOut();
            router.push('/auth/signin?redirect=/account');
            return;
          }
          
          if (!currentUser) {
            console.log('Dashboard: No user found, redirecting to sign in');
            router.push('/auth/signin?redirect=/account');
            return;
          }
          
          console.log('Dashboard: User found:', currentUser.email);
          setUser(currentUser);
          await loadMemorialsForUser(currentUser.id);
          
        } catch (timeoutError) {
          console.log('Dashboard: getUser timed out, trying getSession...');
          
          // Fallback: Try getSession instead
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          // Clear the timeout
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
          
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
        setError('Failed to load memorials.');
        setIsLoading(false);
      }
    };

    // Initialize dashboard
    initializeDashboard();
    
    // Set up auth state listener (separate from initialization)
    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Dashboard: Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        router.push('/auth/signin');
      }
    });

    // Cleanup function
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const supabase = createBrowserClient();
      
      // Sign out using Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Clear localStorage
      localStorage.removeItem('sb-gathermemorials-auth-token');
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      router.push('/');
    }
  };

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
                {user?.email ? `Signed in as ${user.email}` : 'Manage your memorial pages'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/memorials/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Memorial
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Memorials</p>
            <p className="text-2xl font-semibold">{memorials.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Published</p>
            <p className="text-2xl font-semibold">
              {memorials.filter(m => m.status === 'published').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Drafts</p>
            <p className="text-2xl font-semibold">
              {memorials.filter(m => m.status === 'draft').length}
            </p>
          </div>
        </div>

        {/* Memorials List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Your Memorials</h2>
          </div>
          
          <div className="p-6">
            {memorials.length > 0 ? (
              <div className="space-y-4">
                {memorials.map((memorial) => (
                  <div key={memorial.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {memorial.first_name} {memorial.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            memorial.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {memorial.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                          {memorial.view_count > 0 && (
                            <span className="text-xs text-gray-500">
                              {memorial.view_count} views
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {memorial.status === 'published' && (
                          <Link
                            href={`/memorials/${memorial.id}`}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            View
                          </Link>
                        )}
                        <Link
                          href={`/memorials/new?id=${memorial.id}`}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/memorials/${memorial.id}`;
                            navigator.clipboard.writeText(url);
                            alert('Memorial link copied to clipboard!');
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 transition-colors"
                        >
                          Share
                        </button>
                        <button
                          onClick={() => handleDeleteMemorial(memorial.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-500 mb-4">You haven't created any memorials yet</p>
                <Link 
                  href="/memorials/new"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create Your First Memorial
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}