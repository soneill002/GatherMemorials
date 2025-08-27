'use client';

import { useState, useEffect } from 'react';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { 
  Heart, 
  Church, 
  Globe, 
  DollarSign,
  ExternalLink,
  Info,
  Check,
  X,
  AlertCircle,
  HandHeart,
  Building,
  Users
} from 'lucide-react';
import { Memorial, DonationType } from '@/types/memorial';
import clsx from 'clsx';

interface DonationStepProps {
  data: Memorial;
  updateData: (updates: Partial<Memorial>) => void;
  onNext: () => void;
  onPrevious: () => void;
  errors?: Record<string, string>;
}

// Donation type options with icons and descriptions
const donationTypeOptions: Array<{
  value: DonationType;
  label: string;
  icon: any;
  description: string;
  placeholder: string;
  examples: string[];
}> = [
  {
    value: 'charity',
    label: 'Charity Organization',
    icon: Heart,
    description: 'A registered charity or non-profit organization',
    placeholder: 'https://www.redcross.org/donate',
    examples: ['Red Cross', 'St. Jude Children\'s Hospital', 'American Cancer Society']
  },
  {
    value: 'parish',
    label: 'Church or Parish',
    icon: Church,
    description: 'Catholic church, parish, or religious organization',
    placeholder: 'https://stmarysparish.org/donate',
    examples: ['St. Mary\'s Catholic Church', 'Diocese Building Fund', 'Parish School']
  },
  {
    value: 'gofundme',
    label: 'GoFundMe or Crowdfunding',
    icon: Users,
    description: 'Personal fundraising campaign',
    placeholder: 'https://www.gofundme.com/f/memorial-fund',
    examples: ['Medical expenses', 'Funeral costs', 'Family support fund']
  },
  {
    value: 'other',
    label: 'Other Organization',
    icon: Building,
    description: 'Any other organization or cause',
    placeholder: 'https://example.org/donate',
    examples: ['Hospital foundation', 'University scholarship', 'Research institute']
  }
];

// Common charity suggestions
const charitySuggestions = [
  { name: 'American Cancer Society', url: 'https://donate.cancer.org' },
  { name: 'St. Jude Children\'s Research Hospital', url: 'https://www.stjude.org/donate' },
  { name: 'American Heart Association', url: 'https://www.heart.org/donate' },
  { name: 'Alzheimer\'s Association', url: 'https://act.alz.org/donate' },
  { name: 'Catholic Charities USA', url: 'https://www.catholiccharitiesusa.org/ways-to-give' },
  { name: 'Salvation Army', url: 'https://www.salvationarmyusa.org/donate' }
];

export function DonationStep({
  data,
  updateData,
  onNext,
  onPrevious,
  errors = {}
}: DonationStepProps) {
  const [skipDonations, setSkipDonations] = useState(!data.donationType);
  const [urlValid, setUrlValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { showToast } = useToast();

  // Get current donation type option
  const currentTypeOption = donationTypeOptions.find(opt => opt.value === data.donationType);

  // Validate URL format
  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Check URL validity when it changes
  useEffect(() => {
    if (data.donationUrl) {
      const timer = setTimeout(() => {
        setUrlValid(validateUrl(data.donationUrl || ''));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUrlValid(null);
    }
  }, [data.donationUrl]);

  // Validate the donation information
  const validate = (): boolean => {
    if (skipDonations) {
      return true; // No validation needed if skipping
    }

    const newErrors: Record<string, string> = {};
    
    if (!data.donationType) {
      newErrors.donationType = 'Please select a donation type';
    }
    
    if (!data.donationUrl) {
      newErrors.donationUrl = 'Please enter a donation URL';
    } else if (!validateUrl(data.donationUrl)) {
      newErrors.donationUrl = 'Please enter a valid URL (starting with http:// or https://)';
    }
    
    if (!data.donationDescription) {
      newErrors.donationDescription = 'Please provide a brief description';
    } else if (data.donationDescription.length < 20) {
      newErrors.donationDescription = 'Description should be at least 20 characters';
    } else if (data.donationDescription.length > 500) {
      newErrors.donationDescription = 'Description should be less than 500 characters';
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      if (skipDonations) {
        updateData({ 
          donationType: undefined,
          donationUrl: undefined,
          donationDescription: undefined
        });
      }
      onNext();
    } else {
      showToast('Please complete the donation information', 'error');
    }
  };

  const handleSkipToggle = () => {
    const newSkipState = !skipDonations;
    setSkipDonations(newSkipState);
    if (newSkipState) {
      showToast('Donation information will be skipped', 'info');
      setLocalErrors({});
    }
  };

  const selectDonationType = (type: DonationType) => {
    updateData({ donationType: type });
    setSkipDonations(false);
  };

  const applySuggestion = (suggestion: typeof charitySuggestions[0]) => {
    updateData({ 
      donationType: 'charity',
      donationUrl: suggestion.url,
      donationDescription: `In memory of ${data.firstName || 'your loved one'}, please consider a donation to ${suggestion.name}.`
    });
    setSkipDonations(false);
    setShowSuggestions(false);
    showToast('Charity suggestion applied', 'success');
  };

  // Format the donation link preview text
  const getDonationLinkText = () => {
    if (data.donationType === 'parish') {
      return `Donate to ${data.donationDescription?.split('.')[0] || 'Parish'}`;
    } else if (data.donationType === 'gofundme') {
      return 'Support the Family';
    } else if (data.donationType === 'charity') {
      return 'Make a Memorial Donation';
    }
    return 'Make a Donation';
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Memorial Donations
        </h2>
        <p className="text-gray-600">
          Provide a way for visitors to make donations in memory of your loved one.
        </p>
      </div>

      {/* Skip Option */}
      <Card className="bg-gray-50">
        <div className="p-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={skipDonations}
              onChange={handleSkipToggle}
              className="mt-1 w-4 h-4 text-marianBlue border-gray-300 rounded focus:ring-marianBlue"
            />
            <div className="ml-3">
              <span className="font-medium text-gray-900">
                No donation information at this time
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Select this if you don't want to include donation information on the memorial
              </p>
            </div>
          </label>
        </div>
      </Card>

      {!skipDonations && (
        <>
          {/* Donation Type Selection */}
          <Card>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Select Donation Type <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-500">
                  Choose the type of organization where donations should be directed
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {donationTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectDonationType(option.value)}
                    className={clsx(
                      "p-4 rounded-lg border-2 text-left transition-all",
                      data.donationType === option.value
                        ? "border-marianBlue bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <option.icon className="w-5 h-5 text-marianBlue mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {localErrors.donationType && (
                <p className="text-sm text-red-600">{localErrors.donationType}</p>
              )}
            </div>
          </Card>

          {/* Donation Details */}
          {data.donationType && (
            <Card>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Donation Details
                  </h3>
                  {currentTypeOption && (
                    <p className="text-sm text-gray-500 mt-1">
                      Examples: {currentTypeOption.examples.join(', ')}
                    </p>
                  )}
                </div>

                {/* Quick Suggestions for Charities */}
                {data.donationType === 'charity' && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className="text-sm text-marianBlue hover:text-blue-700 font-medium"
                    >
                      {showSuggestions ? 'Hide' : 'Show'} common charity suggestions
                    </button>
                    
                    {showSuggestions && (
                      <div className="mt-3 grid gap-2">
                        {charitySuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applySuggestion(suggestion)}
                            className="text-left p-3 text-sm bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-marianBlue transition-colors"
                          >
                            <p className="font-medium text-gray-900">{suggestion.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{suggestion.url}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Donation URL */}
                <div>
                  <div className="relative">
                    <Input
                      label="Donation Page URL"
                      value={data.donationUrl || ''}
                      onChange={(e) => updateData({ donationUrl: e.target.value })}
                      placeholder={currentTypeOption?.placeholder}
                      error={localErrors.donationUrl}
                      required
                      icon={Globe}
                    />
                    {data.donationUrl && urlValid !== null && (
                      <div className="absolute right-3 top-9">
                        {urlValid ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {data.donationUrl && urlValid && (
                    <a
                      href={data.donationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-2 text-sm text-marianBlue hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Test donation link
                    </a>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Textarea
                    label="Description"
                    value={data.donationDescription || ''}
                    onChange={(e) => updateData({ donationDescription: e.target.value })}
                    placeholder={`In lieu of flowers, the family requests donations be made to ${
                      data.donationType === 'parish' ? 'St. Mary\'s Building Fund' :
                      data.donationType === 'charity' ? 'the American Cancer Society' :
                      data.donationType === 'gofundme' ? 'help with funeral expenses' :
                      'their chosen organization'
                    } in ${data.firstName || '[Name]'}'s memory.`}
                    error={localErrors.donationDescription}
                    rows={3}
                    required
                    maxLength={500}
                    showCount
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This message will appear with the donation link on the memorial page
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Preview */}
          {data.donationType && data.donationUrl && data.donationDescription && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Preview
                </h3>
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-marianBlue/10 rounded-lg">
                      <HandHeart className="w-6 h-6 text-marianBlue" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Memorial Donations
                      </h4>
                      <p className="text-gray-700 mb-4">
                        {data.donationDescription}
                      </p>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="inline-flex items-center px-4 py-2 bg-marianBlue text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        {getDonationLinkText()}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3 text-center">
                  This is how the donation section will appear on the memorial page
                </p>
              </div>
            </Card>
          )}

          {/* Donation Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2 text-liturgicalGold" />
                Donation Guidelines
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Always verify the donation URL is correct and working</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>For parishes, contact them first to get the correct donation link</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Consider mentioning if donations are tax-deductible (for registered charities)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>"In lieu of flowers" is a common and respectful phrase to use</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>You can update donation information at any time after publishing</span>
                </li>
              </ul>
            </div>
          </Card>
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onPrevious}
        >
          Back to Services
        </Button>
        
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
        >
          Continue to Gallery
        </Button>
      </div>
    </div>
  );
}