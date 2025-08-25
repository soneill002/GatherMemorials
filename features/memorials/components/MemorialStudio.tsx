// features/memorials/components/MemorialStudio.tsx
// Main studio component - orchestrates the entire creation/editing experience
// Handles state management, autosave, preview updates, and responsive layout

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Memorial } from '@/types/memorial'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useDebounce } from '@/hooks/useDebounce'
import { useAutoSave } from '@/features/memorials/hooks/useAutoSave'
import { useMemorialStore } from '@/features/memorials/store'
import StudioHeader from './StudioHeader'
import StudioForm from './StudioForm'
import MemorialPreview from './MemorialPreview'
import MobileStudioTabs from './MobileStudioTabs'
import { validateMemorial } from '@/features/memorials/validations'
import { toast } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface MemorialStudioProps {
  mode: 'create' | 'edit'
  initialData?: Partial<Memorial>
  memorialId?: string
}

// Preview themes available to users
const PREVIEW_THEMES = ['classic', 'marian', 'photo-first'] as const
type PreviewTheme = typeof PREVIEW_THEMES[number]

export default function MemorialStudio({ mode, initialData, memorialId }: MemorialStudioProps) {
  // Responsive design hooks
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const router = useRouter()

  // State management
  const [formData, setFormData] = useState<Partial<Memorial>>(initialData || {})
  const [previewData, setPreviewData] = useState<Partial<Memorial>>(initialData || {})
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>('classic')
  const [previewZoom, setPreviewZoom] = useState<'100%' | 'mobile'>('100%')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Refs for performance optimization
  const formRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Debounce preview updates for performance (500ms on mobile, 300ms on desktop)
  const debouncedFormData = useDebounce(formData, isMobile ? 500 : 300)

  // Update preview when debounced data changes
  useEffect(() => {
    setPreviewData(debouncedFormData)
  }, [debouncedFormData])

  // Auto-save hook with conflict resolution
  const { save, status: saveStatus, error: saveError } = useAutoSave({
    data: formData,
    memorialId,
    enabled: mode === 'edit' || (mode === 'create' && !!formData.firstName),
    onSuccess: (savedId) => {
      setLastSaved(new Date())
      // If creating, update URL to edit mode without full page reload
      if (mode === 'create' && savedId && !memorialId) {
        window.history.replaceState({}, '', `/memorials/${savedId}/edit`)
      }
    },
    onError: (error) => {
      toast.error('Failed to save changes. Please try again.')
      console.error('Save error:', error)
    }
  })

  // Handle form field changes with validation
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors(prev => {
          const next = { ...prev }
          delete next[field]
          return next
        })
      }

      return updated
    })
  }, [validationErrors])

  // Handle bulk updates (e.g., from photo upload)
  const handleBulkUpdate = useCallback((updates: Partial<Memorial>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  // Validate before publishing
  const handlePublish = useCallback(async () => {
    const validation = validateMemorial(formData)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      toast.error('Please complete all required fields')
      
      // Scroll to first error on mobile
      if (isMobile) {
        setActiveTab('edit')
        setTimeout(() => {
          const firstError = document.querySelector('[data-error="true"]')
          firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
      
      return
    }

    // Navigate to payment/publish flow
    router.push(`/memorials/${memorialId || 'new'}/publish`)
  }, [formData, memorialId, isMobile, router])

  // Handle theme changes
  const handleThemeChange = useCallback((theme: PreviewTheme) => {
    setPreviewTheme(theme)
    // Store preference in localStorage
    localStorage.setItem('memorial-preview-theme', theme)
  }, [])

  // Load theme preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('memorial-preview-theme') as PreviewTheme
    if (saved && PREVIEW_THEMES.includes(saved)) {
      setPreviewTheme(saved)
    }
  }, [])

  // Memoized save status text
  const saveStatusText = useMemo(() => {
    if (isSaving || saveStatus === 'saving') return 'Saving...'
    if (saveError) return 'Failed to save'
    if (lastSaved) {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
      if (seconds < 5) return 'Saved'
      if (seconds < 60) return `Saved ${seconds}s ago`
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `Saved ${minutes}m ago`
      return 'Saved'
    }
    return mode === 'create' ? 'Draft' : ''
  }, [isSaving, saveStatus, saveError, lastSaved, mode])

  // Desktop layout: side-by-side
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Fixed header with save status */}
        <StudioHeader
          mode={mode}
          saveStatus={saveStatusText}
          onPublish={handlePublish}
          canPublish={!!formData.firstName && !!formData.lastName}
        />

        <div className="flex h-[calc(100vh-64px)] pt-16">
          {/* Left: Scrollable form */}
          <div 
            ref={formRef}
            className="w-1/2 overflow-y-auto border-r border-gray-200 bg-white"
          >
            <div className="max-w-2xl mx-auto p-6 pb-20">
              <ErrorBoundary fallback="Failed to load form">
                <StudioForm
                  data={formData}
                  errors={validationErrors}
                  onChange={handleFieldChange}
                  onBulkUpdate={handleBulkUpdate}
                  mode={mode}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* Right: Sticky preview */}
          <div className="w-1/2 overflow-hidden bg-gray-100 relative">
            {/* Preview controls */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              {/* Theme switcher */}
              <select
                value={previewTheme}
                onChange={(e) => handleThemeChange(e.target.value as PreviewTheme)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm shadow-sm"
                aria-label="Preview theme"
              >
                <option value="classic">Classic</option>
                <option value="marian">Marian</option>
                <option value="photo-first">Photo First</option>
              </select>

              {/* Zoom control */}
              <button
                onClick={() => setPreviewZoom(previewZoom === '100%' ? 'mobile' : '100%')}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm shadow-sm hover:bg-gray-50"
                aria-label={`Preview at ${previewZoom === '100%' ? 'mobile' : 'desktop'} size`}
              >
                {previewZoom === '100%' ? '📱' : '🖥️'} {previewZoom}
              </button>

              {/* Full preview */}
              
                href={`/memorials/${memorialId || 'preview'}?theme=${previewTheme}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm shadow-sm hover:bg-gray-50"
                aria-label="Open full preview in new tab"
              >
                ↗️ Full
              </a>
            </div>

            {/* Preview iframe container */}
            <div 
              ref={previewRef}
              className={cn(
                "h-full flex items-center justify-center p-8",
                previewZoom === 'mobile' && "px-0"
              )}
            >
              <div className={cn(
                "bg-white shadow-2xl overflow-hidden h-full transition-all duration-300",
                previewZoom === 'mobile' ? "w-[375px] rounded-[40px] border-8 border-gray-800" : "w-full rounded-lg"
              )}>
                <ErrorBoundary fallback="Preview unavailable">
                  <MemorialPreview
                    data={previewData}
                    theme={previewTheme}
                    isLoading={saveStatus === 'saving'}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mobile layout: tabbed interface
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile header with tabs */}
      <MobileStudioTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        saveStatus={saveStatusText}
        onPublish={handlePublish}
        canPublish={!!formData.firstName && !!formData.lastName}
      />

      {/* Content area */}
      <div className="pt-28 pb-20">
        {activeTab === 'edit' ? (
          <div className="px-4 max-w-lg mx-auto">
            <ErrorBoundary fallback="Failed to load form">
              <StudioForm
                data={formData}
                errors={validationErrors}
                onChange={handleFieldChange}
                onBulkUpdate={handleBulkUpdate}
                mode={mode}
              />
            </ErrorBoundary>
          </div>
        ) : (
          <div className="h-[calc(100vh-112px)] overflow-hidden">
            <ErrorBoundary fallback="Preview unavailable">
              <MemorialPreview
                data={previewData}
                theme={previewTheme}
                isLoading={saveStatus === 'saving'}
                isMobile
              />
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* Floating preview button when editing */}
      {activeTab === 'edit' && formData.firstName && (
        <button
          onClick={() => setActiveTab('preview')}
          className="fixed bottom-6 right-6 px-6 py-3 bg-marian-blue-500 text-white rounded-full shadow-lg font-semibold z-50 hover:bg-marian-blue-600 transition-colors"
          aria-label="Preview memorial"
        >
          👁️ Preview changes
        </button>
      )}
    </div>
  )
}