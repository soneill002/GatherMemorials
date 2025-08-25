// features/memorials/components/PrivacySettings.tsx
// Privacy and access control settings for memorials

'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { MEMORIAL_PRIVACY } from '@/lib/constants'
import FormInput from '@/components/forms/FormInput'

interface PrivacySettingsProps {
  privacy: string
  password: string
  customUrl: string
  onPrivacyChange: (privacy: string) => void
  onPasswordChange: (password: string) => void
  onCustomUrlChange: (url: string) => void
}

export default function PrivacySettings({
  privacy,
  password,
  customUrl,
  onPrivacyChange,
  onPasswordChange,
  onCustomUrlChange
}: PrivacySettingsProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [urlAvailable, setUrlAvailable] = useState<boolean | null>(null)
  const [checkingUrl, setCheckingUrl] = useState(false)

  // Check URL availability (debounced in production)
  const checkUrlAvailability = useCallback(async (url: string) => {
    if (!url || url.length < 3) {
      setUrlAvailable(null)
      return
    }

    setCheckingUrl(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setUrlAvailable(Math.random() > 0.3) // Mock availability
    setCheckingUrl(false)
  }, [])

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    onCustomUrlChange(url)
    checkUrlAvailability(url)
  }, [onCustomUrlChange, checkUrlAvailability])

  return (
    <div className="space-y-6">
      {/* Privacy options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Who can view this memorial?
        </label>
        
        <div className="space-y-3">
          {/* Public option */}
          <label className={cn(
            "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all",
            privacy === MEMORIAL_PRIVACY.PUBLIC
              ? "border-marian-blue-500 bg-marian-blue-50"
              : "border-gray-200 hover:bg-gray-50"
          )}>
            <input
              type="radio"
              name="privacy"
              value={MEMORIAL_PRIVACY.PUBLIC}
              checked={privacy === MEMORIAL_PRIVACY.PUBLIC}
              onChange={(e) => onPrivacyChange(e.target.value)}
              className="mt-1 text-marian-blue-500 focus:ring-marian-blue-500"
            />
            <div>
              <div className="font-medium">Public</div>
              <div className="text-sm text-gray-500">
                Anyone can view this memorial. It may appear in search results.
              </div>
            </div>
          </label>

          {/* Private option */}
          <label className={cn(
            "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all",
            privacy === MEMORIAL_PRIVACY.PRIVATE
              ? "border-marian-blue-500 bg-marian-blue-50"
              : "border-gray-200 hover:bg-gray-50"
          )}>
            <input
              type="radio"
              name="privacy"
              value={MEMORIAL_PRIVACY.PRIVATE}
              checked={privacy === MEMORIAL_PRIVACY.PRIVATE}
              onChange={(e) => onPrivacyChange(e.target.value)}
              className="mt-1 text-marian-blue-500 focus:ring-marian-blue-500"
            />
            <div>
              <div className="font-medium">Private</div>
              <div className="text-sm text-gray-500">
                Only people with the link can view this memorial.
              </div>
            </div>
          </label>

          {/* Password protected option */}
          <label className={cn(
            "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all",
            privacy === MEMORIAL_PRIVACY.PASSWORD
              ? "border-marian-blue-500 bg-marian-blue-50"
              : "border-gray-200 hover:bg-gray-50"
          )}>
            <input
              type="radio"
              name="privacy"
              value={MEMORIAL_PRIVACY.PASSWORD}
              checked={privacy === MEMORIAL_PRIVACY.PASSWORD}
              onChange={(e) => onPrivacyChange(e.target.value)}
              className="mt-1 text-marian-blue-500 focus:ring-marian-blue-500"
            />
            <div>
              <div className="font-medium">Password Protected</div>
              <div className="text-sm text-gray-500">
                Visitors need a password to view this memorial.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Password field (shown when password protected) */}
      {privacy === MEMORIAL_PRIVACY.PASSWORD && (
        <div className="pl-7">
          <FormInput
            label="Access Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Enter a password"
            hint="Share this password with people you want to give access"
            required
            containerClassName="max-w-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="mt-2 text-sm text-marian-blue-500 hover:text-marian-blue-600"
          >
            {showPassword ? 'Hide' : 'Show'} password
          </button>
        </div>
      )}

      {/* Custom URL */}
      <div>
        <FormInput
          label="Custom Memorial URL (Optional)"
          value={customUrl}
          onChange={handleUrlChange}
          placeholder="john-smith-memorial"
          hint="gathermemorials.com/m/your-custom-url"
          containerClassName="max-w-md"
        />
        
        {checkingUrl && (
          <p className="mt-2 text-sm text-gray-500">
            Checking availability...
          </p>
        )}
        
        {!checkingUrl && urlAvailable !== null && customUrl && (
          <p className={cn(
            "mt-2 text-sm",
            urlAvailable ? "text-green-600" : "text-red-600"
          )}>
            {urlAvailable 
              ? '✓ This URL is available' 
              : '✗ This URL is already taken'}
          </p>
        )}
      </div>
    </div>
  )
}