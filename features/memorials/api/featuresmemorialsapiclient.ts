// features/memorials/api/client.ts
// Client-side API functions for memorial operations

import { Memorial } from '@/types/memorial'

interface SaveOptions {
  signal?: AbortSignal
}

export async function saveMemorial(
  data: Partial<Memorial>,
  memorialId?: string,
  options?: SaveOptions
): Promise<{ id: string | null; error: Error | null }> {
  try {
    const url = memorialId 
      ? `/api/memorials/${memorialId}`
      : '/api/memorials'
    
    const method = memorialId ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: options?.signal
    })

    if (!response.ok) {
      throw new Error(`Failed to save: ${response.statusText}`)
    }

    const result = await response.json()
    return { id: result.id, error: null }
  } catch (error) {
    return { id: null, error: error as Error }
  }
}