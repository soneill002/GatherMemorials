// features/memorials/components/MemorialPreview.tsx
// Live preview component that renders the memorial as visitors will see it
// Supports multiple themes and responsive preview

'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Memorial } from '@/types/memorial'
import { formatDate } from '@/lib/utils'

interface MemorialPreviewProps {
  data: Partial<Memorial>
  theme: 'classic' | 'marian' | 'photo-first'
  isLoading?: boolean
  isMobile?: boolean
}

export default function MemorialPreview({
  data,
  theme,
  isLoading,
  isMobile
}: MemorialPreviewProps) {
  // Calculate display name
  const displayName = useMemo(() => {
    const parts = []
    if (data.firstName) parts.push(data.firstName)
    if (data.middleName) parts.push(data.middleName)
    if (data.lastName) parts.push(data.lastName)
    return parts.join(' ') || 'Your Loved One'
  }, [data.firstName, data.middleName, data.lastName])

  // Calculate life span
  const lifeSpan = useMemo(() => {
    if (!data.birthDate || !data.deathDate) return ''
    const birth = new Date(data.birthDate).getFullYear()
    const death = new Date(data.deathDate).getFullYear()
    return `${birth} – ${death}`
  }, [data.birthDate, data.deathDate])

  // Theme-specific styles
  const themeStyles = {
    classic: {
      container: 'bg-white',
      header: 'bg-gradient-to-b from-gray-50 to-white',
      text: 'text-gray-900',
      accent: 'text-marian-blue-500'
    },
    marian: {
      container: 'bg-gradient-to-b from-marian-blue-50 to-white',
      header: 'bg-gradient-to-b from-marian-blue-100 to-marian-blue-50',
      text: 'text-gray-900',
      accent: 'text-marian-blue-600'
    },
    'photo-first': {
      container: 'bg-black',
      header: 'bg-gradient-to-b from-black/80 to-transparent absolute inset-0',
      text: 'text-white',
      accent: 'text-liturgical-gold-400'
    }
  }[theme]

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-marian-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Updating preview...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "h-full overflow-y-auto",
      themeStyles.container,
      isMobile && "safe-padding-top safe-padding-bottom"
    )}>
      {/* Hero Section */}
      <div className={cn(
        "relative min-h-[400px] flex items-center justify-center p-8",
        theme === 'photo-first' && data.coverPhotoUrl && "min-h-[600px]"
      )}>
        {/* Background image for photo-first theme */}
        {theme === 'photo-first' && data.coverPhotoUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${data.coverPhotoUrl})` }}
          >
            <div className={themeStyles.header} />
          </div>
        )}

        {/* Content */}
        <div className={cn(
          "relative z-10 text-center max-w-3xl mx-auto",
          theme !== 'photo-first' && themeStyles.header,
          theme !== 'photo-first' && "p-12 rounded-lg"
        )}>
          {/* Profile photo */}
          {data.profilePhotoUrl && (
            <div className="mb-6">
              <img
                src={data.profilePhotoUrl}
                alt={displayName}
                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-xl"
              />
            </div>
          )}

          {/* Name and dates */}
          <h1 className={cn(
            "text-4xl font-serif font-bold mb-2",
            themeStyles.text
          )}>
            {displayName}
          </h1>
          
          {lifeSpan && (
            <p className={cn(
              "text-xl mb-4",
              theme === 'photo-first' ? 'text-white/90' : 'text-gray-600'
            )}>
              {lifeSpan}
            </p>
          )}

          {/* Memorial title */}
          {data.title && (
            <p className={cn(
              "text-lg italic",
              themeStyles.accent
            )}>
              {data.title}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-12">
        {/* Obituary */}
        {data.obituary && (
          <section>
            <h2 className="text-2xl font-serif font-semibold mb-4 text-gray-900">
              Life Story
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {data.obituary}
              </p>
            </div>
          </section>
        )}

        {/* Photo Gallery */}
        {data.photos && data.photos.length > 0 && (
          <section>
            <h2 className="text-2xl font-serif font-semibold mb-6 text-gray-900">
              Photo Memories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.photos.slice(0, 8).map((photo) => (
                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.caption || 'Memorial photo'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
              {data.photos.length > 8 && (
                <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-400">
                      +{data.photos.length - 8}
                    </p>
                    <p className="text-sm text-gray-500">more photos</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Prayer Section */}
        {data.enablePrayers && (
          <section className="bg-marian-blue-50 rounded-xl p-8">
            <h2 className="text-2xl font-serif font-semibold mb-6 text-center text-marian-blue-900">
              Light a Candle & Pray
            </h2>
            <div className="flex justify-center mb-6">
              <div className="text-6xl">🕯️</div>
            </div>
            <p className="text-center text-gray-700 mb-6">
              Light a virtual candle and leave a prayer for {data.firstName || 'your loved one'}
            </p>
            <div className="flex justify-center">
              <button className="px-6 py-3 bg-marian-blue-500 text-white rounded-lg font-semibold hover:bg-marian-blue-600 transition-colors">
                Light a Candle
              </button>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Created with love on Gather Memorials
          </p>
        </footer>
      </div>
    </div>
  )
}