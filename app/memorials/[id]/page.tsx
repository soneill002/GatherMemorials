'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ShareModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { GuestbookForm } from '@/features/guestbook/components/GuestbookForm';
import GuestbookDisplay from '@/features/guestbook/components/GuestbookDisplay';
import Link from 'next/link';
import type { Memorial, GuestbookEntry, ServiceEvent } from '@/types/memorial';

export default function MemorialPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { success, error: showError, ToastContainer } = useToast();
  
  const memorialId = params.id as string;
  
  // State
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'obituary' | 'services' | 'gallery' | 'guestbook'>('obituary');
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [isLoadingGuestbook, setIsLoadingGuestbook] = useState(false);
  const [isInPrayerList, setIsInPrayerList] = useState(false);

  useEffect(() => {
    loadMemorial();
  }, [memorialId]);

  const loadMemorial = async () => {
    try {
      setIsLoading(true);
      
      // First, try to load the memorial
      const { data: memorialData, error } = await supabase
        .from('memorials')
        .select('*')
        .eq('id', memorialId)
        .single();

      if (error || !memorialData) {
        router.push('/404');
        return;
      }

      // Check if memorial is published
      if (memorialData.status !== 'published') {
        // Check if current user is the owner
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || session.user.id !== memorialData.user_id) {
          router.push('/404');
          return;
        }
        setIsOwner(true);
      }

      // Handle privacy settings
      if (memorialData.privacy === 'password' && !isAuthenticated) {
        setShowPasswordModal(true);
        setMemorial(memorialData);
        setIsLoading(false);
        return;
      }

      // Check if current user is the owner
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.id === memorialData.user_id) {
        setIsOwner(true);
      }

      // Load guestbook entries if enabled
      if (memorialData.guestbook_settings?.enabled) {
        loadGuestbookEntries();
      }

      // Check if in prayer list (if user is logged in)
      if (session) {
        checkPrayerListStatus(session.user.id);
      }

      setMemorial(memorialData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error loading memorial:', error);
      showError('Error loading memorial', 'Please try refreshing the page');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGuestbookEntries = async () => {
    try {
      setIsLoadingGuestbook(true);
      
      // Load all entries, including pending ones if user is owner
      const query = supabase
        .from('guestbook_entries')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('memorial_id', memorialId)
        .order('created_at', { ascending: false });

      // If not owner, only show approved entries
      if (!isOwner) {
        query.eq('status', 'approved');
      }

      const { data, error } = await query;

      if (!error && data) {
        // Transform data to include profile info
        const entriesWithProfiles = data.map(entry => ({
          ...entry,
          author_name: entry.author_name || entry.profiles?.full_name || 'Anonymous',
          author_avatar: entry.profiles?.avatar_url
        }));
        setGuestbookEntries(entriesWithProfiles);
      }
    } catch (error) {
      console.error('Error loading guestbook:', error);
    } finally {
      setIsLoadingGuestbook(false);
    }
  };

  const checkPrayerListStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('prayer_lists')
        .select('id')
        .eq('user_id', userId)
        .eq('memorial_id', memorialId)
        .single();

      setIsInPrayerList(!!data);
    } catch (error) {
      console.error('Error checking prayer list:', error);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!memorial) return;
    
    // In production, this would check against the hashed password in the database
    if (password === memorial.password) {
      setIsAuthenticated(true);
      setShowPasswordModal(false);
      success('Access granted', 'You can now view this memorial');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handleAddToPrayerList = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push(`/auth/signin?redirect=/memorials/${memorialId}`);
      return;
    }

    try {
      if (isInPrayerList) {
        // Remove from prayer list
        await supabase
          .from('prayer_lists')
          .delete()
          .eq('user_id', session.user.id)
          .eq('memorial_id', memorialId);
        
        setIsInPrayerList(false);
        success('Removed from prayer list', 'This person has been removed from your prayer list');
      } else {
        // Add to prayer list
        await supabase
          .from('prayer_lists')
          .insert({
            user_id: session.user.id,
            memorial_id: memorialId,
            added_date: new Date().toISOString()
          });
        
        setIsInPrayerList(true);
        success('Added to prayer list', 'You will receive reminders on special dates');
      }
    } catch (error) {
      console.error('Error updating prayer list:', error);
      showError('Error', 'Could not update prayer list. Please try again.');
    }
  };

  const handleGuestbookEntrySubmitted = () => {
    // Reload guestbook entries after submission
    loadGuestbookEntries();
    
    // Show success message if entry doesn't require moderation
    if (memorial && !memorial.guestbook_settings?.moderated) {
      success('Memory shared', 'Your message has been added to the guestbook');
    }
  };

  const handleGuestbookEntryAdded = () => {
    // Called when real-time update adds a new entry
    // Optionally show a notification
    if (!isOwner) {
      success('New memory shared', 'Someone just added a new message to the guestbook');
    }
  };

  const calculateAge = () => {
    if (!memorial?.date_of_birth || !memorial?.date_of_death) return null;
    const birth = new Date(memorial.date_of_birth);
    const death = new Date(memorial.date_of_death);
    const age = Math.floor((death.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatServiceDateTime = (date: string, time?: string) => {
    const dateStr = formatDate(date);
    if (time) {
      return `${dateStr} at ${time}`;
    }
    return dateStr;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading memorial...</p>
        </div>
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Memorial Not Found</h1>
          <p className="text-gray-600 mb-4">This memorial may have been removed or is not available.</p>
          <Link href="/">
            <Button variant="primary">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Password protection modal
  if (showPasswordModal && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <h2 className="text-2xl font-bold mb-4">Password Protected Memorial</h2>
          <p className="text-gray-600 mb-6">
            This memorial is private. Please enter the password to view.
          </p>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              error={passwordError}
            />
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handlePasswordSubmit}
                className="flex-1"
              >
                Submit
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const age = calculateAge();
  const guestbookEntryCount = guestbookEntries.filter(e => 
    !memorial.guestbook_settings?.moderated || e.status === 'approved'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Cover Photo */}
      <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-b from-blue-900 to-blue-600">
        {memorial.cover_photo && (
          <img 
            src={memorial.cover_photo} 
            alt="Memorial cover" 
            className="w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Admin controls */}
        {isOwner && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Link href={`/memorials/new?id=${memorialId}`}>
              <Button variant="secondary" size="small">
                Edit Memorial
              </Button>
            </Link>
            <Link href="/account/memorials">
              <Button variant="ghost" size="small" className="text-white">
                Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Profile Section */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Featured Photo */}
              {memorial.featured_photo && (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={memorial.featured_photo} 
                    alt={`${memorial.first_name} ${memorial.last_name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Basic Info */}
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {memorial.first_name} {memorial.middle_name} {memorial.last_name}
                </h1>
                
                {memorial.nickname && (
                  <p className="text-xl text-gray-600 italic mt-1">"{memorial.nickname}"</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 mt-3 text-gray-600">
                  <span>{formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}</span>
                  {age && <span>• Age {age}</span>}
                </div>
                
                {memorial.headline && (
                  <p className="text-xl text-gray-700 mt-4 font-medium">
                    {memorial.headline}
                  </p>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button
                    variant="primary"
                    onClick={() => setShowShareModal(true)}
                  >
                    Share Memorial
                  </Button>
                  
                  <Button
                    variant={isInPrayerList ? "secondary" : "ghost"}
                    onClick={handleAddToPrayerList}
                  >
                    {isInPrayerList ? '✓ In Prayer List' : 'Add to Prayer List'}
                  </Button>
                  
                  {memorial.donation_info?.url && (
                    <a 
                      href={memorial.donation_info.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="secondary">
                        Make Donation
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('obituary')}
                className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'obituary'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Obituary
              </button>
              
              {memorial.services && memorial.services.length > 0 && (
                <button
                  onClick={() => setActiveTab('services')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === 'services'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Service Info
                </button>
              )}
              
              {memorial.photos && memorial.photos.length > 0 && (
                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === 'gallery'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Gallery ({memorial.photos.length})
                </button>
              )}
              
              {memorial.guestbook_settings?.enabled && (
                <button
                  onClick={() => setActiveTab('guestbook')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === 'guestbook'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Guestbook ({guestbookEntryCount})
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {/* Obituary Tab */}
            {activeTab === 'obituary' && (
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap">{memorial.obituary}</div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && memorial.services && (
              <div className="space-y-6">
                {memorial.services.map((service: ServiceEvent, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">{service.type}</h3>
                    <div className="space-y-2 text-gray-600">
                      <p>
                        <span className="font-medium">Date & Time:</span> {formatServiceDateTime(service.date, service.time)}
                      </p>
                      <p>
                        <span className="font-medium">Location:</span> {service.location}
                      </p>
                      {service.address && (
                        <p>
                          <span className="font-medium">Address:</span> {service.address}
                          {service.address && (
                            <a 
                              href={`https://maps.google.com/?q=${encodeURIComponent(service.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:underline"
                            >
                              Get Directions →
                            </a>
                          )}
                        </p>
                      )}
                      {service.notes && (
                        <p>
                          <span className="font-medium">Additional Info:</span> {service.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === 'gallery' && memorial.photos && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {memorial.photos.map((media, index) => (
                  <div 
                    key={index}
                    className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setLightboxIndex(index);
                      setShowLightbox(true);
                    }}
                  >
                    {media.type === 'image' ? (
                      <img 
                        src={media.url} 
                        alt={media.caption || `Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-gray-500">Video</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Guestbook Tab - FULLY UPDATED WITH NEW DISPLAY COMPONENT */}
            {activeTab === 'guestbook' && memorial.guestbook_settings?.enabled && (
              <div className="space-y-6">
                {/* Guestbook Form Section */}
                <div>
                  <GuestbookForm
                    memorialId={memorialId}
                    memorialName={`${memorial.first_name} ${memorial.last_name}`}
                    requiresModeration={memorial.guestbook_settings?.moderated || false}
                    onEntrySubmitted={handleGuestbookEntrySubmitted}
                  />
                </div>

                {/* Divider */}
                <div className="border-t-2 border-gray-200"></div>

                {/* Enhanced Guestbook Display */}
                <GuestbookDisplay
                  memorialId={memorialId}
                  entries={guestbookEntries}
                  isLoading={isLoadingGuestbook}
                  showModerated={!isOwner} // Owners see all entries, visitors only see approved
                  onEntryAdded={handleGuestbookEntryAdded}
                />

                {/* Moderation Notice for Owners */}
                {isOwner && memorial.guestbook_settings?.moderated && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Moderation is enabled</p>
                        <p>New entries require your approval before appearing publicly.</p>
                        <Link href="/account/guestbook/pending" className="underline hover:no-underline mt-1 inline-block">
                          Manage pending entries →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Donation Section */}
          {memorial.donation_info && (
            <div className="border-t border-gray-200 p-6 md:p-8 bg-blue-50">
              <h3 className="text-lg font-semibold mb-3">Memorial Donations</h3>
              <p className="text-gray-700 mb-4">{memorial.donation_info.description}</p>
              <a 
                href={memorial.donation_info.url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="primary">
                  Make a Donation in {memorial.first_name}'s Memory
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 pb-8">
          <p>Memorial created with love on GatherMemorials</p>
          {memorial.privacy === 'public' && (
            <p className="mt-1">Share this memorial: gathermemorials.com/{memorial.custom_url || `memorials/${memorialId}`}</p>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={`${memorial.first_name} ${memorial.last_name}'s Memorial`}
          url={`${window.location.origin}/memorials/${memorialId}`}
        />
      )}

      {/* Lightbox Modal for Gallery */}
      {showLightbox && memorial.photos && (
        <Modal
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          title=""
        >
          <div className="relative">
            {memorial.photos[lightboxIndex].type === 'image' ? (
              <img
                src={memorial.photos[lightboxIndex].url}
                alt={memorial.photos[lightboxIndex].caption || 'Memorial photo'}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            ) : (
              <video
                src={memorial.photos[lightboxIndex].url}
                controls
                className="w-full h-auto max-h-[80vh]"
              />
            )}
            
            {memorial.photos[lightboxIndex].caption && (
              <p className="text-center mt-4 text-gray-700">
                {memorial.photos[lightboxIndex].caption}
              </p>
            )}
            
            {/* Navigation arrows */}
            {memorial.photos.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex((prev) => 
                    prev === 0 ? memorial.photos!.length - 1 : prev - 1
                  )}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  aria-label="Previous"
                >
                  ←
                </button>
                <button
                  onClick={() => setLightboxIndex((prev) => 
                    prev === memorial.photos!.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  aria-label="Next"
                >
                  →
                </button>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Toast Container */}
      <ToastContainer position="bottom-right" />
    </div>
  );
}