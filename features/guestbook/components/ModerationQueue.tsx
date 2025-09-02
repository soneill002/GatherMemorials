'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  MessageSquare, 
  Check, 
  X, 
  AlertCircle,
  Clock,
  User,
  Image as ImageIcon,
  Filter,
  Ban,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import type { GuestbookEntry } from '@/types/memorial';

interface ModerationQueueProps {
  userId?: string;
  memorialId?: string; // Optional: filter by specific memorial
  onModerationComplete?: () => void;
}

interface Memorial {
  id: string;
  first_name: string;
  last_name: string;
  featured_photo?: string;
}

interface ExtendedGuestbookEntry extends GuestbookEntry {
  memorial?: Memorial;
  expanded?: boolean;
}

export default function ModerationQueue({ 
  userId, 
  memorialId,
  onModerationComplete 
}: ModerationQueueProps) {
  const [entries, setEntries] = useState<ExtendedGuestbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMemorial, setSelectedMemorial] = useState<string>('all');
  const [userMemorials, setUserMemorials] = useState<Memorial[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [blockUserModal, setBlockUserModal] = useState<{
    isOpen: boolean;
    userId?: string;
    userName?: string;
  }>({ isOpen: false });
  const [imagePreviewModal, setImagePreviewModal] = useState<{
    isOpen: boolean;
    url?: string;
  }>({ isOpen: false });
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0
  });

  const supabase = createClientComponentClient();
  const { success, error: showError, ToastContainer } = useToast();

  useEffect(() => {
    loadData();
  }, [userId, memorialId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user if not provided
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          showError('Not authenticated', 'Please sign in to access moderation');
          return;
        }
        currentUserId = session.user.id;
      }

      // Load user's memorials
      const { data: memorials, error: memorialsError } = await supabase
        .from('memorials')
        .select('id, first_name, last_name, featured_photo')
        .eq('user_id', currentUserId)
        .eq('guestbook_settings->>enabled', true)
        .eq('guestbook_settings->>moderated', true);

      if (memorialsError) throw memorialsError;
      setUserMemorials(memorials || []);

      // Build query for pending entries
      let query = supabase
        .from('guestbook_entries')
        .select(`
          *,
          memorial:memorials!inner(
            id,
            first_name,
            last_name,
            featured_photo
          ),
          profiles:user_id(
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Filter by specific memorial or all user's memorials
      if (memorialId) {
        query = query.eq('memorial_id', memorialId);
      } else if (memorials && memorials.length > 0) {
        const memorialIds = memorials.map(m => m.id);
        query = query.in('memorial_id', memorialIds);
      }

      const { data: pendingEntries, error: entriesError } = await query;
      if (entriesError) throw entriesError;

      // Transform entries with author info
      const transformedEntries = (pendingEntries || []).map(entry => ({
        ...entry,
        author_name: entry.author_name || entry.profiles?.full_name || 'Anonymous',
        author_email: entry.author_email || entry.profiles?.email,
        expanded: false
      }));

      setEntries(transformedEntries);

      // Load moderation stats for today
      await loadStats(currentUserId);

    } catch (error) {
      console.error('Error loading moderation queue:', error);
      showError('Error loading entries', 'Please refresh the page to try again');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async (userId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Get today's moderation stats
      const { data, error } = await supabase
        .from('guestbook_entries')
        .select('status')
        .in('memorial_id', userMemorials.map(m => m.id))
        .gte('moderated_at', today.toISOString());

      if (!error && data) {
        const approved = data.filter(e => e.status === 'approved').length;
        const rejected = data.filter(e => e.status === 'rejected').length;
        
        setStats({
          pending: entries.length,
          approvedToday: approved,
          rejectedToday: rejected
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleApprove = async (entryId: string) => {
    setProcessingIds(prev => new Set(prev).add(entryId));

    try {
      const { error } = await supabase
        .from('guestbook_entries')
        .update({
          status: 'approved',
          moderated_at: new Date().toISOString(),
          moderated_by: userId || (await supabase.auth.getSession()).data.session?.user.id
        })
        .eq('id', entryId);

      if (error) throw error;

      // Remove from list
      setEntries(prev => prev.filter(e => e.id !== entryId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        approvedToday: prev.approvedToday + 1
      }));

      success('Entry approved', 'The message is now visible on the memorial');
      
      // TODO: Send approval email notification
      
      onModerationComplete?.();
    } catch (error) {
      console.error('Error approving entry:', error);
      showError('Error', 'Could not approve entry. Please try again.');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  const handleReject = async (entryId: string) => {
    setProcessingIds(prev => new Set(prev).add(entryId));

    try {
      const { error } = await supabase
        .from('guestbook_entries')
        .update({
          status: 'rejected',
          moderated_at: new Date().toISOString(),
          moderated_by: userId || (await supabase.auth.getSession()).data.session?.user.id
        })
        .eq('id', entryId);

      if (error) throw error;

      // Remove from list
      setEntries(prev => prev.filter(e => e.id !== entryId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        rejectedToday: prev.rejectedToday + 1
      }));

      success('Entry rejected', 'The message has been removed');
      
      // TODO: Optionally send rejection email
      
      onModerationComplete?.();
    } catch (error) {
      console.error('Error rejecting entry:', error);
      showError('Error', 'Could not reject entry. Please try again.');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (entries.length === 0) return;

    const confirmMessage = action === 'approve' 
      ? `Approve all ${entries.length} pending entries?`
      : `Reject all ${entries.length} pending entries?`;

    if (!confirm(confirmMessage)) return;

    setBulkAction(action);
    const entryIds = entries.map(e => e.id);
    setProcessingIds(new Set(entryIds));

    try {
      const { error } = await supabase
        .from('guestbook_entries')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          moderated_at: new Date().toISOString(),
          moderated_by: userId || (await supabase.auth.getSession()).data.session?.user.id
        })
        .in('id', entryIds);

      if (error) throw error;

      // Clear all entries
      setEntries([]);
      
      // Update stats
      setStats(prev => ({
        pending: 0,
        approvedToday: action === 'approve' ? prev.approvedToday + entryIds.length : prev.approvedToday,
        rejectedToday: action === 'reject' ? prev.rejectedToday + entryIds.length : prev.rejectedToday
      }));

      success(
        `Bulk ${action} complete`,
        `All ${entryIds.length} entries have been ${action}d`
      );
      
      onModerationComplete?.();
    } catch (error) {
      console.error(`Error bulk ${action}ing entries:`, error);
      showError('Error', `Could not ${action} all entries. Please try again.`);
    } finally {
      setBulkAction(null);
      setProcessingIds(new Set());
    }
  };

  const handleBlockUser = async () => {
    if (!blockUserModal.userId) return;

    try {
      // Add to blocked users table
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_id: blockUserModal.userId,
          blocked_by: userId || (await supabase.auth.getSession()).data.session?.user.id,
          reason: 'Spam or inappropriate content',
          blocked_at: new Date().toISOString()
        });

      if (error) throw error;

      // Reject all pending entries from this user
      await supabase
        .from('guestbook_entries')
        .update({ status: 'rejected' })
        .eq('user_id', blockUserModal.userId)
        .eq('status', 'pending');

      // Remove their entries from the queue
      setEntries(prev => prev.filter(e => e.user_id !== blockUserModal.userId));

      success('User blocked', 'This user can no longer post to your memorials');
      setBlockUserModal({ isOpen: false });
    } catch (error) {
      console.error('Error blocking user:', error);
      showError('Error', 'Could not block user. Please try again.');
    }
  };

  const toggleExpanded = (entryId: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, expanded: !entry.expanded }
        : entry
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Filter entries by selected memorial
  const filteredEntries = selectedMemorial === 'all' 
    ? entries 
    : entries.filter(e => e.memorial_id === selectedMemorial);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Guestbook Moderation</h2>
              <p className="text-sm text-gray-500 mt-1">
                Review and approve messages before they appear on memorials
              </p>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
              <div className="text-xs text-yellow-700">Pending</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-900">{stats.approvedToday}</div>
              <div className="text-xs text-green-700">Approved Today</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-red-900">{stats.rejectedToday}</div>
              <div className="text-xs text-red-700">Rejected Today</div>
            </div>
          </div>
        </div>

        {/* Filters and Bulk Actions */}
        {userMemorials.length > 1 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedMemorial}
                  onChange={(e) => setSelectedMemorial(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Memorials ({entries.length})</option>
                  {userMemorials.map(memorial => {
                    const count = entries.filter(e => e.memorial_id === memorial.id).length;
                    return (
                      <option key={memorial.id} value={memorial.id}>
                        {memorial.first_name} {memorial.last_name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {filteredEntries.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleBulkAction('approve')}
                    disabled={bulkAction !== null}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve All
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleBulkAction('reject')}
                    disabled={bulkAction !== null}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject All
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pending entries
            </h3>
            <p className="text-gray-500">
              All guestbook messages have been reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Entry Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Memorial Info */}
                      {entry.memorial && (
                        <div className="flex items-center gap-2">
                          {entry.memorial.featured_photo ? (
                            <img
                              src={entry.memorial.featured_photo}
                              alt={`${entry.memorial.first_name} ${entry.memorial.last_name}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                          )}
                          <span className="font-medium text-sm text-gray-900">
                            {entry.memorial.first_name} {entry.memorial.last_name}
                          </span>
                        </div>
                      )}
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => toggleExpanded(entry.id)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label={entry.expanded ? 'Collapse' : 'Expand'}
                    >
                      {entry.expanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Entry Content */}
                <div className="p-4">
                  {/* Author Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-700 font-semibold">
                          {entry.author_name[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{entry.author_name}</div>
                        {entry.author_email && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {entry.author_email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleApprove(entry.id)}
                        disabled={processingIds.has(entry.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        aria-label="Approve"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleReject(entry.id)}
                        disabled={processingIds.has(entry.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        aria-label="Reject"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Message */}
                  <div className={`text-gray-700 ${!entry.expanded ? 'line-clamp-3' : ''}`}>
                    <p className="whitespace-pre-wrap break-words">{entry.message}</p>
                  </div>

                  {/* Photo if exists */}
                  {entry.photo_url && (
                    <button
                      onClick={() => setImagePreviewModal({ isOpen: true, url: entry.photo_url })}
                      className="mt-3 relative group"
                    >
                      <img
                        src={entry.photo_url}
                        alt="Attached photo"
                        className="rounded-lg max-h-32 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </button>
                  )}

                  {/* Expanded Actions */}
                  {entry.expanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleApprove(entry.id)}
                          disabled={processingIds.has(entry.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve & Publish
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleReject(entry.id)}
                          disabled={processingIds.has(entry.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                      
                      {entry.user_id && (
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => setBlockUserModal({
                            isOpen: true,
                            userId: entry.user_id,
                            userName: entry.author_name
                          })}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Block User
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Processing Overlay */}
                {processingIds.has(entry.id) && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Moderation Guidelines</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Approve messages that are respectful and appropriate</li>
                <li>Reject spam, offensive content, or unrelated messages</li>
                <li>Block users who repeatedly post inappropriate content</li>
                <li>Approved messages appear immediately on the memorial</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Block User Modal */}
      <Modal
        isOpen={blockUserModal.isOpen}
        onClose={() => setBlockUserModal({ isOpen: false })}
        title="Block User"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Are you sure you want to block <strong>{blockUserModal.userName}</strong>?
              This will:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-red-700">
              <li>Prevent them from posting to any of your memorials</li>
              <li>Reject all their pending messages</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleBlockUser}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Block User
            </Button>
            <Button
              variant="secondary"
              onClick={() => setBlockUserModal({ isOpen: false })}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isOpen={imagePreviewModal.isOpen}
        onClose={() => setImagePreviewModal({ isOpen: false })}
        title="Attached Photo"
      >
        {imagePreviewModal.url && (
          <img
            src={imagePreviewModal.url}
            alt="Guestbook entry photo"
            className="w-full h-auto rounded-lg"
          />
        )}
      </Modal>

      {/* Toast Container */}
      <ToastContainer position="bottom-right" />
    </>
  );
}