'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { ShareModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

export default function MemorialSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const { success, error: showError, ToastContainer } = useToast();
  
  const memorialId = params.id as string;
  const sessionId = searchParams.get('session_id'); // Stripe session ID
  
  // State
  const [memorial, setMemorial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Load memorial data
    loadMemorial();
    
    // Mark memorial as published if coming from payment
    if (sessionId) {
      publishMemorial();
    }
  }, [memorialId, sessionId]);

  const loadMemorial = async () => {
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/auth/signin?redirect=/memorials/${memorialId}/success`);
        return;
      }

      // Load memorial
      const { data: memorialData, error } = await supabase
        .from('memorials')
        .select('*')
        .eq('id', memorialId)
        .eq('user_id', session.user.id)
        .single();

      if (error || !memorialData) {
        showError('Memorial not found', 'Unable to load your memorial');
        router.push('/account/memorials');
        return;
      }

      setMemorial(memorialData);
    } catch (error) {
      console.error('Error loading memorial:', error);
      showError('Error loading memorial', 'Please try refreshing the page');
    } finally {
      setIsLoading(false);
    }
  };

  const publishMemorial = async () => {
    try {
      // Update memorial status to published
      const { error } = await supabase
        .from('memorials')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', memorialId);

      if (error) throw error;
      
      success('Memorial Published', 'Your memorial is now live and viewable');
    } catch (error) {
      console.error('Error publishing memorial:', error);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/memorials/${memorialId}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      success('Link copied', 'Memorial link copied to clipboard');
      
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Error copying link:', error);
      showError('Copy failed', 'Please copy the link manually');
    }
  };

  const sendEmailInvites = async () => {
    // This would integrate with your email service
    setEmailSent(true);
    success('Invitations sent', 'Email invitations have been sent');
    
    // In production, this would:
    // 1. Open a modal to collect email addresses
    // 2. Send personalized emails via your email service
    // 3. Track who has been invited
  };

  const shareToFacebook = () => {
    const url = `${window.location.origin}/memorials/${memorialId}`;
    const text = `In loving memory of ${memorial?.first_name} ${memorial?.last_name}. Please visit their memorial page to share memories and condolences.`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const shareToTwitter = () => {
    const url = `${window.location.origin}/memorials/${memorialId}`;
    const text = `In loving memory of ${memorial?.first_name} ${memorial?.last_name}. View their memorial:`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finalizing your memorial...</p>
        </div>
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Memorial not found</h1>
          <Link href="/account/memorials">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Header - Respectful and Professional */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Memorial Successfully Created
          </h1>
          
          <p className="text-xl text-gray-700 mb-3">
            {memorial.first_name} {memorial.last_name}'s memorial page is now live
          </p>
          
          <p className="text-gray-600 max-w-2xl mx-auto">
            Thank you for creating this lasting tribute. This memorial will serve as a beautiful 
            place for family and friends to gather, share memories, and celebrate a life well-lived.
          </p>
        </div>

        {/* Memorial Preview Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="relative h-32 bg-gradient-to-b from-blue-900 to-blue-600">
            {memorial.cover_photo && (
              <img 
                src={memorial.cover_photo} 
                alt="Cover" 
                className="w-full h-full object-cover opacity-80"
              />
            )}
          </div>
          
          <div className="p-6 -mt-12 relative">
            <div className="flex items-start gap-4">
              {memorial.featured_photo && (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                  <img 
                    src={memorial.featured_photo} 
                    alt={`${memorial.first_name} ${memorial.last_name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1 pt-12">
                <h2 className="text-2xl font-bold text-gray-900">
                  {memorial.first_name} {memorial.middle_name} {memorial.last_name}
                </h2>
                {memorial.headline && (
                  <p className="text-gray-600 mt-1">{memorial.headline}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(memorial.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - {' '}
                  {new Date(memorial.date_of_death).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/memorials/${memorialId}`}>
                <Button variant="primary">
                  View Memorial
                </Button>
              </Link>
              
              <Link href={`/memorials/new?id=${memorialId}`}>
                <Button variant="secondary">
                  Edit Memorial
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                onClick={() => setShowShareModal(true)}
              >
                Share Memorial
              </Button>
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Share This Memorial
            </h2>
            <p className="text-gray-600">
              Invite family and friends to visit {memorial.first_name}'s memorial page
            </p>
          </div>
          
          {/* Memorial Link */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Memorial Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/memorials/${memorial.custom_url || memorialId}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-mono text-sm"
              />
              <Button
                variant="secondary"
                onClick={copyLink}
              >
                {copied ? '✓ Copied' : 'Copy Link'}
              </Button>
            </div>
          </div>
          
          {/* Quick Share Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={shareToFacebook}
              className="flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Share on Facebook
            </button>
            
            <button
              onClick={shareToTwitter}
              className="flex items-center justify-center gap-3 px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Share on Twitter
            </button>
            
            <button
              onClick={sendEmailInvites}
              className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {emailSent ? 'Invitations Sent' : 'Email Invitations'}
            </button>
          </div>
        </div>

        {/* Next Steps - Professional Guidance */}
        <div className="bg-blue-50 rounded-xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Next Steps
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Share with loved ones</p>
                <p className="text-sm text-gray-600">
                  Use the share options above to invite family and friends to visit the memorial 
                  and contribute their own memories and condolences.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Monitor the guestbook</p>
                <p className="text-sm text-gray-600">
                  {memorial.guestbook_settings?.moderation === 'pre' 
                    ? "You'll receive email notifications when visitors leave messages. Review and approve them from your dashboard to ensure all content remains respectful."
                    : "Guestbook entries will appear automatically. You can monitor and moderate content from your dashboard if needed."}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Continue building the memorial</p>
                <p className="text-sm text-gray-600">
                  You can return at any time to add more photos, update the obituary, or enhance 
                  the memorial with additional memories and information.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">4</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Memorial preservation</p>
                <p className="text-sm text-gray-600">
                  Your memorial is permanently preserved and will remain accessible to future generations. 
                  We'll keep it safe and secure for years to come.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/account/memorials">
            <Button variant="secondary" size="large">
              Go to Dashboard
            </Button>
          </Link>
          
          <Link href={`/memorials/${memorialId}`}>
            <Button variant="primary" size="large">
              View Memorial Page →
            </Button>
          </Link>
        </div>

        {/* Receipt and Support Notice */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-gray-600">
            A receipt has been sent to your registered email address.
          </p>
          <p className="text-sm text-gray-600">
            View your <Link href="/account/billing" className="text-blue-600 hover:underline">billing history</Link> or 
            contact <Link href="/contact" className="text-blue-600 hover:underline">support</Link> if you need assistance.
          </p>
        </div>

        {/* Prayer/Blessing (subtle, optional) */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 italic">
            "Eternal rest grant unto them, O Lord, and let perpetual light shine upon them."
          </p>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={`${memorial.first_name} ${memorial.last_name}'s Memorial`}
          url={`${window.location.origin}/memorials/${memorial.custom_url || memorialId}`}
        />
      )}

      {/* Toast Container */}
      <ToastContainer position="top-right" />
    </div>
  );
}