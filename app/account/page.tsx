'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Database } from '@/types/database';

// Type definitions based on actual database schema
type Memorial = Database['public']['Tables']['memorials']['Row'];
type GuestbookEntry = Database['public']['Tables']['guestbook_entries']['Row'];

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
  const supabase = createBrowserClient();

  // State
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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/signin?redirect=/account');
        return;
      }

      await Promise.all([
        loadMemorials(session.user.id),
        loadStats(session.user.id)
      ]);
    } catch (error) {
      console.error('Error checking auth:', error);
      setError('Authentication error. Please sign in again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemorials = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('memorials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading memorials:', error);
        // Continue without memorials - user might not have any yet
      }
      
      setMemorials(data || []);
    } catch (error) {
      console.error('Error loading memorials:', error);
    }
  };

  const loadStats = async (userId: string) => {
    try {
      // Load memorial count
      const { count: memorialCount } = await supabase
        .from('memorials')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get published and draft counts
      const { count: publishedCount } = await supabase
        .from('memorials')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'published');

      const { count: draftCount } = await supabase
        .from('memorials')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'draft');

      // Calculate total views from memorials
      const { data: memorialsWithViews } = await supabase
        .from('memorials')
        .select('view_count')
        .eq('user_id', userId);
      
      const totalViews = memorialsWithViews?.reduce((sum, item) => sum + (item.view_count || 0), 0) || 0;

      // Load guestbook stats if there are memorials
      let totalEntries = 0;
      let pendingCount = 0;
      
      if (memorials.length > 0) {
        const memorialIds = memorials.map(m => m.id);
        
        // Get total guestbook entries
        const { count: entriesCount } = await supabase
          .from('guestbook_entries')
          .select('*', { count: 'exact', head: true })
          .in('memorial_id', memorialIds);

        totalEntries = entriesCount || 0;

        // Get pending entries
        const { count: pending } = await supabase
          .from('guestbook_entries')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .in('memorial_id', memorialIds);

        pendingCount = pending || 0;
      }

      // Load prayer list count
      const { count: prayerCount } = await supabase
        .from('prayer_lists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setStats({
        totalMemorials: memorialCount || 0,
        publishedMemorials: publishedCount || 0,
        draftMemorials: draftCount || 0,
        totalViews: totalViews,
        totalGuestbookEntries: totalEntries,
        pendingModeration: pendingCount,
        prayerListCount: prayerCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeleteMemorial = async () => {
    if (!selectedMemorial) return;

    try {
      const { error } = await supabase
        .from('memorials')
        .delete()
        .eq('id', selectedMemorial.id);

      if (error) throw error;

      setToastMessage('Memorial deleted successfully');
      setShowToast(true);
      setMemorials(memorials.filter(m => m.id !== selectedMemorial.id));
      setShowDeleteModal(false);
      setSelectedMemorial(null);
      
      // Reload stats
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        loadStats(session.user.id);
      }
    } catch (error) {
      console.error('Error deleting memorial:', error);
      setToastMessage('Failed to delete memorial');
      setShowToast(true);
    }
  };

  const filteredMemorials = memorials.filter(memorial => {
    if (activeTab === 'published') return memorial.status === 'published';
    if (activeTab === 'draft') return memorial.status === 'draft';
    return true;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Memorials</h1>
              <p className="mt-1 text-gray-600">Manage and monitor your memorial pages</p>
            </div>
            <Link 
              href="/memorials/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create New Memorial
            </Link>
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

        {/* Pending Moderation Alert */}
        {stats.pendingModeration > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800">
                  You have {stats.pendingModeration} guestbook {stats.pendingModeration === 1 ? 'entry' : 'entries'} awaiting moderation
                </h3>
                <Link href="/account/guestbook/pending" className="text-sm text-amber-700 hover:text-amber-800 underline mt-1 inline-block">
                  Review pending entries →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <QuickLinkCard 
            href="/account/prayer-list"
            title="Prayer List"
            subtitle={`${stats.prayerListCount} people`}
            icon="prayer"
          />
          <QuickLinkCard 
            href="/account/billing"
            title="Billing"
            subtitle="Payment history"
            icon="billing"
          />
          <QuickLinkCard 
            href="/account/settings"
            title="Settings"
            subtitle="Account settings"
            icon="settings"
          />
          <QuickLinkCard 
            href="/contact"
            title="Support"
            subtitle="Get help"
            icon="support"
          />
        </div>

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
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
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
                    onDelete={() => {
                      setSelectedMemorial(memorial);
                      setShowDeleteModal(true);
                    }}
                    onShare={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/memorials/${memorial.id}`);
                      setToastMessage('Memorial link copied to clipboard');
                      setShowToast(true);
                    }}
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
      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteMemorial}
          memorialName={selectedMemorial ? `${selectedMemorial.first_name} ${selectedMemorial.last_name}` : ''}
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
      <p className={`mt-2 text-3xl font-semibold ${highlight ? 'text-amber-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function QuickLinkCard({ href, title, subtitle, icon }: { href: string; title: string; subtitle: string; icon: string }) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <IconComponent type={icon} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{title}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function IconComponent({ type }: { type: string }) {
  const icons: { [key: string]: JSX.Element } = {
    prayer: (
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    billing: (
      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    settings: (
      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    support: (
      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  };
  return icons[type] || <div />;
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 px-1 border-b-2 font-medium text-sm ${
        active 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

function MemorialCard({ memorial, viewMode, onEdit, onDelete, onShare }: any) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {memorial.featured_image_url ? (
              <img 
                src={memorial.featured_image_url} 
                alt={`${memorial.first_name} ${memorial.last_name}`}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {memorial.first_name} {memorial.last_name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
              </p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                memorial.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {memorial.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={onShare} className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-4.732 0m4.732 0a3 3 0 10-4.732 0M6.316 10.658a3 3 0 10-2.632 0" />
              </svg>
            </button>
            <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
        {memorial.cover_photo_url ? (
          <img 
            src={memorial.cover_photo_url} 
            alt="Memorial cover"
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {memorial.first_name} {memorial.last_name}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            memorial.status === 'published' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {memorial.status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
        </p>
        {memorial.headline && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{memorial.headline}</p>
        )}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="text-sm text-blue-600 hover:text-blue-700">
              Edit
            </button>
            <span className="text-gray-300">•</span>
            <button onClick={onShare} className="text-sm text-blue-600 hover:text-blue-700">
              Share
            </button>
          </div>
          <button onClick={onDelete} className="text-sm text-red-600 hover:text-red-700">
            Delete
          </button>
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
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
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
                    Are you sure you want to delete {memorialName}'s memorial? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                onClick={onConfirm}
              >
                Delete Memorial
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      {message}
    </div>
  );
}

function formatDate(dateString: string | null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}