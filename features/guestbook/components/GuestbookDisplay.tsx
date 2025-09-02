'use client';

import { useState, useEffect } from 'react';
import { GuestbookEntry } from '@/types/memorial';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  MessageSquare, 
  User, 
  Calendar,
  Image as ImageIcon,
  ChevronDown,
  Heart,
  Clock
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

interface GuestbookDisplayProps {
  memorialId: string;
  entries: GuestbookEntry[];
  isLoading?: boolean;
  showModerated?: boolean;
  onEntryAdded?: () => void;
}

export default function GuestbookDisplay({ 
  memorialId, 
  entries: initialEntries,
  isLoading = false,
  showModerated = true,
  onEntryAdded
}: GuestbookDisplayProps) {
  const [entries, setEntries] = useState<GuestbookEntry[]>(initialEntries);
  const [displayCount, setDisplayCount] = useState(10);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const supabase = createClientComponentClient();

  // Filter entries based on moderation preference
  const displayedEntries = showModerated 
    ? entries.filter(e => e.status === 'approved')
    : entries;

  const visibleEntries = displayedEntries.slice(0, displayCount);
  const hasMore = displayedEntries.length > displayCount;

  // Update entries when prop changes
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`guestbook-${memorialId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guestbook_entries',
          filter: `memorial_id=eq.${memorialId}`
        },
        (payload) => {
          const newEntry = payload.new as GuestbookEntry;
          if (!showModerated || newEntry.status === 'approved') {
            setEntries(prev => [newEntry, ...prev]);
            onEntryAdded?.();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guestbook_entries',
          filter: `memorial_id=eq.${memorialId}`
        },
        (payload) => {
          const updatedEntry = payload.new as GuestbookEntry;
          setEntries(prev => prev.map(e => 
            e.id === updatedEntry.id ? updatedEntry : e
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memorialId, showModerated, supabase, onEntryAdded]);

  const loadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + 10);
      setIsLoadingMore(false);
    }, 500);
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const entryDate = new Date(date);
    const diffMs = now.getTime() - entryDate.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <EntryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (displayedEntries.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <MessageSquare className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No memories shared yet
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Be the first to share a memory or condolence. Your words will bring comfort to the family.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Entry count header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {displayedEntries.length} {displayedEntries.length === 1 ? 'Memory' : 'Memories'} Shared
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            Most recent first
          </div>
        </div>

        {/* Entries list */}
        {visibleEntries.map((entry) => (
          <EntryCard 
            key={entry.id} 
            entry={entry}
            onImageClick={setLightboxImage}
            formatTime={formatRelativeTime}
            getInitials={getInitials}
          />
        ))}

        {/* Load more button */}
        {hasMore && (
          <div className="pt-4 text-center">
            <Button
              variant="secondary"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="w-full sm:w-auto"
            >
              {isLoadingMore ? (
                <>Loading...</>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Load More ({displayedEntries.length - visibleEntries.length} remaining)
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      <Modal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        title="Photo"
      >
        {lightboxImage && (
          <div className="relative">
            <img
              src={lightboxImage}
              alt="Guestbook entry photo"
              className="w-full h-auto rounded-lg"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

// Individual Entry Card Component
function EntryCard({ 
  entry, 
  onImageClick,
  formatTime,
  getInitials
}: {
  entry: GuestbookEntry;
  onImageClick: (url: string) => void;
  formatTime: (date: string) => string;
  getInitials: (name: string) => string;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <article className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-700 font-semibold text-sm">
              {getInitials(entry.author_name)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-base font-semibold text-gray-900">
                {entry.author_name}
              </h4>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {formatTime(entry.created_at)}
              </p>
            </div>
            {entry.status === 'pending' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pending Approval
              </span>
            )}
          </div>

          {/* Message */}
          <div className="mt-3">
            <p className="text-gray-700 whitespace-pre-wrap break-words">
              {entry.message}
            </p>
          </div>

          {/* Photo attachment */}
          {entry.photo_url && !imageError && (
            <div className="mt-4">
              <button
                onClick={() => onImageClick(entry.photo_url!)}
                className="relative group inline-block"
                aria-label="View photo"
              >
                <img
                  src={entry.photo_url}
                  alt="Memory photo"
                  className="rounded-lg max-w-full h-auto max-h-48 object-cover cursor-pointer group-hover:opacity-95 transition-opacity"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </button>
            </div>
          )}

          {/* Footer with subtle Catholic touch */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 italic flex items-center">
              <Heart className="h-3 w-3 mr-1 text-red-400" />
              Shared with love and prayers
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

// Loading skeleton for entries
function EntryCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}