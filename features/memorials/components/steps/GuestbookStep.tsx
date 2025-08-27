'use client';

import { useState } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { 
  MessageSquare, 
  Shield, 
  Mail, 
  Bell,
  Users,
  Lock,
  CheckCircle,
  AlertCircle,
  Info,
  Eye,
  Settings,
  Heart,
  Clock,
  UserCheck
} from 'lucide-react';
import { Memorial } from '@/types/memorial';
import clsx from 'clsx';

interface GuestbookStepProps {
  data: Memorial;
  updateData: (updates: Partial<Memorial>) => void;
  onNext: () => void;
  onPrevious: () => void;
  errors?: Record<string, string>;
}

// Moderation options
const moderationOptions = [
  {
    value: 'none',
    label: 'No Moderation',
    description: 'All messages appear immediately',
    icon: Users,
    pros: ['Instant sharing', 'No delays'],
    cons: ['Potential for spam', 'No content control']
  },
  {
    value: 'pre',
    label: 'Pre-Moderation (Recommended)',
    description: 'Review messages before they appear',
    icon: Shield,
    pros: ['Full control', 'Prevent inappropriate content', 'Block spam'],
    cons: ['Slight delay for visitors']
  },
  {
    value: 'post',
    label: 'Post-Moderation',
    description: 'Messages appear immediately, but you can remove them',
    icon: Clock,
    pros: ['No delays', 'Can remove if needed'],
    cons: ['Inappropriate content may be visible temporarily']
  }
];

// Notification frequency options
const notificationOptions = [
  { value: 'instant', label: 'Instant', description: 'Get notified immediately for each entry' },
  { value: 'daily', label: 'Daily Digest', description: 'One email per day with all entries' },
  { value: 'weekly', label: 'Weekly Summary', description: 'Weekly email with all entries' },
  { value: 'none', label: 'No Notifications', description: 'Check entries in your dashboard' }
];

export function GuestbookStep({
  data,
  updateData,
  onNext,
  onPrevious,
  errors = {}
}: GuestbookStepProps) {
  const [enableGuestbook, setEnableGuestbook] = useState(data.guestbookEnabled ?? true);
  const [moderation, setModeration] = useState(data.guestbookModeration || 'pre');
  const [notifications, setNotifications] = useState(data.guestbookNotifications || 'instant');
  const [notificationEmail, setNotificationEmail] = useState(data.guestbookNotificationEmail || '');
  const [requireAuth, setRequireAuth] = useState(data.guestbookRequireAuth ?? true);
  const [showPreview, setShowPreview] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  // Validate email if notifications are enabled
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate the guestbook settings
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (enableGuestbook && notifications !== 'none' && !notificationEmail) {
      newErrors.notificationEmail = 'Email is required for notifications';
    } else if (enableGuestbook && notifications !== 'none' && !validateEmail(notificationEmail)) {
      newErrors.notificationEmail = 'Please enter a valid email address';
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      updateData({
        guestbookEnabled: enableGuestbook,
        guestbookModeration: enableGuestbook ? moderation : undefined,
        guestbookNotifications: enableGuestbook ? notifications : undefined,
        guestbookNotificationEmail: enableGuestbook && notifications !== 'none' ? notificationEmail : undefined,
        guestbookRequireAuth: enableGuestbook ? requireAuth : undefined
      });
      onNext();
    } else {
      showToast('Please complete the notification settings', 'error');
    }
  };

  const handleEnableToggle = () => {
    const newState = !enableGuestbook;
    setEnableGuestbook(newState);
    if (!newState) {
      showToast('Guestbook will be disabled', 'info');
      setLocalErrors({});
    } else {
      showToast('Guestbook enabled', 'success');
    }
  };

  const handleModerationChange = (value: string) => {
    setModeration(value);
    if (value === 'none') {
      showToast('Warning: Without moderation, inappropriate content may appear', 'warning');
    }
  };

  // Example guestbook entries for preview
  const exampleEntries = [
    {
      author: 'Sarah Johnson',
      message: 'Your mother was such a kind soul. She always had a smile and a kind word for everyone. We will miss her dearly.',
      date: 'Today at 2:30 PM'
    },
    {
      author: 'Michael Chen',
      message: 'I\'ll never forget the wonderful memories we shared. Rest in peace, dear friend.',
      date: 'Yesterday at 4:15 PM'
    },
    {
      author: 'The Martinez Family',
      message: 'Our deepest condolences to your family during this difficult time. May God grant you peace and comfort.',
      date: '2 days ago'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Guestbook Settings
        </h2>
        <p className="text-gray-600">
          Allow visitors to share memories and condolences on the memorial page.
        </p>
      </div>

      {/* Enable/Disable Guestbook */}
      <Card className={clsx(
        "transition-colors",
        enableGuestbook ? "bg-blue-50 border-marianBlue" : "bg-gray-50"
      )}>
        <div className="p-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={enableGuestbook}
              onChange={handleEnableToggle}
              className="mt-1 w-4 h-4 text-marianBlue border-gray-300 rounded focus:ring-marianBlue"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  Enable Guestbook
                </span>
                {enableGuestbook ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {enableGuestbook 
                  ? 'Visitors can leave messages of support and share memories'
                  : 'Guestbook will not be available on the memorial page'}
              </p>
            </div>
          </label>
        </div>
      </Card>

      {enableGuestbook && (
        <>
          {/* Moderation Settings */}
          <Card>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Moderation Settings
                </h3>
                <p className="text-sm text-gray-500">
                  Control how messages appear on the memorial
                </p>
              </div>

              <div className="space-y-3">
                {moderationOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleModerationChange(option.value)}
                    className={clsx(
                      "w-full p-4 rounded-lg border-2 text-left transition-all",
                      moderation === option.value
                        ? "border-marianBlue bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <option.icon className="w-5 h-5 text-marianBlue mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{option.label}</p>
                          {option.value === 'pre' && (
                            <span className="text-xs bg-liturgicalGold text-white px-2 py-0.5 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                        
                        <div className="mt-3 flex gap-4 text-xs">
                          <div>
                            <span className="text-green-600 font-medium">Pros:</span>
                            <ul className="text-gray-600 mt-1">
                              {option.pros.map((pro, idx) => (
                                <li key={idx}>• {pro}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-amber-600 font-medium">Cons:</span>
                            <ul className="text-gray-600 mt-1">
                              {option.cons.map((con, idx) => (
                                <li key={idx}>• {con}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Notification Preferences
                </h3>
                <p className="text-sm text-gray-500">
                  How would you like to be notified about new guestbook entries?
                </p>
              </div>

              <div className="space-y-4">
                <Select
                  label="Notification Frequency"
                  value={notifications}
                  onChange={(e) => setNotifications(e.target.value)}
                  icon={Bell}
                >
                  {notificationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </Select>

                {notifications !== 'none' && (
                  <Input
                    label="Notification Email"
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="your@email.com"
                    error={localErrors.notificationEmail}
                    required
                    icon={Mail}
                    hint="You'll receive guestbook notifications at this email"
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Spam Prevention */}
          <Card>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Spam Prevention
                </h3>
                <p className="text-sm text-gray-500">
                  Protect the guestbook from spam and abuse
                </p>
              </div>

              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireAuth}
                  onChange={(e) => setRequireAuth(e.target.checked)}
                  className="mt-1 w-4 h-4 text-marianBlue border-gray-300 rounded focus:ring-marianBlue"
                />
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      Require sign-in to post
                    </span>
                    <UserCheck className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Visitors must create a free account to leave messages. This significantly reduces spam.
                  </p>
                </div>
              </label>

              <div className={clsx(
                "p-4 rounded-lg flex items-start gap-3",
                requireAuth ? "bg-green-50" : "bg-amber-50"
              )}>
                {requireAuth ? (
                  <>
                    <Lock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900">Strong protection enabled</p>
                      <p className="text-green-700 mt-1">
                        Sign-in requirement will prevent most spam and ensure genuine messages.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900">Limited protection</p>
                      <p className="text-amber-700 mt-1">
                        Without sign-in requirement, you may receive more spam messages.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Guestbook Preview */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Preview
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="small"
                  onClick={() => setShowPreview(!showPreview)}
                  icon={Eye}
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>

              {showPreview && (
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-6 border border-gray-200">
                  <div className="mb-6">
                    <h4 className="text-xl font-serif text-gray-900 mb-2">
                      Guestbook
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Share a memory or leave a message of support for the family
                    </p>
                  </div>

                  {/* Sample entries */}
                  <div className="space-y-4 mb-6">
                    {exampleEntries.map((entry, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-gray-900">{entry.author}</p>
                          <span className="text-xs text-gray-500">{entry.date}</span>
                        </div>
                        <p className="text-gray-700 text-sm">{entry.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Sign-in prompt */}
                  {requireAuth && (
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <MessageSquare className="w-8 h-8 text-marianBlue mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900">
                        Sign in to leave a message
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Create a free account to share your memories
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Guestbook Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2 text-liturgicalGold" />
                Guestbook Best Practices
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Pre-moderation is recommended to maintain a respectful environment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Instant notifications help you respond quickly to heartfelt messages</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Requiring sign-in prevents spam while allowing genuine messages</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>You can always change these settings after the memorial is published</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Consider thanking visitors who leave meaningful messages</span>
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
          Back to Gallery
        </Button>
        
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
        >
          Continue to Privacy
        </Button>
      </div>
    </div>
  );
}