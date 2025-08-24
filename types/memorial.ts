// TypeScript type definitions for memorials
// These ensure type safety across your entire application

import type { MemorialStatus, MemorialPrivacy } from '@/lib/constants'

// Main memorial type
export interface Memorial {
  id: string
  userId: string
  
// Basic information
title: string
firstName: string
middleName?: string | null
lastName: string
nickname?: string | null
birthDate: Date | string
deathDate: Date | string

  // Content
  obituary: string | null
  biography: string | null
  
  // Media
  profilePhotoUrl: string | null
  coverPhotoUrl: string | null
  photos: MemorialPhoto[]
  videos: MemorialVideo[]
  
  // Settings
  status: MemorialStatus
  privacy: MemorialPrivacy
  password: string | null // Hashed password for protected memorials
  customUrl: string | null
  
  // Catholic features
  prayers: Prayer[]
  massIntentions: MassIntention[]
  parishId: string | null
  
  // Metadata
  createdAt: Date | string
  updatedAt: Date | string
  publishedAt: Date | string | null
  expiresAt: Date | string | null
  viewCount: number
  
  // Payment
  pricingTier: 'free' | 'standard' | 'eternal'
  stripePaymentId: string | null
}

// Photo type
export interface MemorialPhoto {
  id: string
  memorialId: string
  url: string
  thumbnailUrl: string
  caption: string | null
  uploadedBy: string
  uploadedAt: Date | string
  order: number
}

// Video type
export interface MemorialVideo {
  id: string
  memorialId: string
  url: string
  thumbnailUrl: string | null
  title: string | null
  duration: number | null
  uploadedBy: string
  uploadedAt: Date | string
}

// Prayer/Candle type
export interface Prayer {
  id: string
  memorialId: string
  name: string
  message: string
  isAnonymous: boolean
  candleLit: boolean
  createdAt: Date | string
}

// Mass intention type
export interface MassIntention {
  id: string
  memorialId: string
  parishId: string
  requestedBy: string
  intentionDate: Date | string
  notes: string | null
  confirmed: boolean
  createdAt: Date | string
}

// Contributor type
export interface MemorialContributor {
  id: string
  memorialId: string
  email: string
  name: string | null
  role: 'viewer' | 'contributor' | 'admin'
  invitedBy: string
  invitedAt: Date | string
  acceptedAt: Date | string | null
  permissions: {
    canEdit: boolean
    canUploadPhotos: boolean
    canInviteOthers: boolean
    canDelete: boolean
  }
}

// Form types for creating/editing
export interface CreateMemorialInput {
  title: string
  firstName: string
  middleName?: string
  lastName: string
  nickname?: string
  birthDate: string
  deathDate: string
  obituary?: string
  privacy?: MemorialPrivacy
  password?: string
}

export interface UpdateMemorialInput extends Partial<CreateMemorialInput> {
  biography?: string
  customUrl?: string
  parishId?: string
}

// API response types
export interface MemorialResponse {
  memorial: Memorial
  isOwner: boolean
  userRole: 'owner' | 'contributor' | 'viewer'
}

export interface MemorialListResponse {
  memorials: Memorial[]
  total: number
  page: number
  pageSize: number
}