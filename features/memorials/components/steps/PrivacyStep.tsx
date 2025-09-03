'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { 
  Globe, 
  Lock, 
  Eye,
  EyeOff,
  Link,
  Search,
  Shield,
  Users,
  Info,
  Check,
  X,
  AlertCircle,
  Copy,
  ExternalLink,
  Key,
  Share2
} from 'lucide-react';
import { Memorial, PrivacySetting } from '@/types/memorial';
import clsx from 'clsx';

interface PrivacyStepProps {
  data: Memorial;
  updateData: (updates: Partial<Memorial>) => void;
  onNext: () => void;
  onPrevious: () => void;
  errors?: Record<string, string>;
}

// Privacy options with details
const privacyOptions = [
  {
    value: 'public' as PrivacySetting,
    label: 'Public',
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Anyone can view this memorial',
    features: [
      'Appears in search engines (Google, Bing)',
      'Shareable on social media',
      'Anyone with the link can view',
      'Maximum visibility for friends and family'
    ],
    warnings: []
  },
  {
    value: 'private' as PrivacySetting,
    label: 'Private',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Only people with the direct link can view',
    features: [
      'Not listed in search engines',
      'Only accessible via direct link',
      'Can still be shared with specific people',
      'Good balance of privacy and accessibility'
    ],
    warnings: []
  },
  {
    value: 'password' as PrivacySetting,
    label: 'Password Protected',
    icon: Lock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'Requires a password to view',
    features: [
      'Maximum privacy',
      'Not in search engines',
      'Password required for access',
      'Complete control over who can view'
    ],
    warnings: [
      'You will need to share the password with visitors',
      'Some may have difficulty accessing'
    ]
  }
];

// SEO options for public memorials
const seoOptions = [
  { id: 'title', label: 'Include full name in page title', default: true },
  { id: 'description', label: 'Include obituary excerpt in search results', default: true },
  { id: 'images', label: 'Allow search engines to index photos', default: false }
];

export function PrivacyStep({
  data,
  updateData,
  onNext,
  onPrevious,
  errors = {}
}: PrivacyStepProps) {
  const [privacy, setPrivacy] = useState<PrivacySetting>(data.privacy || 'private');
  const [password, setPassword] = useState(data.memorialPassword || '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customUrl, setCustomUrl] = useState(data.customUrl || '');
  const [urlAvailable, setUrlAvailable] = useState<boolean | null>(null);
  const [checkingUrl, setCheckingUrl] = useState(false);
  const [seoSettings, setSeoSettings] = useState(data.seoSettings || {
    title: true,
    description: true,
    images: false
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  // Generate suggested URL from name
  const generateSuggestedUrl = () => {
    if (data.firstName && data.lastName) {
      const first = data.firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const last = data.lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `${first}-${last}-${Date.now().toString(36).slice(-4)}`;
    }
    return '';
  };

  // Check URL availability (mock - would hit API in production)
  useEffect(() => {
    if (customUrl && customUrl.length >= 3) {
      setCheckingUrl(true);
      const timer = setTimeout(() => {
        // Mock availability check
        const isAvailable = !['john-doe', 'test', 'admin', 'memorial'].includes(customUrl.toLowerCase());
        setUrlAvailable(isAvailable);
        setCheckingUrl(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUrlAvailable(null);
    }
  }, [customUrl]);

  // Validate custom URL format
  const validateUrl = (url: string): boolean => {
    const urlRegex = /^[a-zA-Z0-9-]+$/;
    return urlRegex.test(url) && url.length >= 3 && url.length <= 50;
  };

  // Validate the privacy settings
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate custom URL
    if (!customUrl) {
      newErrors.customUrl = 'Please choose a custom URL for your memorial';
    } else if (!validateUrl(customUrl)) {
      newErrors.customUrl = 'URL can only contain letters, numbers, and hyphens (3-50 characters)';
    } else if (urlAvailable === false) {
      newErrors.customUrl = 'This URL is already taken. Please choose another.';
    }

    // Validate password if password-protected
    if (privacy === 'password') {
      if (!password) {
        newErrors.password = 'Password is required for password-protected memorials';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      updateData({
        privacy,
        memorialPassword: privacy === 'password' ? password : undefined,
        customUrl,
        seoSettings: privacy === 'public' ? seoSettings : undefined
      });
      onNext();
    } else {
      showToast('Please complete all required fields', 'error');
    }
  };

  const handlePrivacyChange = (value: PrivacySetting) => {
    setPrivacy(value);
    if (value === 'public') {
      showToast('Memorial will be publicly visible and searchable', 'info');
    } else if (value === 'password') {
      showToast('You\'ll need to share the password with visitors', 'warning');
    }
  };

  const copyMemorialUrl = () => {
    const url = `https://gathermemorials.com/memorial/${customUrl}`;
    navigator.clipboard.writeText(url);
    showToast('Memorial URL copied to clipboard', 'success');
  };

  const handleSuggestUrl = () => {
    const suggested = generateSuggestedUrl();
    if (suggested) {
      setCustomUrl(suggested);
      showToast('Suggested URL generated', 'success');
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Privacy & Sharing
        </h2>
        <p className="text-gray-600">
          Control who can view the memorial and how it can be found online.
        </p>
      </div>

      {/* Privacy Level Selection */}
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Privacy Level <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500">
              Choose who can access this memorial
            </p>
          </div>

          <div className="space-y-3">
            {privacyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePrivacyChange(option.value)}
                className={clsx(
                  "w-full p-4 rounded-lg border-2 text-left transition-all",
                  privacy === option.value
                    ? `${option.borderColor} ${option.bgColor}`
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start gap-3">
                  <option.icon className={clsx(
                    "w-5 h-5 mt-0.5 flex-shrink-0",
                    privacy === option.value ? option.color : "text-gray-400"
                  )} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{option.label}</p>
                      {privacy === option.value && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    
                    {privacy === option.value && (
                      <div className="mt-3 space-y-2">
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">Features:</p>
                          <ul className="text-xs text-gray-600 space-y-0.5">
                            {option.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <Check className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {option.warnings.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-amber-700 mb-1">Note:</p>
                            <ul className="text-xs text-amber-600 space-y-0.5">
                              {option.warnings.map((warning, idx) => (
                                <li key={idx} className="flex items-start">
                                  <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                  <span>{warning}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Password Settings (if password-protected) */}
      {privacy === 'password' && (
        <Card>
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Set Memorial Password
              </h3>
              <p className="text-sm text-gray-500">
                Visitors will need this password to view the memorial
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  error={localErrors.password}
                  required
                  icon={Key}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                error={localErrors.confirmPassword}
                required
                icon={Key}
              />

              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Important:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Save this password securely</li>
                      <li>• Share it with family and friends who should have access</li>
                      <li>• You can change it later in settings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Custom URL */}
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Custom Memorial URL <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500">
              Choose a unique web address for this memorial
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute left-3 top-9 text-gray-500 text-sm">
                      gathermemorials.com/memorial/
                    </div>
                    <Input
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="custom-url"
                      className="pl-64"
                      error={localErrors.customUrl}
                    />
                    {customUrl && (
                      <div className="absolute right-3 top-9">
                        {checkingUrl ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-marianBlue" />
                        ) : urlAvailable === true ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : urlAvailable === false ? (
                          <X className="w-5 h-5 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSuggestUrl}
                  className="mt-6"
                >
                  Suggest
                </Button>
              </div>

              {customUrl && urlAvailable && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Check className="w-4 h-4" />
                    <span>This URL is available!</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyMemorialUrl}
                    className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800"
                  >
                    <Copy className="w-4 h-4" />
                    Copy full URL
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-500">
                • Use letters, numbers, and hyphens only (3-50 characters)<br />
                • This URL cannot be changed after publishing<br />
                • Example: john-doe-memorial or smith-family-2024
              </p>
            </div>
          </div>
        </Card>

      {/* SEO Settings (if public) */}
      {privacy === 'public' && (
        <Card>
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Search Engine Settings
              </h3>
              <p className="text-sm text-gray-500">
                Control how this memorial appears in search results
              </p>
            </div>

            <div className="space-y-3">
              {seoOptions.map((option) => (
                <label key={option.id} className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seoSettings[option.id] ?? option.default}
                    onChange={(e) => setSeoSettings({
                      ...seoSettings,
                      [option.id]: e.target.checked
                    })}
                    className="mt-1 w-4 h-4 text-marianBlue border-gray-300 rounded focus:ring-marianBlue"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Search className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">How it will appear in Google:</p>
                  <div className="mt-2 bg-white p-3 rounded border border-blue-200">
                    <p className="text-blue-700 font-medium">
                      {seoSettings.title ? `${data.firstName} ${data.lastName} Memorial` : 'Memorial Page'} - GatherMemorials
                    </p>
                    <p className="text-green-700 text-xs">gathermemorials.com/memorial/{customUrl || 'your-url'}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      {seoSettings.description 
                        ? (data.obituary?.substring(0, 150) || 'A beautiful memorial celebrating a life well lived...')
                        : 'View this memorial on GatherMemorials'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Preview Access Button */}
      <Card className="bg-gray-50">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Preview Memorial</h3>
              <p className="text-sm text-gray-600 mt-1">
                You can always preview your memorial before and after publishing
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              icon={Eye}
              onClick={() => showToast('Preview will open in the next step', 'info')}
            >
              Preview
            </Button>
          </div>
        </div>
      </Card>

      {/* Privacy Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <Info className="w-5 h-5 mr-2 text-liturgicalGold" />
            Privacy Recommendations
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span><strong>Public:</strong> Best for celebrating a life and allowing all friends and family to find and visit</span>
            </li>
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span><strong>Private:</strong> Good balance when you want to share with specific people</span>
            </li>
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span><strong>Password:</strong> Maximum privacy for sensitive situations</span>
            </li>
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span>You can change privacy settings after publishing (except custom URL)</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onPrevious}
        >
          Back to Guestbook
        </Button>
        
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
}