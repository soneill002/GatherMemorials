'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeDashboard = async () => {
      try {
        console.log('Dashboard: Starting direct API auth check...');
        
        // Get the auth token from localStorage
        const authTokenData = localStorage.getItem('sb-gathermemorials-auth-token');
        
        if (!authTokenData) {
          console.log('Dashboard: No auth token in localStorage');
          router.push('/auth/signin?redirect=/account');
          return;
        }
        
        let accessToken: string;
        let refreshToken: string;
        try {
          const parsed = JSON.parse(authTokenData);
          accessToken = parsed.access_token;
          refreshToken = parsed.refresh_token;
          
          if (!accessToken) {
            console.log('Dashboard: No access token in auth data');
            router.push('/auth/signin?redirect=/account');
            return;
          }
        } catch (err) {
          console.error('Dashboard: Failed to parse auth token:', err);
          localStorage.removeItem('sb-gathermemorials-auth-token');
          router.push('/auth/signin?redirect=/account');
          return;
        }
        
        // Make a direct API call to verify the token with timeout
        console.log('Dashboard: Verifying token with direct API call...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${accessToken}`
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.log('Dashboard: Token verification failed, status:', response.status);
            
            // Try to refresh the token if it's expired
            if (response.status === 401 && refreshToken) {
              console.log('Dashboard: Attempting to refresh token...');
              
              const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: refreshToken })
              });
              
              if (refreshResponse.ok) {
                const newTokenData = await refreshResponse.json();
                localStorage.setItem('sb-gathermemorials-auth-token', JSON.stringify(newTokenData));
                
                // Retry with new token
                accessToken = newTokenData.access_token;
                console.log('Dashboard: Token refreshed, retrying...');
              } else {
                console.log('Dashboard: Token refresh failed');
                localStorage.removeItem('sb-gathermemorials-auth-token');
                router.push('/auth/signin?redirect=/account');
                return;
              }
            } else {
              localStorage.removeItem('sb-gathermemorials-auth-token');
              router.push('/auth/signin?redirect=/account');
              return;
            }
          }
          
          const userData = await response.json();
          console.log('Dashboard: User verified:', userData.email);
          
          if (!mounted) return;
          
          setUserId(userData.id);
          
          // Now load memorials using the verified user ID
          console.log('Dashboard: Loading memorials...');
          
          const memorialsController = new AbortController();
          const memorialsTimeoutId = setTimeout(() => memorialsController.abort(), 5000);
          
          const memorialsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/memorials?user_id=eq.${userData.id}&order=created_at.desc`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${accessToken}`,
                'Prefer': 'return=representation'
              },
              signal: memorialsController.signal
            }
          );
          
          clearTimeout(memorialsTimeoutId);
          
          if (memorialsResponse.ok) {
            const memorialsData = await memorialsResponse.json();
            console.log('Dashboard: Loaded', memorialsData.length, 'memorials');
            setMemorials(memorialsData);
          } else {
            console.error('Dashboard: Failed to load memorials, status:', memorialsResponse.status);
            setMemorials([]);
          }
          
          if (!mounted) return;
          
          setIsLoading(false);
          console.log('Dashboard: Initialization complete');
          
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.error('Dashboard: Request timed out');
            setError('Request timed out. Please check your connection and try again.');
          } else {
            console.error('Dashboard: Request failed:', err);
            setError('Failed to connect to the server. Please try again.');
          }
          if (mounted) {
            setIsLoading(false);
          }
        }
        
      } catch (error) {
        console.error('Dashboard: Critical error:', error);
        if (mounted) {
          setError('Failed to load dashboard. Please try refreshing the page.');
          setIsLoading(false);
        }
      }
    };

    initializeDashboard();
    
    // Failsafe timeout
    const timeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.log('Dashboard: Failsafe timeout reached after 15 seconds');
        setError('Loading took too long. Please refresh the page.');
        setIsLoading(false);
      }
    }, 15000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [router]);

  const handleSignOut = async () => {
    try {
      // Clear the auth token
      localStorage.removeItem('sb-gathermemorials-auth-token');
      
      // Also try to call the signout endpoint
      const authTokenData = localStorage.getItem('sb-gathermemorials-auth-token');
      if (authTokenData) {
        try {
          const parsed = JSON.parse(authTokenData);
          const accessToken = parsed.access_token;
          
          // Best effort signout
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/logout`, {
            method: 'POST',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${accessToken}`
            }
          }).catch(() => {
            // Ignore errors - we're signing out anyway
          });
        } catch {
          // Ignore parse errors
        }
      }
      
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
      const authTokenData = localStorage.getItem('sb-gathermemorials-auth-token');
      if (!authTokenData) return;
      
      const parsed = JSON.parse(authTokenData);
      const accessToken = parsed.access_token;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/memorials?id=eq.${memorialId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (response.ok) {
        setMemorials(prev => prev.filter(m => m.id !== memorialId));
        alert('Memorial deleted successfully');
      } else {
        alert('Failed to delete memorial. Please try again.');
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
          <p className="mt-2 text-sm text-gray-500">Connecting to server...</p>
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
              <p className="mt-1 text-gray-600">Manage your memorial pages</p>
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