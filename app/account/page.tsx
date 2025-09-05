'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { Card, MemorialCard, StatCard, EmptyStateCard } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import Link from 'next/link';
import type { Memorial } from '@/types/memorial';

interface DashboardStats {
  totalMemorials: number;
  totalViews: number;
  totalGuestbookEntries: number;
  pendingModeration: number;
  prayerListCount: number;
}

export default function AccountDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { success, error: showError, ToastContainer } = useToast();

  // State
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalMemorials: 0,
    totalViews: 0,
    totalGuestbookEntries: 0,
    pendingModeration: 0,
    prayerListCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedMemorial, setSelectedMemorial] = useState<Memorial | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      showError('Authentication error', 'Please sign in again');
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

      if (error) throw error;
      setMemorials(data || []);
    } catch (error) {
      console.error('Error loading memorials:', error);
      showError('Error loading memorials', 'Please refresh the page');
    }
  };

  const loadStats = async (userId: string) => {
    try {
      // Load memorial count
      const { count: memorialCount } = await supabase
        .from('memorials')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Load total views (would need analytics table in production)
      const { data: viewsData } = await supabase
        .from('memorial_analytics')
        .select('views')
        .eq('user_id', userId);
      
      const totalViews = viewsData?.reduce((sum, item) => sum + (item.views || 0), 0) || 0;

      // Load guestbook stats
      const { count: totalEntries } = await supabase
        .from('guestbook_entries')
        .select('*', { count: 'exact', head: true })
        .in('memorial_id', memorials.map(m => m.id));

      const { count: pendingCount } = await supabase
        .from('guestbook_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .in('memorial_id', memorials.map(m => m.id));

      // Load prayer list count
      const { count: prayerCount } = await supabase
        .from('prayer_lists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setStats({
        totalMemorials: memorialCount || 0,
        totalViews: totalViews,
        totalGuestbookEntries: totalEntries || 0,
        pendingModeration: pendingCount || 0,
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

      success('Memorial deleted', 'The memorial has been permanently removed');
      setMemorials(memorials.filter(m => m.id !== selectedMemorial.id));
      setShowDeleteModal(false);
      setSelectedMemorial(null);
    } catch (error) {
      console.error('Error deleting memorial:', error);
      showError('Delete failed', 'Could not delete the memorial');
    }
  };

  const filteredMemorials = memorials.filter(memorial => {
    if (activeTab === 'published') return memorial.status === 'published';
    if (activeTab === 'draft') return memorial.status === 'draft';
    return true;
  });

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
            <Link href="/memorials/new">
              <Button variant="primary" size="lg">
                Create New Memorial
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total Memorials"
            value={stats.totalMemorials}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            title="Total Views"
            value={stats.totalViews}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />
          <StatCard
            title="Guestbook Entries"
            value={stats.totalGuestbookEntries}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
          />
          <StatCard
            title="Pending Moderation"
            value={stats.pendingModeration}
            variant={stats.pendingModeration > 0 ? 'highlight' : 'default'}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Prayer List"
            value={stats.prayerListCount}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
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
          <Link href="/account/prayer-list">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Prayer List</p>
                  <p className="text-sm text-gray-500">{stats.prayerListCount} people</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/account/billing">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Billing</p>
                  <p className="text-sm text-gray-500">Payment history</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/account/settings">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Settings</p>
                  <p className="text-sm text-gray-500">Account settings</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/contact">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Support</p>
                  <p className="text-sm text-gray-500">Get help</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Memorials Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <Tabs
                  tabs={[
                    { id: 'all', label: `All (${memorials.length})` },
                    { id: 'published', label: `Published (${memorials.filter(m => m.status === 'published').length})` },
                    { id: 'draft', label: `Drafts (${memorials.filter(m => m.status === 'draft').length})` }
                  ]}
                  selectedTab={activeTab}
                  onChange={(tab) => setActiveTab(tab as 'all' | 'published' | 'draft')}
                >
                  <div></div>
                  <div></div>
                  <div></div>
                </Tabs>
                
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
                    memorial={{
                      id: memorial.id,
                      name: `${memorial.first_name} ${memorial.last_name}`,
                      dates: {
                        birth: memorial.date_of_birth,
                        death: memorial.date_of_death
                      },
                      imageUrl: memorial.featured_image_url || undefined,
                      coverPhotoUrl: memorial.cover_photo_url || undefined,
                      headline: memorial.headline || undefined,
                      privacy: memorial.privacy_setting || 'private',
                      isPublished: memorial.status === 'published',
                      createdAt: memorial.created_at
                    }}
                    variant={viewMode}
                    showActions={true}
                    onEdit={() => router.push(`/memorials/new?id=${memorial.id}`)}
                    onDelete={() => {
                      setSelectedMemorial(memorial);
                      setShowDeleteModal(true);
                    }}
                    onShare={() => {
                      // Share functionality can be implemented later
                      navigator.clipboard.writeText(`${window.location.origin}/memorials/${memorial.id}`);
                      success('Link copied!', 'Memorial link copied to clipboard');
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyStateCard
                title={activeTab === 'draft' ? 'No draft memorials' : 'No memorials yet'}
                description={activeTab === 'draft' ? 'Your completed drafts will appear here' : 'Create your first memorial to preserve memories forever'}
                actionLabel="Create Memorial"
                onAction={() => router.push('/memorials/new')}
                icon={
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteMemorial}
        title="Delete Memorial"
        message={`Are you sure you want to delete ${selectedMemorial?.first_name} ${selectedMemorial?.last_name}'s memorial? This action cannot be undone.`}
        confirmText="Delete Memorial"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Toast Container */}
      <ToastContainer position="bottom-right" />
    </div>
  );
}