// app/account/memorials/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  privacy_setting: 'public' | 'private' | 'password';
  guestbook_enabled: boolean;
}

export default function MyMemorialsPage() {
  const { user, loading: authLoading, error: authError } = useAuth({
    redirectTo: '/auth/signin',
    requireAuth: true
  });
  
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [memorialsLoading, setMemorialsLoading] = useState(true);
  const [memorialsError, setMemorialsError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    if (user) {
      loadMemorials();
    }
  }, [user]);

  const loadMemorials = async () => {
    if (!user) return;
    
    try {
      setMemorialsLoading(true);
      setMemorialsError(null);
      
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('memorials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading memorials:', error);
        setMemorialsError('Failed to load memorials');
      } else {
        setMemorials(data || []);
      }
    } catch (error) {
      console.error('Unexpected error loading memorials:', error);
      setMemorialsError('An unexpected error occurred');
    } finally {
      setMemorialsLoading(false);
    }
  };

  const handleDeleteMemorial = async (memorialId: string, memorialName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the memorial for ${memorialName}? This action cannot be undone.`)) {
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

  const filteredMemorials = filter === 'all' 
    ? memorials
    : memorials.filter(m => m.status === filter);

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
  if (authLoading || (user && memorialsLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Checking authentication...' : 'Loading your memorials...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (authError || memorialsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Memorials</h2>
          <p className="text-gray-600 mb-4">{authError || memorialsError}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
            <Link 
              href="/account"
              className="block w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-center transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/account" className="text-gray-500 hover:text-gray-700">
                  Dashboard
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">My Memorials</li>
            </ol>
          </nav>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Memorials</h1>
              <p className="mt-2 text-gray-600">
                Manage and view all your memorial pages
              </p>
            </div>
            <Link
              href="/memorials/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Memorial
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{memorials.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {memorials.filter(m => m.status === 'published').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {memorials.filter(m => m.status === 'draft').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {memorials.reduce((sum, m) => sum + (m.view_count || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setFilter('all')}
                className={`py-2 px-6 text-sm font-medium border-b-2 transition-colors ${
                  filter === 'all'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All ({memorials.length})
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`py-2 px-6 text-sm font-medium border-b-2 transition-colors ${
                  filter === 'published'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Published ({memorials.filter(m => m.status === 'published').length})
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`py-2 px-6 text-sm font-medium border-b-2 transition-colors ${
                  filter === 'draft'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Drafts ({memorials.filter(m => m.status === 'draft').length})
              </button>
            </nav>
          </div>
        </div>

        {/* Memorials Grid */}
        {filteredMemorials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemorials.map((memorial) => (
              <div key={memorial.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                {memorial.cover_photo_url && (
                  <div className="h-32 bg-gray-200 rounded-t-lg overflow-hidden">
                    <img 
                      src={memorial.cover_photo_url} 
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {memorial.first_name} {memorial.last_name}
                      </h3>
                      {memorial.headline && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {memorial.headline}
                        </p>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        {memorial.date_of_birth && memorial.date_of_death && (
                          <span>
                            {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
                          </span>
                        )}
                      </div>
                    </div>
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
                  
                  <div className="mt-4 flex items-center gap-2">
                    {memorial.status === 'published' && (
                      <Link
                        href={`/memorials/${memorial.id}`}
                        className="flex-1 text-center px-3 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                      >
                        View
                      </Link>
                    )}
                    <Link
                      href={`/memorials/new?id=${memorial.id}`}
                      className="flex-1 text-center px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteMemorial(memorial.id, `${memorial.first_name} ${memorial.last_name}`)}
                      className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' 
                  ? "No memorials yet" 
                  : `No ${filter} memorials`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all'
                  ? "Create your first memorial to honor your loved one."
                  : `You don't have any ${filter} memorials.`}
              </p>
              <Link
                href="/memorials/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Memorial
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}