// features/memorials/components/MobileStudioTabs.tsx
// Mobile header with tab navigation for edit/preview modes

'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'

interface MobileStudioTabsProps {
  activeTab: 'edit' | 'preview'
  onTabChange: (tab: 'edit' | 'preview') => void
  saveStatus: string
  onPublish: () => void
  canPublish: boolean
}

export default function MobileStudioTabs({
  activeTab,
  onTabChange,
  saveStatus,
  onPublish,
  canPublish
}: MobileStudioTabsProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
      {/* Top bar with actions */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100">
        <Link 
          href="/account"
          className="text-gray-600"
          aria-label="Back"
        >
          ← Back
        </Link>
        
        <div className="text-xs text-gray-500">
          {saveStatus}
        </div>

        <button
          onClick={onPublish}
          disabled={!canPublish}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-semibold",
            canPublish
              ? "bg-marian-blue-500 text-white"
              : "bg-gray-100 text-gray-400"
          )}
        >
          Publish
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex h-14">
        <button
          onClick={() => onTabChange('edit')}
          className={cn(
            "flex-1 flex items-center justify-center font-semibold transition-colors relative",
            activeTab === 'edit'
              ? "text-marian-blue-500"
              : "text-gray-500"
          )}
          aria-current={activeTab === 'edit' ? 'page' : undefined}
        >
          Edit
          {activeTab === 'edit' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-marian-blue-500" />
          )}
        </button>

        <button
          onClick={() => onTabChange('preview')}
          className={cn(
            "flex-1 flex items-center justify-center font-semibold transition-colors relative",
            activeTab === 'preview'
              ? "text-marian-blue-500"
              : "text-gray-500"
          )}
          aria-current={activeTab === 'preview' ? 'page' : undefined}
        >
          Preview
          {activeTab === 'preview' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-marian-blue-500" />
          )}
        </button>
      </div>
    </header>
  )
}