'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';

// Simplified Memorial Wizard Component (all-in-one)
function SimpleMemorialWizard({ memorialId: editId }: { memorialId?: string | null }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [memorialId, setMemorialId] = useState<string | null>(editId || null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    first_name: '',
    middle_name: '',
    last_name: '',
    nickname: '',
    date_of_birth: '',
    date_of_death: '',
    
    // Step 2: Headline
    headline: '',
    
    // Step 3: Obituary
    obituary: '',
    
    // Step 4: Service Info
    service_date: '',
    service_time: '',
    service_location: '',
    
    // Step 5: Donations
    donation_org: '',
    donation_url: '',
    
    // Step 6: Gallery
    gallery_enabled: true,
    
    // Step 7: Guestbook
    guestbook_enabled: true,
    guestbook_moderation: true,
    
    // Step 8: Privacy
    privacy_setting: 'public' as 'public' | 'private' | 'password',
    password: '',
    
    // System fields
    status: 'draft' as 'draft' | 'published',
  });

  const steps = [
    { id: 1, name: 'Basic Info', required: true },
    { id: 2, name: 'Headline', required: true },
    { id: 3, name: 'Obituary', required: true },
    { id: 4, name: 'Service', required: false },
    { id: 5, name: 'Donations', required: false },
    { id: 6, name: 'Gallery', required: false },
    { id: 7, name: 'Guestbook', required: true },
    { id: 8, name: 'Privacy', required: true },
    { id: 9, name: 'Review', required: true },
  ];

  // Load memorial if editing
  useEffect(() => {
    if (editId) {
      loadMemorial(editId);
    } else {
      // Create a new memorial draft
      createNewMemorial();
    }
  }, [editId]);

  const createNewMemorial = async () => {
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/signin?redirect=/memorials/new');
        return;
      }

      // Create a new memorial record
      const { data, error } = await supabase
        .from('memorials')
        .insert({
          user_id: user.id,
          status: 'draft',
          first_name: '',
          last_name: '',
          headline: '',
          privacy_setting: 'public',
          guestbook_enabled: true,
          guestbook_moderation: true,
          gallery_enabled: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating memorial:', error);
        return;
      }

      if (data) {
        setMemorialId(data.id);
        // Update URL to include the memorial ID
        router.replace(`/memorials/new?id=${data.id}`);
      }
    } catch (error) {
      console.error('Error creating memorial:', error);
    }
  };

  const loadMemorial = async (id: string) => {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('memorials')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading memorial:', error);
        return;
      }

      if (data) {
        setFormData({
          first_name: data.first_name || '',
          middle_name: data.middle_name || '',
          last_name: data.last_name || '',
          nickname: data.nickname || '',
          date_of_birth: data.date_of_birth || '',
          date_of_death: data.date_of_death || '',
          headline: data.headline || '',
          obituary: data.obituary || '',
          service_date: data.service_date || '',
          service_time: data.service_time || '',
          service_location: data.service_location || '',
          donation_org: data.donation_org || '',
          donation_url: data.donation_url || '',
          gallery_enabled: data.gallery_enabled ?? true,
          guestbook_enabled: data.guestbook_enabled ?? true,
          guestbook_moderation: data.guestbook_moderation ?? true,
          privacy_setting: data.privacy_setting || 'public',
          password: '',
          status: data.status || 'draft',
        });
        setMemorialId(id);
      }
    } catch (error) {
      console.error('Error loading memorial:', error);
    }
  };

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.first_name) newErrors.first_name = 'First name is required';
        if (!formData.last_name) newErrors.last_name = 'Last name is required';
        if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
        if (!formData.date_of_death) newErrors.date_of_death = 'Date of death is required';
        break;
      case 2:
        if (!formData.headline || formData.headline.length < 10) {
          newErrors.headline = 'Headline must be at least 10 characters';
        }
        break;
      case 3:
        if (!formData.obituary || formData.obituary.length < 50) {
          newErrors.obituary = 'Obituary must be at least 50 characters';
        }
        break;
      case 8:
        if (formData.privacy_setting === 'password' && !formData.password) {
          newErrors.password = 'Password is required for password-protected memorials';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;
    
    // Save current step data
    await saveProgress();
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveProgress = async () => {
    if (!memorialId) return;
    
    setIsSaving(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('memorials')
        .update(formData)
        .eq('id', memorialId);

      if (error) {
        console.error('Error saving memorial:', error);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!memorialId) return;
    
    setIsSaving(true);
    try {
      // Update status to published
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('memorials')
        .update({ ...formData, status: 'published' })
        .eq('id', memorialId);

      if (error) {
        console.error('Error publishing memorial:', error);
        return;
      }

      // Redirect to payment or success page
      router.push(`/memorials/${memorialId}/success`);
    } catch (error) {
      console.error('Error publishing:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
            <p className="text-gray-600">Let's start with some basic information about your loved one.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.middle_name}
                  onChange={(e) => handleInputChange('middle_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nickname
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date_of_birth && (
                  <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Death *
                </label>
                <input
                  type="date"
                  value={formData.date_of_death}
                  onChange={(e) => handleInputChange('date_of_death', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.date_of_death ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date_of_death && (
                  <p className="mt-1 text-sm text-red-600">{errors.date_of_death}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Memorial Headline</h2>
            <p className="text-gray-600">Write a brief, meaningful headline that captures the essence of their life.</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headline *
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => handleInputChange('headline', e.target.value)}
                placeholder="e.g., Loving Father, Devoted Husband, and Friend to All"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.headline ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={100}
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.headline.length}/100 characters
              </p>
              {errors.headline && (
                <p className="mt-1 text-sm text-red-600">{errors.headline}</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Obituary</h2>
            <p className="text-gray-600">Share their story, accomplishments, and what made them special.</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Obituary Text *
              </label>
              <textarea
                value={formData.obituary}
                onChange={(e) => handleInputChange('obituary', e.target.value)}
                rows={12}
                placeholder="Tell their story..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.obituary ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.obituary.length} characters (minimum 50)
              </p>
              {errors.obituary && (
                <p className="mt-1 text-sm text-red-600">{errors.obituary}</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Service Information</h2>
            <p className="text-gray-600">Add details about memorial services (optional).</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Date
                </label>
                <input
                  type="date"
                  value={formData.service_date}
                  onChange={(e) => handleInputChange('service_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Time
                </label>
                <input
                  type="time"
                  value={formData.service_time}
                  onChange={(e) => handleInputChange('service_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.service_location}
                  onChange={(e) => handleInputChange('service_location', e.target.value)}
                  placeholder="e.g., St. Mary's Church, 123 Main St, City, State"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Memorial Donations</h2>
            <p className="text-gray-600">Add information about memorial donations (optional).</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={formData.donation_org}
                  onChange={(e) => handleInputChange('donation_org', e.target.value)}
                  placeholder="e.g., American Cancer Society"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Link
                </label>
                <input
                  type="url"
                  value={formData.donation_url}
                  onChange={(e) => handleInputChange('donation_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Photo Gallery</h2>
            <p className="text-gray-600">Enable a photo gallery for this memorial.</p>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.gallery_enabled}
                  onChange={(e) => handleInputChange('gallery_enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Enable photo gallery</span>
              </label>
              
              {formData.gallery_enabled && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-700">
                    You'll be able to upload photos after creating the memorial.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Guestbook Settings</h2>
            <p className="text-gray-600">Allow visitors to leave messages and condolences.</p>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.guestbook_enabled}
                  onChange={(e) => handleInputChange('guestbook_enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Enable guestbook</span>
              </label>
              
              {formData.guestbook_enabled && (
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.guestbook_moderation}
                    onChange={(e) => handleInputChange('guestbook_moderation', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">Require approval before messages are displayed</span>
                </label>
              )}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Privacy Settings</h2>
            <p className="text-gray-600">Control who can view this memorial.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Memorial Visibility
                </label>
                <select
                  value={formData.privacy_setting}
                  onChange={(e) => handleInputChange('privacy_setting', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">Public - Anyone can view</option>
                  <option value="private">Private - Only you can view</option>
                  <option value="password">Password Protected</option>
                </select>
              </div>

              {formData.privacy_setting === 'password' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter a password"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Review & Publish</h2>
            <p className="text-gray-600">Review your memorial before publishing.</p>
            
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-gray-900">Memorial Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">
                    {formData.first_name} {formData.middle_name} {formData.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dates:</span>
                  <span className="font-medium">
                    {formData.date_of_birth} - {formData.date_of_death}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Privacy:</span>
                  <span className="font-medium capitalize">{formData.privacy_setting}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guestbook:</span>
                  <span className="font-medium">
                    {formData.guestbook_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gallery:</span>
                  <span className="font-medium">
                    {formData.gallery_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> After publishing, you'll be redirected to complete payment for your memorial.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Create Memorial</h1>
            <button
              onClick={() => router.push('/account')}
              className="text-gray-500 hover:text-gray-700"
            >
              Save & Exit
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-600">
              {steps[currentStep - 1]?.name}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 md:p-8">
          {renderStep()}
          
          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-md ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>
            
            {currentStep === steps.length ? (
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Publishing...' : 'Publish Memorial'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NewMemorialContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const memorialId = searchParams.get('id');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectPath = memorialId 
      ? `/memorials/new?id=${memorialId}`
      : '/memorials/new';

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to sign in to create a memorial. It's quick and easy to get started.
          </p>
          <div className="space-y-3">
            <Link 
              href={`/auth/signin?redirect=${encodeURIComponent(redirectPath)}`}
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Sign In to Continue
            </Link>
            <Link 
              href={`/auth/signup?redirect=${encodeURIComponent(redirectPath)}`}
              className="block w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Create New Account
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Creating an account allows you to save your progress, manage your memorials, and receive important updates.
          </p>
        </div>
      </div>
    );
  }

  return <SimpleMemorialWizard memorialId={memorialId} />;
}

export default function NewMemorialPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <NewMemorialContent />
    </Suspense>
  );
}