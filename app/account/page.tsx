'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';

// Simplified type definitions - adjust based on your actual schema
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

interface DashboardStats {
  totalMemorials: number;
  publishedMemorials: number;
  draftMemorials: number;
  totalViews: number;
  totalGuestbookEntries: number;
  pendingModeration: number;
  prayerListCount: number;
}

export default function AccountDashboard() {
  const router = useRouter();
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalMemorials: 0,
    publishedMemorials: 0,
    draftMemorials: 0,
    totalViews: 0,
    totalGuestbookEntries: 0,
    pendingModeration: 0,
    prayerListCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedMemorial, setSelectedMemorial] = useState<Memorial | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeDashboard = async () => {
      try {
        console.log('Dashboard: Initializing...');
        
        // Create Supabase client
        const supabase = createBrowserClient();
        
        // Try to get session first (from local storage - fast)
        console.log('Dashboard: Getting session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('Dashboard: Session found for:', session.user.email);
          setUserId(session.user.id);
          
          // Load data
          const memorialsData = await loadMemorials(session.user.id);
          if (!mounted) return;
          
          await loadStats(session.user.id, memorialsData);
          if (!mounted) return;
          
          setIsLoading(false);
          console.log('Dashboard: Initialization complete');
          return;
        }
        
        // If no session, try getUser (makes API call)
        console.log('Dashboard: No session, trying getUser...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (user) {
          console.log('Dashboard: User found via getUser:', user.email);
          setUserId(user.id);
          
          // Load data
          const memorialsData = await loadMemorials(user.id);
          if (!mounted) return;
          
          await loadStats(user.id, memorialsData);
          if (!mounted) return;
          
          setIsLoading(false);
          console.log('Dashboard: Initialization complete');
          return;
        }
        
        // No user found at all
        console.log('Dashboard: No user found, redirecting to signin');
        router.push('/auth/signin?redirect=/account');
        
      } catch (error) {
        console.error('Dashboard: Error during initialization:', error);
        if (mounted) {
          setError('Failed to load dashboard. Please refresh the page or try signing in again.');
          setIsLoading(false);
        }
      }
    };

    // Start initialization
    initializeDashboard();
    
    // Failsafe timeout
    const loadingTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.log('Dashboard: Loading timeout reached');
        setError('Loading is taking longer than expected. Please refresh the page.');
        setIsLoading(false);
      }
    }, 15000); // 15 second timeout

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
    };
  }, [router]);

  const loadMemorials = async (userId: string) => {
    try {
      console.log('Dashboard: Loading memorials for user:', userId);
      const supabase = createBrowserClient();
      
      const { data, error } = await supabase
        .from('memorials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        // Check if it's a "table doesn't exist" error
        if (error.code === '42P01') {
          console.error('Dashboard: Memorials table does not exist');
          setError('Database is not properly configured. Please contact support.');
          return [];
        }
        
        // Don't throw - user might not have memorials yet
        if (error.code !== 'PGRST116') { // Not a "no rows" error
          console.error('Dashboard: Memorial loading error:', error.message);
        }
        setMemorials([]);
        return [];
      }
      
      console.log('Dashboard: Loaded memorials:', data?.length || 0);
      setMemorials(data || []);
      return data || [];
    } catch (error) {
      console.error('Dashboard: Unexpected error loading memorials:', error);
      setMemorials([]);
      return [];
    }
  };

  const loadStats = async (userId: string, memorialsData?: Memorial[]) => {
    try {
      console.log('Dashboard: Loading stats for user:', userId);
      const supabase = createBrowserClient();
      
      // Use passed memorial data or the state
      const memorialsToUse = memorialsData || memorials;
      
      // Calculate memorial stats from the data we already have
      const memorialStats = {
        total: memorialsToUse.length,
        published: memorialsToUse.filter(m => m.status === 'published').length,
        draft: memorialsToUse.filter(m => m.status === 'draft').length,
        views: memorialsToUse.reduce((sum, m) => sum + (m.view_count || 0), 0)
      };
      
      // Load guestbook stats (only if there are memorials)
      const guestbookStats = memorialsToUse.length > 0 
        ? await loadGuestbookStats(supabase, memorialsToUse.map(m => m.id))
        : { totalEntries: 0, pendingCount: 0 };

      // Load prayer list count
      const prayerCount = await loadPrayerListCount(supabase, userId);

      setStats({
        totalMemorials: memorialStats.total,
        publishedMemorials: memorialStats.published,
        draftMemorials: memorialStats.draft,
        totalViews: memorialStats.views,
        totalGuestbookEntries: guestbookStats.totalEntries,
        pendingModeration: guestbookStats.pendingCount,
        prayerListCount: prayerCount
      });
      
      console.log('Dashboard: Stats loaded');
    } catch (error) {
      console.error('Dashboard: Error loading stats:', error);
      // Don't fail the whole page if stats fail to load
      // Use the memorial data we have for basic stats
      const memorialsToUse = memorialsData || memorials;
      setStats({
        totalMemorials: memorialsToUse.length,
        publishedMemorials: memorialsToUse.filter(m => m.status === 'published').length,
        draftMemorials: memorialsToUse.filter(m => m.status === 'draft').length,
        totalViews: memorialsToUse.reduce((sum, m) => sum + (m.view_count || 0), 0),
        totalGuestbookEntries: 0,
        pendingModeration: 0,
        prayerListCount: 0
      });
    }
  };

  const loadGuestbookStats = async (supabase: any, memorialIds: string[]) => {
    if (memorialIds.length === 0) {
      return { totalEntries: 0, pendingCount: 0 };
    }

    try {
      // Get total entries
      const { count: totalEntries, error: totalError } = await supabase
        .from('guestbook_entries')
        .select('*', { count: 'exact', head: true })
        .in('memorial_id', memorialIds);

      if (totalError) {
        console.error('Dashboard: Error loading total guestbook entries:', totalError);
        return { totalEntries: 0, pendingCount: 0 };
      }

      // Get pending entries
      const { count: pendingCount, error: pendingError } = await supabase
        .from('guestbook_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .in('memorial_id', memorialIds);

      if (pendingError) {
        console.error('Dashboard: Error loading pending guestbook entries:', pendingError);
        return { totalEntries: totalEntries || 0, pendingCount: 0 };
      }

      return {
        totalEntries: totalEntries || 0,
        pendingCount: pendingCount || 0
      };
    } catch (error) {
      console.error('Dashboard: Error loading guestbook stats:', error);
      return { totalEntries: 0, pendingCount: 0 };
    }
  };

  const loadPrayerListCount = async (supabase: any, userId: string) => {
    try {
      const { count, error } = await supabase
        .from('prayer_lists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Dashboard: Error loading prayer list count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Dashboard: Error loading prayer list count:', error);
      return 0;
    }
  };

  const handleDeleteMemorial = async () => {
    if (!selectedMemorial || !userId) return;

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('memorials')
        .delete()
        .eq('id', selectedMemorial.id)
        .eq('user_id', userId); // Extra safety check

      if (error) throw error;

      setToastMessage('Memorial deleted successfully');
      setShowToast(true);
      setMemorials(memorials.filter(m => m.id !== selectedMemorial.id));
      setShowDeleteModal(false);
      setSelectedMemorial(null);
      
      // Update stats
      const updatedMemorials = memorials.filter(m => m.id !== selectedMemorial.id);
      await loadStats(userId, updatedMemorials);
    } catch (error) {
      console.error('Dashboard: Error deleting memorial:', error);
      setToastMessage('Failed to delete memorial');
      setShowToast(true);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Dashboard: Error signing out:', error);
    }
  };

  const filteredMemorials = memorials.filter(memorial => {
    if (activeTab === 'published') return memorial.status === 'published';
    if (activeTab === 'draft') return memorial.status === 'draft';
    return true;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
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
          <p className="mt-2 text-sm text-gray-500">This may take a few moments</p>
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
            <button 
              onClick={handleRefreshAuth}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Refresh Authentication
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Memorials</h1>
              <p className="mt-1 text-gray-600">Manage and monitor your memorial pages</p>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/memorials/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Memorial
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard title="Total Memorials" value={stats.totalMemorials} />
          <StatCard title="Published" value={stats.publishedMemorials} />
          <StatCard title="Drafts" value={stats.draftMemorials} />
          <StatCard title="Total Views" value={stats.totalViews} />
          <StatCard 
            title="Pending Moderation" 
            value={stats.pendingModeration}
            highlight={stats.pendingModeration > 0}
          />
        </div>

        {/* Quick Actions */}
        {stats.pendingModeration > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-amber-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-800">
                You have {stats.pendingModeration} guestbook {stats.pendingModeration === 1 ? 'entry' : 'entries'} pending moderation.
              </p>
              <Link href="/account/guestbook/pending" className="ml-auto text-sm text-amber-600 hover:text-amber-700 font-medium">
                Review Now →
              </Link>
            </div>
          </div>
        )}

        {/* Memorials Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Tabs */}
                <div className="flex space-x-8">
                  <TabButton
                    active={activeTab === 'all'}
                    onClick={() => setActiveTab('all')}
                    label={`All (${memorials.length})`}
                  />
                  <TabButton
                    active={activeTab === 'published'}
                    onClick={() => setActiveTab('published')}
                    label={`Published (${stats.publishedMemorials})`}
                  />
                  <TabButton
                    active={activeTab === 'draft'}
                    onClick={() => setActiveTab('draft')}
                    label={`Drafts (${stats.draftMemorials})`}
                  />
                </div>
                
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                    aria-label="Grid view"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                    aria-label="List view"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredMemorials.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredMemorials.map((memorial) => (
                  <MemorialCard
                    key={memorial.id}
                    memorial={memorial}
                    viewMode={viewMode}
                    onEdit={() => router.push(`/memorials/new?id=${memorial.id}`)}
                    onView={() => router.push(`/memorials/${memorial.id}`)}
                    onDelete={() => {
                      setSelectedMemorial(memorial);
                      setShowDeleteModal(true);
                    }}
                    onShare={() => {
                      const url = `${window.location.origin}/memorials/${memorial.id}`;
                      navigator.clipboard.writeText(url);
                      setToastMessage('Memorial link copied to clipboard');
                      setShowToast(true);
                    }}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={activeTab === 'draft' ? 'No draft memorials' : 'No memorials yet'}
                description={activeTab === 'draft' ? 'Your draft memorials will appear here' : 'Create your first memorial to preserve memories forever'}
                actionLabel="Create Memorial"
                onAction={() => router.push('/memorials/new')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMemorial && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteMemorial}
          memorialName={`${selectedMemorial.first_name} ${selectedMemorial.last_name}`}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

// Component definitions
function StatCard({ title, value, highlight = false }: { title: string; value: number; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${highlight ? 'ring-2 ring-amber-500' : ''}`}>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className={`mt-2 text-3xl font-semibold ${highlight ? 'text-amber-600' : 'text-gray-900'}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
        active 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

function MemorialCard({ memorial, viewMode, onEdit, onView, onDelete, onShare, formatDate }: any) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {memorial.featured_image_url ? (
                <img 
                  src={memorial.featured_image_url} 
                  alt={`${memorial.first_name} ${memorial.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {memorial.first_name} {memorial.last_name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
              </p>
              <div className="mt-1 flex items-center gap-2">
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
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onView} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">View</button>
            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">Edit</button>
            <button onClick={onShare} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">Share</button>
            <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 transition-colors">Delete</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all">
      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden">
        {memorial.cover_photo_url || memorial.featured_image_url ? (
          <img 
            src={memorial.cover_photo_url || memorial.featured_image_url} 
            alt={`${memorial.first_name} ${memorial.last_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg className="w-12 h-12 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {memorial.first_name} {memorial.last_name}
        </h3>
        <p className="text-sm text-gray-500 mb-2">
          {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
        </p>
        <div className="flex items-center justify-between mb-3">
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
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={onView} className="text-sm text-blue-600 hover:text-blue-700 transition-colors">View</button>
            <span className="text-gray-300">•</span>
            <button onClick={onEdit} className="text-sm text-blue-600 hover:text-blue-700 transition-colors">Edit</button>
            <span className="text-gray-300">•</span>
            <button onClick={onShare} className="text-sm text-blue-600 hover:text-blue-700 transition-colors">Share</button>
          </div>
          <button onClick={onDelete} className="text-sm text-red-600 hover:text-red-700 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description, actionLabel, onAction }: any) {
  return (
    <div className="text-center py-12">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-6">
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function DeleteModal({ isOpen, onClose, onConfirm, memorialName }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Delete Memorial</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete {memorialName}'s memorial? This action cannot be undone and will permanently remove all associated content including photos, guestbook entries, and service information.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto transition-colors"
                onClick={onConfirm}
              >
                Delete Memorial
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-up">
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {message}
      </div>
    </div>
  );
}