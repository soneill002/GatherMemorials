// app/account/memorials/page.tsx
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
  privacy_setting: 'public' | 'private' | 'password';
  guestbook_enabled: boolean;
}

export default function MyMemorialsPage() {
  const router = useRouter();
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    const loadMemorials = async () => {
      try {
        const supabase = createBrowserClient();
        
        // Get user session
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          router.push('/auth/signin?redirect=/account/memorials');
          return;
        }
        
        setUser(currentUser);
        
        // Load memorials
        const { data: memorialsData, error: memorialsError } = await supabase
          .from('memorials')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
        
        if (memorialsError) {
          console.error('Error loading memorials:', memorialsError);
          setError('Failed to load memorials');
        } else {
          setMemorials(memorialsData || []);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError('An unexpected error occurred');
        setIsLoading(false);
      }
    };
    
    loadMemorials();
  }, [router]);

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
      }
    } catch (error) {
      console.error('Error:', error);
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
      });
    } catch {
      return '';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const filteredMemorials = memorials.filter(memorial => {
    if (filter === 'all') return true;
    return memorial.status === filter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
                <p className="text-2xl font-semibold text-gray-900">{memorials.length}</p>
              </div>
              <div className="text-blue-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-semibold text-green-600">
                  {memorials.filter(m => m.status === 'published').length}
                </p>
              </div>
              <div className="text-green-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-semibold text-yellow-600">
                  {memorials.filter(m => m.status === 'draft').length}
                </p>
              </div>
              <div className="text-yellow-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-semibold text-purple-600">
                  {memorials.reduce((sum, m) => sum + (m.view_count || 0), 0)}
                </p>
              </div>
              <div className="text-purple-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className={`px-6 py-3 text-sm font-medium ${
                  filter === 'all'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All ({memorials.length})
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`px-6 py-3 text-sm font-medium ${
                  filter === 'published'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Published ({memorials.filter(m => m.status === 'published').length})
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-6 py-3 text-sm font-medium ${
                  filter === 'draft'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Drafts ({memorials.filter(m => m.status === 'draft').length})
              </button>
            </nav>
          </div>
        </div>

        {/* Memorials List */}
        {filteredMemorials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemorials.map((memorial) => (
              <div key={memorial.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                {/* Memorial Card Header */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {memorial.first_name} {memorial.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      memorial.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {memorial.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  
                  {memorial.headline && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {memorial.headline}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {memorial.view_count || 0} views
                    </span>
                    <span>Updated {getTimeAgo(memorial.updated_at)}</span>
                  </div>
                  
                  {/* Privacy Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    {memorial.privacy_setting === 'private' && (
                      <span className="inline-flex items-center text-xs text-gray-600">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Private
                      </span>
                    )}
                    {memorial.privacy_setting === 'password' && (
                      <span className="inline-flex items-center text-xs text-gray-600">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                        </svg>
                        Password Protected
                      </span>
                    )}
                    {memorial.guestbook_enabled && (
                      <span className="inline-flex items-center text-xs text-gray-600">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                        </svg>
                        Guestbook
                      </span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    {memorial.status === 'published' && (
                      <Link
                        href={`/memorials/${memorial.id}`}
                        className="flex-1 text-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
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