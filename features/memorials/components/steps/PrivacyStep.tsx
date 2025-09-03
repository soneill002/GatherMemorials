'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { Globe, Lock, Users, Check, Info, Eye, EyeOff, Key } from 'lucide-react';
import { Memorial, PrivacySetting } from '@/types/memorial';
import { clsx } from 'clsx';

interface PrivacyStepProps {
  data: Memorial;
  updateData: (updates: Partial<Memorial>) => void;
  onNext: () => void;
  onPrevious: () => void;
  errors?: Record<string, string>;
}

export function PrivacyStep({ data, updateData, onNext, onPrevious }: PrivacyStepProps) {
  const [privacy, setPrivacy] = useState<PrivacySetting>(data.privacy || 'private');
  const [password, setPassword] = useState(data.memorialPassword || '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customUrl, setCustomUrl] = useState(data.customUrl || '');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const privacyOptions = [
    {
      value: 'public' as PrivacySetting,
      label: 'Public',
      icon: Globe,
      description: 'Anyone can view this memorial',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      value: 'private' as PrivacySetting,
      label: 'Private',
      icon: Users,
      description: 'Only people with the direct link can view',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      value: 'password' as PrivacySetting,
      label: 'Password Protected',
      icon: Lock,
      description: 'Requires a password to view',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    }
  ];

  const validate = () => {
    const errors: Record<string, string> = {};
    
    if (!customUrl) {
      errors.customUrl = 'Please choose a custom URL';
    }
    
    if (privacy === 'password') {
      if (!password) {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      updateData({
        privacy,
        memorialPassword: privacy === 'password' ? password : undefined,
        customUrl
      });
      onNext();
    } else {
      toast.error('Please complete all required fields');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Privacy & Sharing
        </h2>
        <p className="text-gray-600">
          Control who can view the memorial
        </p>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Privacy Level</h3>
          <div className="space-y-3">
            {privacyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPrivacy(option.value)}
                className={clsx(
                  "w-full p-4 rounded-lg border-2 text-left transition-all",
                  privacy === option.value
                    ? `${option.borderColor} ${option.bgColor}`
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start gap-3">
                  <option.icon className={clsx(
                    "w-5 h-5 mt-0.5",
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
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {privacy === 'password' && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Set Password</h3>
            
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                error={localErrors.password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
            />
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Custom URL</h3>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">gathermemorials.com/m/</span>
            <Input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="john-smith"
              error={localErrors.customUrl}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onPrevious}
        >
          Back
        </Button>
        
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}