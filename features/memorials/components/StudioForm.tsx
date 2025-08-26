// features/memorials/components/StudioForm.tsx
// The main form component with all memorial fields
// Handles validation, media uploads, and field organization

'use client'

import { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Memorial } from '@/types/memorial'
import FormInput from '@/components/forms/FormInput'
import FormTextarea from '@/components/forms/FormTextarea'
import FormDatePicker from '@/components/forms/FormDatePicker'
import MediaUploader from './MediaUploader'
import RichTextEditor from './RichTextEditor'
import PrivacySettings from './PrivacySettings'
import { MEMORIAL_PRIVACY } from '@/lib/constants'

interface StudioFormProps {
  data: Partial<Memorial>
  errors: Record<string, string>
  onChange: (field: string, value: any) => void
  onBulkUpdate: (updates: Partial<Memorial>) => void
  mode: 'create' | 'edit'
}

// Form sections for better organization
const FORM_SECTIONS = [
  { id: 'basic', label: 'Basic Information', icon: '👤' },
  { id: 'life', label: 'Life Story', icon: '📖' },
  { id: 'media', label: 'Photos & Videos', icon: '🖼️' },
  { id: 'faith', label: 'Faith & Prayers', icon: '✝️' },
  { id: 'settings', label: 'Privacy & Settings', icon: '⚙️' },
] as const

export default function StudioForm({
  data,
  errors,
  onChange,
  onBulkUpdate,
  mode
}: StudioFormProps) {
  const [activeSection, setActiveSection] = useState('basic')
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  // Handle field changes with type safety
  const handleChange = useCallback((field: keyof Memorial) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(field, e.target.value)
  }, [onChange])

  // Handle date changes
  const handleDateChange = useCallback((field: string, date: Date | null) => {
    onChange(field, date?.toISOString().split('T')[0] || '')
  }, [onChange])

  // Handle media upload
  const handleMediaUpload = useCallback(async (files: File[]) => {
    setUploadingMedia(true)
    try {
      // In production, upload to Cloudinary here
      // For now, create object URLs as placeholders
      const photos = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        thumbnailUrl: URL.createObjectURL(file),
        caption: '',
        uploadedBy: 'current-user',
        uploadedAt: new Date().toISOString(),
        order: (data.photos?.length || 0) + 1
      }))

      onBulkUpdate({
        photos: [...(data.photos || []), ...photos]
      })
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploadingMedia(false)
    }
  }, [data.photos, onBulkUpdate])

  // Section navigation for mobile
  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId)
    const element = document.getElementById(`section-${sectionId}`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div ref={formRef} className="space-y-8">
      {/* Mobile section navigation */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {FORM_SECTIONS.map(section => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors",
              activeSection === section.id
                ? "bg-marian-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <span>{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Basic Information Section */}
      <section id="section-basic" className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">👤</span>
          <h2 className="text-xl font-semibold">Basic Information</h2>
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="First Name"
            name="firstName"
            value={data.firstName || ''}
            onChange={handleChange('firstName')}
            error={errors.firstName}
            required
            placeholder="John"
            autoComplete="given-name"
          />
          
          <FormInput
            label="Middle Name"
            name="middleName"
            value={data.middleName || ''}
            onChange={handleChange('middleName')}
            placeholder="Michael"
            autoComplete="additional-name"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Last Name"
            name="lastName"
            value={data.lastName || ''}
            onChange={handleChange('lastName')}
            error={errors.lastName}
            required
            placeholder="Smith"
            autoComplete="family-name"
          />
          
          <FormInput
            label="Nickname"
            name="nickname"
            value={data.nickname || ''}
            onChange={handleChange('nickname')}
            placeholder="Johnny"
          />
        </div>

        {/* Date fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormDatePicker
            label="Date of Birth"
            name="birthDate"
            value={data.birthDate ? new Date(data.birthDate) : undefined}
            onChange={(date) => handleDateChange('birthDate', date)}
            error={errors.birthDate}
            required
            max={new Date()}
          />
          
          <FormDatePicker
            label="Date of Passing"
            name="deathDate"
            value={data.deathDate ? new Date(data.deathDate) : undefined}
            onChange={(date) => handleDateChange('deathDate', date)}
            error={errors.deathDate}
            required
            max={new Date()}
            min={data.birthDate ? new Date(data.birthDate) : undefined}
          />
        </div>

        {/* Memorial title */}
        <FormInput
          label="Memorial Title"
          name="title"
          value={data.title || ''}
          onChange={handleChange('title')}
          error={errors.title}
          required
          placeholder="In Loving Memory of John Smith"
          hint="This will appear at the top of the memorial page"
        />
      </section>

      {/* Life Story Section */}
      <section id="section-life" className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📖</span>
          <h2 className="text-xl font-semibold">Life Story</h2>
        </div>

        <FormTextarea
          label="Obituary"
          name="obituary"
          value={data.obituary || ''}
          onChange={handleChange('obituary')}
          error={errors.obituary}
          rows={6}
          placeholder="Share their life story, accomplishments, and the legacy they leave behind..."
          hint="This will be the main text on the memorial page"
          maxLength={5000}
          showCharCount
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Biography (Optional)
          </label>
          <RichTextEditor
            value={data.biography || ''}
            onChange={(value) => onChange('biography', value)}
            placeholder="Add a more detailed life story with formatting..."
          />
        </div>
      </section>

      {/* Media Section */}
      <section id="section-media" className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🖼️</span>
          <h2 className="text-xl font-semibold">Photos & Videos</h2>
        </div>

        <MediaUploader
          photos={data.photos || []}
          videos={data.videos || []}
          onUpload={handleMediaUpload}
          onRemove={(id) => {
            const updatedPhotos = data.photos?.filter(p => p.id !== id) || []
            onBulkUpdate({ photos: updatedPhotos })
          }}
          onReorder={(photos) => onBulkUpdate({ photos })}
          isUploading={uploadingMedia}
          maxPhotos={data.pricingTier === 'free' ? 10 : undefined}
        />
      </section>

      {/* Faith & Prayers Section */}
      <section id="section-faith" className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">✝️</span>
          <h2 className="text-xl font-semibold">Faith & Prayers</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={data.enablePrayers || false}
              onChange={(e) => onChange('enablePrayers', e.target.checked)}
              className="w-5 h-5 text-marian-blue-500 rounded focus:ring-marian-blue-500"
            />
            <div>
              <div className="font-medium">Enable Prayer Requests</div>
              <div className="text-sm text-gray-500">
                Allow visitors to light virtual candles and leave prayers
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={data.enableMassIntentions || false}
              onChange={(e) => onChange('enableMassIntentions', e.target.checked)}
              className="w-5 h-5 text-marian-blue-500 rounded focus:ring-marian-blue-500"
            />
            <div>
              <div className="font-medium">Enable Mass Intentions</div>
              <div className="text-sm text-gray-500">
                Connect with your parish for Mass intention requests
              </div>
            </div>
          </label>

          {/* Parish selection - would fetch from API */}
          {data.enableMassIntentions && (
            <FormInput
              label="Parish"
              name="parishId"
              value={data.parishId || ''}
              onChange={handleChange('parishId')}
              placeholder="Search for your parish..."
              hint="Start typing to search for participating parishes"
            />
          )}
        </div>
      </section>

      {/* Privacy Settings Section */}
      <section id="section-settings" className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">⚙️</span>
          <h2 className="text-xl font-semibold">Privacy & Settings</h2>
        </div>

        <PrivacySettings
          privacy={data.privacy || MEMORIAL_PRIVACY.PUBLIC}
          password={data.password || ''}
          customUrl={data.customUrl || ''}
          onPrivacyChange={(privacy) => onChange('privacy', privacy)}
          onPasswordChange={(password) => onChange('password', password)}
          onCustomUrlChange={(url) => onChange('customUrl', url)}
        />
      </section>
    </div>
  )
}