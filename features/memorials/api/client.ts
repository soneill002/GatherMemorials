// features/memorials/api/client.ts
// Client-side API functions for memorial operations

import { Memorial } from '@/types/memorial'

const API_BASE = '/api/memorials'

export interface CreateMemorialResponse {
  id: string
  customUrl: string
}

export interface UpdateMemorialResponse {
  success: boolean
  data: Memorial
}

/**
 * Create a new memorial
 */
export async function createMemorial(data: Partial<Memorial>): Promise<CreateMemorialResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create memorial')
  }

  return response.json()
}

/**
 * Update an existing memorial
 */
export async function updateMemorial(
  id: string,
  data: Partial<Memorial>
): Promise<UpdateMemorialResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update memorial')
  }

  return response.json()
}

/**
 * Get a memorial by ID
 */
export async function getMemorial(id: string): Promise<Memorial> {
  const response = await fetch(`${API_BASE}/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch memorial')
  }

  return response.json()
}

/**
 * Delete a memorial
 */
export async function deleteMemorial(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete memorial')
  }

  return response.json()
}

/**
 * Save memorial (create or update)
 * Used by auto-save functionality
 */
export async function saveMemorial(
  data: Partial<Memorial>,
  id?: string
): Promise<{ id: string; success: boolean }> {
  if (id) {
    // Update existing
    const result = await updateMemorial(id, data)
    return { id, success: result.success }
  } else {
    // Create new
    const result = await createMemorial(data)
    return { id: result.id, success: true }
  }
}

/**
 * Check if a custom URL is available
 */
export async function checkUrlAvailability(url: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/check-url?url=${encodeURIComponent(url)}`)
  
  if (!response.ok) {
    return false
  }

  const result = await response.json()
  return result.available
}

/**
 * Upload media for a memorial
 */
export async function uploadMemorialMedia(
  memorialId: string,
  file: File
): Promise<{ url: string; thumbnailUrl?: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('memorialId', memorialId)

  const response = await fetch('/api/uploads', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to upload media')
  }

  return response.json()
}