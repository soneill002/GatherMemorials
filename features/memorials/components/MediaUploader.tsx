// features/memorials/components/MediaUploader.tsx
// Handles photo and video uploads with drag-and-drop, reordering, and previews
// Properly manages memory to prevent leaks

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { MemorialPhoto, MemorialVideo } from '@/types/memorial'
import { useToast } from '@/components/ui/toast'

interface MediaUploaderProps {
  photos: MemorialPhoto[]
  videos: MemorialVideo[]
  onUpload: (files: File[]) => Promise<void>
  onRemove: (id: string) => void
  onReorder: (photos: MemorialPhoto[]) => void
  onBulkUpdate?: (updates: { photos: MemorialPhoto[] }) => void // Added this prop
  isUploading?: boolean
  maxPhotos?: number
}

export default function MediaUploader({
  photos,
  videos,
  onUpload,
  onRemove,
  onReorder,
  onBulkUpdate,
  isUploading,
  maxPhotos
}: MediaUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast() // Added toast hook

  // Cleanup object URLs on unmount or when photos change
  useEffect(() => {
    return () => {
      // Revoke all object URLs to prevent memory leaks
      previewUrls.forEach(url => {
        URL.revokeObjectURL(url)
      })
    }
  }, [previewUrls])

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  // Handle drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length > 0) {
      await handleFileUpload(imageFiles)
    }
  }, []) // Will add handleFileUpload to dependencies

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      await handleFileUpload(files)
    }
  }, []) // Will add handleFileUpload to dependencies

  // Handle file upload with proper memory management
  const handleFileUpload = useCallback(async (files: File[]) => {
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid image or video file`)
        return false
      }
      
      if (!isValidSize) {
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }
      
      return true
    })

    if (validFiles.length === 0) return

    // Check photo limit
    if (maxPhotos && photos.length + validFiles.length > maxPhotos) {
      toast.error(`You can only upload ${maxPhotos} photos total`)
      return
    }

    try {
      // Create temporary preview URLs
      const newPreviewUrls = new Map(previewUrls)
      const tempPhotos: MemorialPhoto[] = []

      for (const file of validFiles) {
        const id = Math.random().toString(36).substr(2, 9)
        const url = URL.createObjectURL(file)
        
        newPreviewUrls.set(id, url)
        
        tempPhotos.push({
          id,
          memorialId: '', // Will be set by backend
          url, // Temporary URL
          thumbnailUrl: url,
          caption: '',
          uploadedBy: 'current-user',
          uploadedAt: new Date().toISOString(),
          order: photos.length + tempPhotos.length + 1
        })
      }

      setPreviewUrls(newPreviewUrls)
      
      // Show optimistic update if onBulkUpdate is provided
      if (onBulkUpdate) {
        onBulkUpdate({
          photos: [...photos, ...tempPhotos]
        })
      }

      // Upload to Cloudinary
      await onUpload(validFiles)
      
      // After successful upload, revoke the temporary URLs
      tempPhotos.forEach(photo => {
        const url = newPreviewUrls.get(photo.id)
        if (url) {
          URL.revokeObjectURL(url)
          newPreviewUrls.delete(photo.id)
        }
      })
      
      setPreviewUrls(newPreviewUrls)
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload files. Please try again.')
    }
  }, [photos, maxPhotos, onUpload, previewUrls, toast, onBulkUpdate])

  // Handle photo reordering
  const handleDragStart = useCallback((e: React.DragEvent, photoId: string) => {
    setDraggedItem(photoId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handlePhotoDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetId) return

    const draggedIndex = photos.findIndex(p => p.id === draggedItem)
    const targetIndex = photos.findIndex(p => p.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newPhotos = [...photos]
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1)
    newPhotos.splice(targetIndex, 0, draggedPhoto)

    // Update order numbers
    const reorderedPhotos = newPhotos.map((photo, index) => ({
      ...photo,
      order: index + 1
    }))

    onReorder(reorderedPhotos)
    setDraggedItem(null)
  }, [draggedItem, photos, onReorder])

  const canAddMore = !maxPhotos || photos.length < maxPhotos

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive ? "border-marian-blue-500 bg-marian-blue-50" : "border-gray-300",
          !canAddMore && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={canAddMore ? handleDrop : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={!canAddMore || isUploading}
        />

        <div className="space-y-3">
          <div className="text-4xl">📸</div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? "Drop files here" : "Add Photos & Videos"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {maxPhotos
                ? `${photos.length} of ${maxPhotos} files used`
                : "Drag and drop or click to browse"}
            </p>
          </div>
          
          {canAddMore && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-marian-blue-500 text-white rounded-lg font-medium hover:bg-marian-blue-600 disabled:opacity-50 transition-colors"
            >
              {isUploading ? "Uploading..." : "Choose Files"}
            </button>
          )}
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="w-8 h-8 border-3 border-marian-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              draggable
              onDragStart={(e) => handleDragStart(e, photo.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handlePhotoDrop(e, photo.id)}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-move group",
                draggedItem === photo.id && "opacity-50"
              )}
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || 'Memorial photo'}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onRemove(photo.id)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  aria-label="Remove photo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Order indicator */}
              <div className="absolute top-2 left-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                {photo.order}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video grid (if any) */}
      {videos.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Videos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 group"
              >
                <video
                  src={video.url}
                  className="w-full h-full object-cover"
                  controls={false}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {photos.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          💡 Tip: Drag photos to reorder them. The first photo will be the main memorial image.
        </p>
      )}
    </div>
  )
}