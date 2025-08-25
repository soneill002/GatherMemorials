// features/memorials/components/MediaUploader.tsx (FIXED VERSION)
// Properly handles memory management for object URLs

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { MemorialPhoto, MemorialVideo } from '@/types/memorial'

interface MediaUploaderProps {
  photos: MemorialPhoto[]
  videos: MemorialVideo[]
  onUpload: (files: File[]) => Promise<void>
  onRemove: (id: string) => void
  onReorder: (photos: MemorialPhoto[]) => void
  isUploading?: boolean
  maxPhotos?: number
}

export default function MediaUploader({
  photos,
  videos,
  onUpload,
  onRemove,
  onReorder,
  isUploading,
  maxPhotos
}: MediaUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup object URLs on unmount or when photos change
  useEffect(() => {
    return () => {
      // Revoke all object URLs to prevent memory leaks
      previewUrls.forEach(url => {
        URL.revokeObjectURL(url)
      })
    }
  }, [previewUrls])

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
      
      // Show optimistic update
      onBulkUpdate({
        photos: [...photos, ...tempPhotos]
      })

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
  }, [photos, maxPhotos, onUpload, previewUrls])

  // Rest of the component remains the same but uses handleFileUpload...
  // (Previous drag/drop handlers, UI, etc.)
}