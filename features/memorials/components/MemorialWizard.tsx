'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WizardProgress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { WizardTabs } from '@/components/ui/Tabs';
import { createBrowserClient } from '@/lib/supabase/client';
import clsx from 'clsx';
import type { Memorial, WizardStep, ServiceEvent, DonationInfo, GuestbookSettings, MediaItem } from '@/types/memorial';

// Import all step components
import { BasicInfoStep } from './steps/BasicInfoStep';
import { HeadlineStep } from './steps/HeadlineStep';
import { ObituaryStep } from './steps/ObituaryStep';
import { ServiceStep } from './steps/ServiceStep';
import { DonationStep } from './steps/DonationStep';
import { GalleryStep } from './steps/GalleryStep';
import { GuestbookStep } from './steps/GuestbookStep';
import { PrivacyStep } from './steps/PrivacyStep';
import { ReviewStep } from './steps/ReviewStep';

// Step configuration
const WIZARD_STEPS = [
  { id: 'basic-info', title: 'Basic Info', required: true },
  { id: 'headline', title: 'Headline', required: true },
  { id: 'obituary', title: 'Obituary', required: true },
  { id: 'service', title: 'Service Info', required: false },
  { id: 'donation', title: 'Donations', required: false },
  { id: 'gallery', title: 'Gallery', required: false },
  { id: 'guestbook', title: 'Guestbook', required: true },
  { id: 'privacy', title: 'Privacy', required: true },
  { id: 'review', title: 'Review & Pay', required: true },
];

interface MemorialWizardProps {
  memorialId?: string; // For editing existing memorial
  initialData?: Partial<Memorial>;
}

export function MemorialWizard({ memorialId: propMemorialId, initialData }: MemorialWizardProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const { showToast } = useToast();
  
  // Auto-save refs
  const autoSaveTimer = useRef<NodeJS.Timeout>();
  const lastSavedData = useRef<string>('');
  const saveStatusTimer = useRef<NodeJS.Timeout>();

  // Memorial ID state (can be set from prop or after creation)
  const [memorialId, setMemorialId] = useState<string | undefined>(propMemorialId);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errorSteps, setErrorSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');
  const [lastSaveTime, setLastSaveTime] = useState<string>('');

  // Memorial data state with proper typing
  const [memorialData, setMemorialData] = useState<Partial<Memorial>>({
    status: 'draft',
    privacy: 'public',
    guestbookEnabled: true,
    guestbookModeration: 'pre',
    services: [],
    gallery: [],
    ...initialData,
  });

  // Step validation state
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});

  // Create memorial if needed on mount
  useEffect(() => {
    const initializeMemorial = async () => {
      if (!propMemorialId && !memorialId) {
        // Check for existing drafts first
        try {
          const response = await fetch('/api/memorials/create', {
            method: 'GET',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.has_drafts && data.drafts.length > 0) {
              // Ask user if they want to continue with existing draft
              const continueDraft = window.confirm(
                `You have ${data.drafts.length} draft memorial(s). Would you like to continue with the most recent one?`
              );
              
              if (continueDraft) {
                const mostRecent = data.drafts[0];
                setMemorialId(mostRecent.id);
                router.replace(`/memorials/new?id=${mostRecent.id}`);
                return;
              }
            }
          }
        } catch (err) {
          console.error('Error checking drafts:', err);
        }
        
        // Create new memorial
        await createNewMemorial();
      } else if (propMemorialId) {
        // Load existing memorial
        await loadMemorial(propMemorialId);
      }
    };
    
    initializeMemorial();
  }, []);

  // Create new memorial via API
  const createNewMemorial = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/memorials/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body for new memorial
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create memorial');
      }

      const data = await response.json();
      setMemorialId(data.memorial_id);
      
      // Initialize memorial data with ID
      setMemorialData(prev => ({
        ...prev,
        id: data.memorial_id
      }));
      
      router.replace(`/memorials/new?id=${data.memorial_id}`);
      showToast('Memorial created. Let\'s begin creating their tribute.', 'success');
    } catch (err) {
      console.error('Error creating memorial:', err);
      showToast('Failed to create memorial. Please try again.', 'error');
      router.push('/account');
    } finally {
      setIsLoading(false);
    }
  };

  // Load memorial data via API
  const loadMemorial = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/memorials/${id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load memorial');
      }

      const data = await response.json();
      
      // Transform API data to component format
      const transformedData: Partial<Memorial> = {
        id: data.id,
        firstName: data.first_name,
        middleName: data.middle_name,
        lastName: data.last_name,
        nickname: data.nickname,
        birthDate: data.date_of_birth,
        deathDate: data.date_of_death,
        birthPlace: data.birth_place,
        deathPlace: data.death_place,
        featuredImage: data.featured_photo,
        coverPhoto: data.cover_photo,
        headline: data.headline,
        obituary: data.obituary,
        services: data.services || [],
        donationType: data.donation_type,
        donationUrl: data.donation_url,
        gallery: data.gallery || [],
        guestbookEnabled: data.guestbook_enabled,
        guestbookModeration: data.guestbook_moderation,
        privacy: data.privacy,
        password: data.password,
        customUrl: data.custom_url,
        status: data.status,
      };
      
      setMemorialData(transformedData);
      lastSavedData.current = JSON.stringify(transformedData);
      
      // Set current step and completed steps
      if (data.current_step) {
        setCurrentStep(data.current_step - 1); // API uses 1-based indexing
      }
      if (data.completed_steps) {
        setCompletedSteps(data.completed_steps.map((s: number) => s - 1)); // Convert to 0-based
      }
    } catch (err) {
      console.error('Error loading memorial:', err);
      showToast('Failed to load memorial. Please try refreshing the page.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save functionality via API
  useEffect(() => {
    if (!memorialId) return;
    
    const currentDataString = JSON.stringify(memorialData);
    
    // Don't save if data hasn't changed
    if (currentDataString === lastSavedData.current) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Set new timer for auto-save (debounced)
    autoSaveTimer.current = setTimeout(() => {
      autoSaveViaAPI();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [memorialData, memorialId, currentStep]);

  // Auto-save function using API
  const autoSaveViaAPI = async () => {
    if (isSaving || !memorialId) return;
    
    setIsSaving(true);
    try {
      // Prepare step data based on current step
      const stepData = prepareStepData(currentStep);
      
      const response = await fetch(`/api/memorials/${memorialId}/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: currentStep + 1, // API uses 1-based indexing
          data: stepData,
          completed: validateStep(currentStep),
        }),
      });

      if (!response.ok) {
        // Don't show error for rate limiting
        if (response.status !== 429) {
          throw new Error('Auto-save failed');
        }
      } else {
        const result = await response.json();
        if (result.success) {
          lastSavedData.current = JSON.stringify(memorialData);
          setLastSaveTime(new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      console.error('Auto-save error:', err);
      // Silent fail for auto-save
    } finally {
      setIsSaving(false);
    }
  };

  // Prepare step data for API
  const prepareStepData = (stepIndex: number) => {
    const step = WIZARD_STEPS[stepIndex];
    
    switch (step.id) {
      case 'basic-info':
        return {
          firstName: memorialData.firstName,
          middleName: memorialData.middleName,
          lastName: memorialData.lastName,
          nickname: memorialData.nickname,
          dateOfBirth: memorialData.birthDate,
          dateOfDeath: memorialData.deathDate,
          birthPlace: memorialData.birthPlace,
          deathPlace: memorialData.deathPlace,
          featuredPhotoUrl: memorialData.featuredImage,
          coverPhotoUrl: memorialData.coverPhoto,
        };
      case 'headline':
        return {
          headline: memorialData.headline,
        };
      case 'obituary':
        return {
          obituary: memorialData.obituary,
        };
      case 'service':
        return memorialData.services || [];
      case 'donation':
        return {
          donationType: memorialData.donationType,
          donationUrl: memorialData.donationUrl,
        };
      case 'gallery':
        return memorialData.gallery || [];
      case 'guestbook':
        return {
          guestbookEnabled: memorialData.guestbookEnabled,
          guestbookModeration: memorialData.guestbookModeration,
        };
      case 'privacy':
        return {
          privacy: memorialData.privacy,
          password: memorialData.password,
          customUrl: memorialData.customUrl,
        };
      default:
        return {};
    }
  };

  // Manual save via API
  const saveMemorial = async () => {
    if (!memorialId) return;
    
    setIsSaving(true);
    try {
      // Prepare full update data
      const updateData = {
        first_name: memorialData.firstName,
        middle_name: memorialData.middleName,
        last_name: memorialData.lastName,
        nickname: memorialData.nickname,
        date_of_birth: memorialData.birthDate,
        date_of_death: memorialData.deathDate,
        birth_place: memorialData.birthPlace,
        death_place: memorialData.deathPlace,
        featured_photo: memorialData.featuredImage,
        cover_photo: memorialData.coverPhoto,
        headline: memorialData.headline,
        obituary: memorialData.obituary,
        donation_type: memorialData.donationType,
        donation_url: memorialData.donationUrl,
        guestbook_enabled: memorialData.guestbookEnabled,
        guestbook_moderation: memorialData.guestbookModeration,
        privacy: memorialData.privacy,
        password: memorialData.password,
        custom_url: memorialData.customUrl,
        current_step: currentStep + 1,
        completed_steps: completedSteps.map(s => s + 1), // Convert to 1-based
        services: memorialData.services,
        gallery: memorialData.gallery,
      };

      const response = await fetch(`/api/memorials/${memorialId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save memorial');
      }

      const result = await response.json();
      lastSavedData.current = JSON.stringify(memorialData);
      showToast('Memorial saved successfully', 'success');
      return true;
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save memorial. Please try again.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return JSON.stringify(memorialData) !== lastSavedData.current;
  };

  // Check for unsaved changes before navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [memorialData]);

  // Validate current step
  const validateStep = (stepIndex: number): boolean => {
    const step = WIZARD_STEPS[stepIndex];
    
    switch (step.id) {
      case 'basic-info':
        return !!(
          memorialData.firstName &&
          memorialData.lastName &&
          memorialData.birthDate &&
          memorialData.deathDate
        );
      case 'headline':
        return !!(memorialData.headline && memorialData.headline.length >= 10);
      case 'obituary':
        return !!(memorialData.obituary && memorialData.obituary.length >= 50);
      case 'service':
        return true; // Optional step
      case 'donation':
        return true; // Optional step
      case 'gallery':
        return true; // Optional step
      case 'guestbook':
        return memorialData.guestbookEnabled !== undefined;
      case 'privacy':
        return !!(memorialData.privacy);
      case 'review':
        // Check all required steps are complete
        return WIZARD_STEPS
          .filter(s => s.required)
          .every((s, i) => completedSteps.includes(i) || validateStep(i));
      default:
        return false;
    }
  };

  // Handle step navigation
  const goToStep = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= WIZARD_STEPS.length) return;
    
    // Validate current step before moving forward
    if (stepIndex > currentStep) {
      const isValid = validateStep(currentStep);
      if (!isValid && WIZARD_STEPS[currentStep].required) {
        showToast('Please complete all required fields before continuing', 'error');
        setErrorSteps([...errorSteps, currentStep]);
        return;
      }
      
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      
      // Remove from error steps if it was there
      setErrorSteps(errorSteps.filter(s => s !== currentStep));
    }
    
    setCurrentStep(stepIndex);
    setMobileView('form'); // Reset to form view when changing steps
    
    // Trigger save when changing steps
    if (memorialId) {
      autoSaveViaAPI();
    }
  };

  // Handle next step
  const handleNext = () => {
    goToStep(currentStep + 1);
  };

  // Handle previous step
  const handlePrevious = () => {
    goToStep(currentStep - 1);
  };

  // Handle step click from progress indicator
  const handleStepClick = (stepIndex: number) => {
    // Only allow navigation to previous steps or completed steps
    if (stepIndex < currentStep || completedSteps.includes(stepIndex)) {
      goToStep(stepIndex);
    }
  };

  // Handle edit from review step
  const handleEdit = (stepIndex: number) => {
    goToStep(stepIndex);
  };

  // Update memorial data
  const updateMemorialData = (stepData: Partial<Memorial>) => {
    setMemorialData(prev => ({
      ...prev,
      ...stepData,
    }));
  };

  // Handle exit
  const handleExit = () => {
    if (hasUnsavedChanges()) {
      setShowExitConfirm(true);
    } else {
      router.push('/account');
    }
  };

  // Confirm exit with unsaved changes
  const confirmExit = async () => {
    // Save before exiting
    const saved = await saveMemorial();
    if (saved) {
      router.push('/account');
    }
  };

  // Render current step component
  const renderStep = () => {
    const stepProps = {
      data: memorialData,
      updateData: updateMemorialData,
      onNext: handleNext,
      onPrevious: handlePrevious,
      isFirstStep: currentStep === 0,
      isLastStep: currentStep === WIZARD_STEPS.length - 1,
    };

    switch (WIZARD_STEPS[currentStep].id) {
      case 'basic-info':
        return <BasicInfoStep {...stepProps} />;
      case 'headline':
        return <HeadlineStep {...stepProps} />;
      case 'obituary':
        return <ObituaryStep {...stepProps} />;
      case 'service':
        return <ServiceStep {...stepProps} />;
      case 'donation':
        return <DonationStep {...stepProps} />;
      case 'gallery':
        return <GalleryStep {...stepProps} />;
      case 'guestbook':
        return <GuestbookStep {...stepProps} />;
      case 'privacy':
        return <PrivacyStep {...stepProps} />;
      case 'review':
        return (
          <ReviewStep 
            data={memorialData}
            updateData={updateMemorialData}
            onPrevious={handlePrevious}
            onEdit={handleEdit}
          />
        );
      default:
        return null;
    }
  };

  // Render preview
  const renderPreview = () => {
    const calculateAge = () => {
      if (!memorialData.birthDate || !memorialData.deathDate) return null;
      const birth = new Date(memorialData.birthDate);
      const death = new Date(memorialData.deathDate);
      const age = Math.floor((death.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return age;
    };

    const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const age = calculateAge();

    return (
      <div className="sticky top-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-b from-[#003087] to-[#003087]/80 relative">
            {memorialData.coverPhoto ? (
              <img 
                src={memorialData.coverPhoto} 
                alt="Cover" 
                className="w-full h-full object-cover opacity-90"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white/50">Cover photo will appear here</span>
              </div>
            )}
          </div>
          
          {/* Featured Photo & Basic Info */}
          <div className="p-6 -mt-12 relative">
            {memorialData.featuredImage ? (
              <div className="w-24 h-24 rounded-full border-4 border-white bg-white mb-4 overflow-hidden shadow-md">
                <img 
                  src={memorialData.featuredImage} 
                  alt={`${memorialData.firstName} ${memorialData.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 mb-4 flex items-center justify-center shadow-md">
                <span className="text-gray-400 text-xs">Photo</span>
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-gray-900">
              {memorialData.firstName || 'First'} {memorialData.middleName} {memorialData.lastName || 'Last'}
              {memorialData.nickname && (
                <span className="text-xl text-gray-600 ml-2">"{memorialData.nickname}"</span>
              )}
            </h2>
            
            {memorialData.birthDate && memorialData.deathDate && (
              <p className="text-gray-600 mt-2">
                {formatDate(memorialData.birthDate)} - {formatDate(memorialData.deathDate)}
                {age !== null && ` • Age ${age}`}
              </p>
            )}
            
            {memorialData.birthPlace && memorialData.deathPlace && (
              <p className="text-sm text-gray-500 mt-1">
                Born in {memorialData.birthPlace} • Passed in {memorialData.deathPlace}
              </p>
            )}
            
            {memorialData.headline && (
              <p className="text-xl text-gray-700 mt-4 font-medium italic">
                "{memorialData.headline}"
              </p>
            )}
            
            {memorialData.obituary && (
              <div className="mt-6 prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold mb-2">Obituary</h3>
                <p className="text-gray-700 whitespace-pre-wrap line-clamp-6">
                  {memorialData.obituary}
                </p>
              </div>
            )}
            
            {memorialData.services && memorialData.services.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Service Information</h3>
                <div className="space-y-2">
                  {memorialData.services.slice(0, 2).map((service, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      <span className="font-medium capitalize">{service.type}:</span> {service.location}
                      <br />
                      <span className="text-xs text-gray-500">
                        {formatDate(service.date)} at {service.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {memorialData.gallery && memorialData.gallery.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Gallery</h3>
                <div className="grid grid-cols-3 gap-2">
                  {memorialData.gallery.slice(0, 6).map((item, index) => (
                    <div key={index} className="aspect-square bg-gray-200 rounded overflow-hidden">
                      {item.type === 'photo' ? (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400 text-xs">Video</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {memorialData.gallery.length > 6 && (
                  <p className="text-sm text-gray-500 mt-2">
                    +{memorialData.gallery.length - 6} more items
                  </p>
                )}
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                This is a preview of your memorial page. The final version may look slightly different.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003087] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading memorial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold">
              Create Memorial
            </h1>
            
            <div className="flex items-center gap-4">
              {isSaving && (
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                  Saving...
                </span>
              )}
              
              {!isSaving && lastSaveTime && (
                <span className="text-sm text-gray-500">
                  Saved at {lastSaveTime}
                </span>
              )}
              
              <Button
                variant="ghost"
                size="small"
                onClick={handleExit}
                disabled={isSaving}
              >
                Save & Exit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WizardProgress
            currentStep={currentStep}
            totalSteps={WIZARD_STEPS.length}
            stepTitles={WIZARD_STEPS.map(s => s.title)}
            onStepClick={handleStepClick}
            completedSteps={completedSteps}
            errorSteps={errorSteps}
            allowNavigation={true}
          />
        </div>
      </div>

      {/* Mobile tab navigation */}
      <div className="md:hidden">
        <WizardTabs
          activeTab={mobileView}
          onChange={setMobileView}
          currentStep={currentStep + 1}
          totalSteps={WIZARD_STEPS.length}
          hasErrors={errorSteps.includes(currentStep)}
        />
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form section */}
          <div className={clsx(
            'md:block',
            mobileView === 'preview' && 'hidden'
          )}>
            {renderStep()}
          </div>

          {/* Preview section */}
          <div className={clsx(
            'md:block',
            mobileView === 'form' && 'hidden'
          )}>
            {renderPreview()}
          </div>
        </div>
      </div>

      {/* Exit confirmation modal */}
      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={confirmExit}
        title="Save before leaving?"
        message="You have unsaved changes. Would you like to save them before exiting?"
        confirmText="Save & Exit"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
}

// Export step validation helper for use in individual steps
export function useStepValidation(stepId: string) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: any, rules: any) => {
    // Validation logic here
    if (rules.required && !value) {
      return `${name} is required`;
    }
    if (rules.minLength && value && value.length < rules.minLength) {
      return `${name} must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value && value.length > rules.maxLength) {
      return `${name} must be less than ${rules.maxLength} characters`;
    }
    if (rules.pattern && value && !rules.pattern.test(value)) {
      return `${name} format is invalid`;
    }
    return '';
  };

  const setFieldTouched = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const isValid = Object.values(errors).every(error => !error);

  return {
    errors,
    touched,
    setErrors,
    setFieldTouched,
    validateField,
    isValid,
  };
}