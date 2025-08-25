// features/memorials/components/StudioHeader.tsx
// Desktop header for the memorial studio with save status and actions

'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'

interface StudioHeaderProps {
  mode: 'create' | 'edit'
  saveStatus: string
  onPublish: () => void
  canPublish: boolean
}

export default function StudioHeader({ 
  mode, 
  saveStatus, 
  onPublish, 
  canPublish 
}: StudioHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Logo and back */}
        <div className="flex items-center gap-4">
          <Link 
            href="/account"
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Back to account"
          >
            ← Back
          </Link>
          <div className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'Create Memorial' : 'Edit Memorial'}
          </div>
        </div>

        {/* Center: Save status */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
            saveStatus.includes('Saved') ? "bg-green-50 text-green-700" : 
            saveStatus.includes('Saving') ? "bg-blue-50 text-blue-700" :
            saveStatus.includes('Failed') ? "bg-red-50 text-red-700" :
            "bg-gray-50 text-gray-600"
          )}>
            {saveStatus.includes('Saving') && (
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
            {saveStatus}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPublish}
            disabled={!canPublish}
            className={cn(
              "px-6 py-2 rounded-lg font-semibold transition-all",
              canPublish
                ? "bg-marian-blue-500 text-white hover:bg-marian-blue-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            {mode === 'create' ? 'Publish' : 'Update'} →
          </button>
        </div>
      </div>
    </header>
  )
}