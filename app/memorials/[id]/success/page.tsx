'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  CheckCircle, 
  Share2, 
  Mail, 
  Copy, 
  Eye, 
  Edit, 
  Home, 
  Heart,
  MessageSquare,
  Image as ImageIcon,
  Shield,
  X,
  Loader2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

interface Memorial {
  id: string;
  user_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  nickname?: string;
  headline?: string;
  custom_url?: string;
  privacy: 'public' | 'private' | 'password';
  date_of_birth?: string;
  date_of_death?: string;
  featured_photo?: string;
  cover_photo?: string;
  status: string;
  published_at?: string;
  guestbook_settings?: {
    enabled: boolean;
    moderation: 'pre' | 'post' | 'none';
  };
}

export default function MemorialSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const { showToast } = useToast();
  
  const memorialId = params.id as string;
  const sessionId = searchParams.get('session_id'); // Stripe session ID
  
  // State
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const memorialUrl = memorial?.custom_url 
    ? `https://gathermemorials.com/memorial/${memorial.custom_url}`
    : `https://gathermemorials.com/memorials/${memorialId}`;

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Check authentication first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push(`/auth/signin?redirect=/memorials/${memorialId}/success${sessionId ? `?session_id=${sessionId}` : ''}`);
          return;
        }

        // Verify payment if session_id is present
        if (sessionId) {
          setVerifyingPayment(true);
          const paymentVerified = await verifyPayment();
          
          if (!paymentVerified) {
            showToast('Payment verification failed. Please contact support if you were charged.', 'error');
            router.push('/account/memorials');
            return;
          }
        } else {
          setVerifyingPayment(false);
        }

        // Load memorial data
        await loadMemorial(session.user.id);
        
        // Show share modal after a delay if coming from payment
        if (sessionId) {
          setTimeout(() => {
            setShowShareModal(true);
          }, 2000);
        }
        
      } catch (error) {
        console.error('Error initializing page:', error);
        showToast('An error occurred. Please try refreshing the page.', 'error');
      } finally {
        setIsLoading(false);
        setVerifyingPayment(false);
      }
    };

    initializePage();
  }, [memorialId, sessionId]);

  const verifyPayment = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/stripe/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, memorialId })
      });

      const data = await response.json();
      
      if (!response.ok || !data.verified) {
        console.error('Payment verification failed:', data.error);
        return false;
      }

      showToast('Payment successful! Your memorial is now live.', 'success');
      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  };

  const loadMemorial = async (userId: string) => {
    try {
      const { data: memorialData, error } = await supabase
        .from('memorials')
        .select('*')
        .eq('id', memorialId)
        .eq('user_id', userId)
        .single();

      if (error || !memorialData) {
        console.error('Memorial load error:', error);
        showToast('Memorial not found', 'error');
        router.push('/account/memorials');
        return;
      }

      setMemorial(memorialData);
      
      // If memorial isn't published yet (backup for webhook failure)
      if (memorialData.status !== 'published' && sessionId) {
        await publishMemorial();
      }
    } catch (error) {
      console.error('Error loading memorial:', error);
      showToast('Error loading memorial', 'error');
    }
  };

  const publishMemorial = async () => {
    try {
      const { error } = await supabase
        .from('memorials')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', memorialId);

      if (error) throw error;
      
      // Reload memorial to get updated status
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadMemorial(session.user.id);
      }
    } catch (error) {
      console.error('Error publishing memorial:', error);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(memorialUrl);
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Error copying link:', error);
      showToast('Failed to copy link', 'error');
    }
  };

  const shareOnFacebook = () => {
    const text = `In loving memory of ${memorial?.first_name} ${memorial?.last_name}. Please visit their memorial page to share memories and condolences.`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(memorialUrl)}&quote=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const shareOnTwitter = () => {
    const text = `In loving memory of ${memorial?.first_name} ${memorial?.last_name}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(memorialUrl)}`,
      '_blank'
    );
  };

  const shareViaEmail = () => {
    const subject = `Memorial for ${memorial?.first_name} ${memorial?.last_name}`;
    const body = `I've created a memorial page for ${memorial?.first_name} ${memorial?.last_name}. 

You can view it here: ${memorialUrl}

Please feel free to share memories and leave condolences in the guestbook.`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#003087]/5 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#003087] mx-auto mb-4" />
          <p className="text-gray-600">
            {verifyingPayment ? 'Verifying payment...' : 'Loading memorial...'}
          </p>
        </div>
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#003087]/5 to-white flex items-center justify-center">
        <Card className="max-w-md">
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">Memorial not found</p>
            <Link href="/account/memorials">
              <Button variant="primary">Go to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003087]/5 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
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
        <Card className="overflow-hidden mb-8">
          {/* Cover Photo */}
          <div className="relative h-32 bg-gradient-to-b from-[#003087] to-[#003087]/80">
            {memorial.cover_photo && (
              <img 
                src={memorial.cover_photo} 
                alt="Cover" 
                className="w-full h-full object-cover opacity-80"
              />
            )}
          </div>
          
          {/* Memorial Info */}
          <div className="p-6 -mt-12 relative">
            <div className="flex items-start gap-4">
              {memorial.featured_photo ? (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                  <img 
                    src={memorial.featured_photo} 
                    alt={`${memorial.first_name} ${memorial.last_name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 shadow-md flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1 pt-12">
                <h2 className="text-2xl font-bold text-gray-900">
                  {memorial.first_name} {memorial.middle_name} {memorial.last_name}
                  {memorial.nickname && (
                    <span className="text-xl text-gray-600 ml-2">"{memorial.nickname}"</span>
                  )}
                </h2>
                {memorial.headline && (
                  <p className="text-gray-600 mt-1 italic">"{memorial.headline}"</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
                </p>
                
                {/* Privacy Badge */}
                <div className="mt-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    memorial.privacy === 'public' 
                      ? 'bg-green-100 text-green-800'
                      : memorial.privacy === 'password'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {memorial.privacy === 'public' && '🌐 Public Memorial'}
                    {memorial.privacy === 'password' && '🔒 Password Protected'}
                    {memorial.privacy === 'private' && '👥 Private Memorial'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Memorial URL */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Memorial URL:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white border border-gray-200 rounded text-sm text-[#003087] font-mono">
                  {memorialUrl}
                </code>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={copyLink}
                  icon={Copy}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link href={`/memorials/${memorialId}`}>
                <Button variant="primary" icon={Eye} className="w-full">
                  View Memorial
                </Button>
              </Link>
              
              <Link href={`/memorials/${memorialId}/edit`}>
                <Button variant="secondary" icon={Edit} className="w-full">
                  Edit Memorial
                </Button>
              </Link>
              
              <Button
                variant="secondary"
                onClick={() => setShowShareModal(true)}
                icon={Share2}
                className="w-full"
              >
                Share Memorial
              </Button>
            </div>
          </div>
        </Card>

        {/* What's Next Section */}
        <Card className="mb-8">
          <div className="p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">What's Next?</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#003087]/10 rounded-full flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-[#003087]" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Share with Family & Friends</h4>
                  <p className="text-sm text-gray-600">
                    Let loved ones know about the memorial so they can visit, share memories, and sign the guestbook.
                  </p>
                </div>
              </div>

              {memorial.guestbook_settings?.enabled && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#003087]/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-[#003087]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Monitor the Guestbook</h4>
                    <p className="text-sm text-gray-600">
                      {memorial.guestbook_settings.moderation === 'pre' 
                        ? "You'll receive notifications when visitors leave messages. Review and approve them from your dashboard."
                        : memorial.guestbook_settings.moderation === 'post'
                        ? "Guestbook entries will appear automatically. You can moderate them from your dashboard if needed."
                        : "Visitors can freely share memories and condolences in the guestbook."}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#003087]/10 rounded-full flex items-center justify-center">
                  <Edit className="w-5 h-5 text-[#003087]" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Keep It Updated</h4>
                  <p className="text-sm text-gray-600">
                    You can edit the memorial anytime - add more photos, update service information, or enhance the obituary.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#003087]/10 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#003087]" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Prayer List Feature</h4>
                  <p className="text-sm text-gray-600">
                    Visitors can add {memorial.first_name} to their personal prayer list and receive reminders on important dates.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#003087]/10 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#003087]" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Permanent Preservation</h4>
                  <p className="text-sm text-gray-600">
                    This memorial is permanently preserved and will remain accessible to future generations with no annual fees.
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link href="/account">
                <Button variant="primary" icon={Home} className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Receipt and Support Notice */}
        <div className="text-center space-y-2 text-sm text-gray-600">
          <p>A receipt has been sent to your registered email address.</p>
          <p>
            View your{' '}
            <Link href="/account/billing" className="text-[#003087] hover:underline">
              billing history
            </Link>
            {' '}or contact{' '}
            <Link href="/contact" className="text-[#003087] hover:underline">
              support
            </Link>
            {' '}if you need assistance.
          </p>
        </div>

        {/* Prayer/Blessing */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 italic">
            "Eternal rest grant unto them, O Lord, and let perpetual light shine upon them."
          </p>
        </div>
      </div>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Memorial"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Share this memorial with family and friends so they can visit and leave condolences.
          </p>

          {/* Share URL */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Memorial URL:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={memorialUrl}
                readOnly
                className="flex-1 p-2 bg-white border border-gray-200 rounded text-sm"
              />
              <Button
                variant="secondary"
                size="small"
                onClick={copyLink}
                icon={Copy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-3">
            <Button
              variant="secondary"
              onClick={shareOnFacebook}
              className="w-full justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Share on Facebook
            </Button>
            
            <Button
              variant="secondary"
              onClick={shareOnTwitter}
              className="w-full justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Share on Twitter
            </Button>
            
            <Button
              variant="secondary"
              onClick={shareViaEmail}
              icon={Mail}
              className="w-full justify-center"
            >
              Share via Email
            </Button>
          </div>

          {/* Close Button */}
          <div className="mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowShareModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}