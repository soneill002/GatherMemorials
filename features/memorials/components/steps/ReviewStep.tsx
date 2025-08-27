'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { 
  Check,
  Edit2,
  CreditCard,
  Eye,
  Shield,
  Clock,
  AlertCircle,
  Info,
  ChevronRight,
  User,
  Calendar,
  FileText,
  Church,
  Heart,
  Image as ImageIcon,
  MessageSquare,
  Lock,
  Globe,
  DollarSign,
  Loader2,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Memorial, ServiceType, DonationType, PrivacySetting } from '@/types/memorial';
import clsx from 'clsx';

interface ReviewStepProps {
  data: Memorial;
  updateData: (updates: Partial<Memorial>) => void;
  onPrevious: () => void;
  onEdit: (step: number) => void;
  errors?: Record<string, string>;
}

// Section configuration for review
const reviewSections = [
  { 
    id: 'basic', 
    title: 'Basic Information', 
    icon: User, 
    step: 1,
    fields: ['firstName', 'lastName', 'birthDate', 'deathDate', 'featuredImage']
  },
  { 
    id: 'headline', 
    title: 'Headline', 
    icon: FileText, 
    step: 2,
    fields: ['headline']
  },
  { 
    id: 'obituary', 
    title: 'Obituary', 
    icon: FileText, 
    step: 3,
    fields: ['obituary']
  },
  { 
    id: 'services', 
    title: 'Service Information', 
    icon: Church, 
    step: 4,
    fields: ['services']
  },
  { 
    id: 'donations', 
    title: 'Memorial Donations', 
    icon: Heart, 
    step: 5,
    fields: ['donationType', 'donationUrl']
  },
  { 
    id: 'gallery', 
    title: 'Photo & Video Gallery', 
    icon: ImageIcon, 
    step: 6,
    fields: ['gallery']
  },
  { 
    id: 'guestbook', 
    title: 'Guestbook', 
    icon: MessageSquare, 
    step: 7,
    fields: ['guestbookEnabled']
  },
  { 
    id: 'privacy', 
    title: 'Privacy & Sharing', 
    icon: Lock, 
    step: 8,
    fields: ['privacy', 'customUrl']
  }
];

// Format date for display
const formatDate = (date: string | undefined) => {
  if (!date) return '';
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Calculate age
const calculateAge = (birthDate: string | undefined, deathDate: string | undefined) => {
  if (!birthDate || !deathDate) return null;
  const birth = new Date(birthDate);
  const death = new Date(deathDate);
  const age = Math.floor((death.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return age;
};

export function ReviewStep({
  data,
  updateData,
  onPrevious,
  onEdit,
  errors = {}
}: ReviewStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { showToast } = useToast();

  // Check if a section is complete
  const isSectionComplete = (section: typeof reviewSections[0]): boolean => {
    for (const field of section.fields) {
      const value = data[field as keyof Memorial];
      
      // Special handling for arrays
      if (field === 'services' || field === 'gallery') {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          // These are optional, so empty is complete
          continue;
        }
      }
      
      // Special handling for optional fields
      if (field === 'donationType' || field === 'donationUrl') {
        // Donations are optional
        continue;
      }
      
      // Check required fields
      if (section.id === 'basic' || section.id === 'headline' || section.id === 'obituary' || section.id === 'privacy') {
        if (!value) return false;
      }
    }
    return true;
  };

  // Check if all sections are complete
  const isComplete = reviewSections.every(section => isSectionComplete(section));

  // Calculate completion percentage
  const completionPercentage = Math.round(
    (reviewSections.filter(section => isSectionComplete(section)).length / reviewSections.length) * 100
  );

  // Handle checkout
  const handleCheckout = async () => {
    if (!isComplete) {
      showToast('Please complete all required sections before checkout', 'error');
      return;
    }
    
    if (!agreedToTerms) {
      showToast('Please agree to the terms and conditions', 'error');
      return;
    }

    setShowPaymentModal(true);
  };

  // Process payment (mock - would integrate with Stripe)
  const processPayment = async () => {
    setIsProcessing(true);
    
    // Mock payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setShowPaymentModal(false);
      updateData({ status: 'published', publishedAt: new Date().toISOString() });
      showToast('Payment successful! Your memorial is now live.', 'success');
      
      // Redirect to success page
      window.location.href = `/memorials/${data.customUrl}/success`;
    }, 3000);
  };

  // Get privacy icon
  const getPrivacyIcon = () => {
    switch (data.privacy) {
      case 'public': return Globe;
      case 'private': return Lock;
      case 'password': return Shield;
      default: return Lock;
    }
  };

  const PrivacyIcon = getPrivacyIcon();

  // Get service type label
  const getServiceTypeLabel = (type: ServiceType) => {
    const labels = {
      'visitation': 'Visitation/Wake',
      'funeral': 'Funeral Mass',
      'burial': 'Burial',
      'celebration': 'Celebration of Life'
    };
    return labels[type] || type;
  };

  // Get donation type label
  const getDonationTypeLabel = (type: DonationType) => {
    const labels = {
      'charity': 'Charity Organization',
      'parish': 'Church/Parish',
      'gofundme': 'GoFundMe',
      'other': 'Other Organization'
    };
    return labels[type] || type;
  };

  const age = calculateAge(data.birthDate, data.deathDate);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Review & Checkout
        </h2>
        <p className="text-gray-600">
          Review your memorial details and proceed to payment to publish.
        </p>
      </div>

      {/* Completion Status */}
      <Card className={clsx(
        "border-2",
        isComplete ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Memorial Completion
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isComplete 
                  ? "Your memorial is ready for publishing!"
                  : "Please complete all required sections"}
              </p>
            </div>
            <div className="text-center">
              <div className={clsx(
                "text-3xl font-bold",
                isComplete ? "text-green-600" : "text-amber-600"
              )}>
                {completionPercentage}%
              </div>
              <p className="text-xs text-gray-500">Complete</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={clsx(
                "h-2 rounded-full transition-all",
                isComplete ? "bg-green-500" : "bg-amber-500"
              )}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Review Sections */}
      <div className="space-y-4">
        {reviewSections.map((section) => {
          const isComplete = isSectionComplete(section);
          const Icon = section.icon;
          
          return (
            <Card key={section.id} className={clsx(
              "transition-colors",
              !isComplete && "bg-amber-50 border-amber-200"
            )}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={clsx(
                      "p-2 rounded-lg",
                      isComplete ? "bg-green-100" : "bg-amber-100"
                    )}>
                      <Icon className={clsx(
                        "w-5 h-5",
                        isComplete ? "text-green-600" : "text-amber-600"
                      )} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {section.title}
                        </h3>
                        {isComplete ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      
                      {/* Section summary */}
                      <div className="mt-2 text-sm text-gray-600">
                        {section.id === 'basic' && data.firstName && (
                          <p>
                            {data.firstName} {data.middleName} {data.lastName}
                            {data.nickname && ` "${data.nickname}"`}
                            <br />
                            {formatDate(data.birthDate)} - {formatDate(data.deathDate)}
                            {age !== null && ` (Age ${age})`}
                          </p>
                        )}
                        
                        {section.id === 'headline' && data.headline && (
                          <p className="italic">"{data.headline}"</p>
                        )}
                        
                        {section.id === 'obituary' && data.obituary && (
                          <p>{data.obituary.substring(0, 100)}...</p>
                        )}
                        
                        {section.id === 'services' && (
                          <p>
                            {data.services?.length 
                              ? `${data.services.length} service(s) scheduled`
                              : 'No services added'}
                          </p>
                        )}
                        
                        {section.id === 'donations' && (
                          <p>
                            {data.donationType 
                              ? `${getDonationTypeLabel(data.donationType)} donation link added`
                              : 'No donation information'}
                          </p>
                        )}
                        
                        {section.id === 'gallery' && (
                          <p>
                            {data.gallery?.length 
                              ? `${data.gallery.length} photo(s)/video(s) added`
                              : 'No gallery items'}
                          </p>
                        )}
                        
                        {section.id === 'guestbook' && (
                          <p>
                            {data.guestbookEnabled 
                              ? `Enabled with ${data.guestbookModeration || 'pre'}-moderation`
                              : 'Guestbook disabled'}
                          </p>
                        )}
                        
                        {section.id === 'privacy' && data.privacy && (
                          <div className="flex items-center gap-2">
                            <PrivacyIcon className="w-4 h-4" />
                            <span className="capitalize">{data.privacy} memorial</span>
                            {data.customUrl && (
                              <span className="text-gray-500">
                                • gathermemorials.com/memorial/{data.customUrl}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {!isComplete && (
                          <p className="text-amber-600 font-medium mt-1">
                            This section needs to be completed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    onClick={() => onEdit(section.step)}
                    icon={Edit2}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Preview Button */}
      <Card className="bg-gray-50">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Preview Memorial</h3>
              <p className="text-sm text-gray-600 mt-1">
                See exactly how your memorial will appear to visitors
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              icon={Eye}
              onClick={() => setShowPreview(true)}
            >
              Full Preview
            </Button>
          </div>
        </div>
      </Card>

      {/* Pricing Card */}
      <Card className="bg-gradient-to-r from-marianBlue to-blue-600 text-white">
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold mb-2">
                Complete Memorial Package
              </h3>
              <ul className="space-y-2 text-sm opacity-90">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Lifetime memorial page (no annual fees)
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Unlimited visitors and guestbook entries
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Photo & video gallery (up to 50 items)
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Custom URL and privacy controls
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Edit anytime after publishing
                </li>
              </ul>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">$149</div>
              <p className="text-sm opacity-75">One-time payment</p>
              <p className="text-xs opacity-75 mt-2">No hidden fees</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Terms Agreement */}
      <Card>
        <div className="p-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-marianBlue border-gray-300 rounded focus:ring-marianBlue"
            />
            <div className="ml-3">
              <span className="text-sm text-gray-700">
                I agree to the{' '}
                <a href="/terms" target="_blank" className="text-marianBlue hover:underline">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" className="text-marianBlue hover:underline">
                  Privacy Policy
                </a>
              </span>
            </div>
          </label>
        </div>
      </Card>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-600" />
          <span>Secure checkout</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-green-600" />
          <span>SSL encrypted</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-green-600" />
          <span>Powered by Stripe</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onPrevious}
        >
          Back to Privacy
        </Button>
        
        <Button
          type="button"
          variant="primary"
          size="large"
          onClick={handleCheckout}
          disabled={!isComplete || !agreedToTerms}
          icon={CreditCard}
        >
          Proceed to Checkout
        </Button>
      </div>

      {/* Payment Modal (simplified - would use Stripe Elements) */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => !isProcessing && setShowPaymentModal(false)}
        title="Complete Your Purchase"
        size="medium"
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Memorial for {data.firstName} {data.lastName}</span>
              <span className="font-bold text-lg">$149.00</span>
            </div>
          </div>

          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              You will be redirected to Stripe for secure payment processing
            </p>
            
            {/* Mock Stripe payment form */}
            <div className="bg-gray-100 p-8 rounded-lg">
              <p className="text-sm text-gray-500">
                [Stripe Checkout would appear here]
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPaymentModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={processPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Complete Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal (simplified) */}
      {showPreview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Memorial Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center py-12 text-gray-500">
              [Full memorial preview would render here]
            </div>
          </div>
        </div>
      )}
    </div>
  );
}