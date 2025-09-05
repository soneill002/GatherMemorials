'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import ModerationQueue from '@/features/guestbook/components/ModerationQueue';
import { ArrowLeft, MessageSquare, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { Database } from '@/types/database';

interface Memorial {
  id: string;
  name: string;
  deceased_name: string;
}

interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface GuestbookEntryStatus {
  status: 'pending' | 'approved' | 'rejected';
}

export default function PendingGuestbookPage() {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [selectedMemorialId, setSelectedMemorialId] = useState<string>('');
  const [stats, setStats] = useState<ModerationStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    if (selectedMemorialId) {
      loadStats();
    }
  }, [selectedMemorialId, refreshKey]);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/signin?redirect=/account/guestbook/pending');
        return;
      }

      // Load user's memorials
      const { data: memorialsData, error: memorialsError } = await supabase
        .from('memorials')
        .select('id, name, deceased_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (memorialsError) throw memorialsError;

      // Check if memorials exist and handle appropriately
      if (!memorialsData || memorialsData.length === 0) {
        setError('No memorials found. Create a memorial first to manage its guestbook.');
        setMemorials([]);
        setLoading(false);
        return;
      }

      // Cast to Memorial[] type since we know the structure
      const typedMemorials = memorialsData as unknown as Memorial[];
      setMemorials(typedMemorials);
      setSelectedMemorialId(typedMemorials[0].id);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load your memorials');
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedMemorialId) return;

    try {
      const { data, error } = await supabase
        .from('guestbook_entries')
        .select('status')
        .eq('memorial_id', selectedMemorialId);

      if (error) throw error;

      // Cast data to the correct type
      const entries = (data || []) as GuestbookEntryStatus[];
      
      const stats = entries.reduce((acc, entry) => {
        acc.total++;
        if (entry.status === 'pending') acc.pending++;
        else if (entry.status === 'approved') acc.approved++;
        else if (entry.status === 'rejected') acc.rejected++;
        return acc;
      }, { pending: 0, approved: 0, rejected: 0, total: 0 });

      setStats(stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleModerationComplete = () => {
    // Refresh stats when moderation actions are taken
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your guestbook entries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header - keeping original structure */}
          <div className="mb-6">
            <Link 
              href="/account" 
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Guestbook Moderation
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
            {error.includes('Create a memorial') && (
              <Link
                href="/memorials/new"
                className="inline-flex items-center px-4 py-2 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Memorial
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const selectedMemorial = memorials.find(m => m.id === selectedMemorialId);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header - keeping original structure */}
        <div className="mb-6">
          <Link 
            href="/account" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Guestbook Moderation
          </h1>
        </div>

        {/* Stats and Memorial Selector Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">Review and manage entries for your memorials</p>
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>

          {/* Memorial Selector */}
          {memorials.length > 1 && (
            <div className="mb-6">
              <label htmlFor="memorial-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Memorial
              </label>
              <select
                id="memorial-select"
                value={selectedMemorialId}
                onChange={(e) => setSelectedMemorialId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {memorials.map((memorial) => (
                  <option key={memorial.id} value={memorial.id}>
                    {memorial.deceased_name} - {memorial.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Approved</p>
                  <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Rejected</p>
                  <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Moderation Queue - keeping original component usage */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedMemorial ? `Entries for ${selectedMemorial.deceased_name}` : 'Guestbook Entries'}
            </h2>
          </div>

          <div className="p-6">
            {selectedMemorialId ? (
              <ModerationQueue 
                memorialId={selectedMemorialId}
                onModerationComplete={handleModerationComplete}
              />
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Loading memorial data...</p>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Moderation Tips</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Review entries carefully for appropriate content and respectful tone</span>
            </li>
            <li className="flex items-start">
              <span className="block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Approved entries will be visible immediately on the memorial page</span>
            </li>
            <li className="flex items-start">
              <span className="block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Rejected entries are kept in the system but won't be shown publicly</span>
            </li>
            <li className="flex items-start">
              <span className="block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>You can block users who repeatedly post inappropriate content</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}