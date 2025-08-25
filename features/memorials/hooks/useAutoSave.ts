// features/memorials/hooks/useAutoSave.ts
// Auto-save hook with debouncing and conflict resolution

import { useEffect, useRef, useState, useCallback } from 'react'
import { Memorial } from '@/types/memorial'
import { saveMemorial } from '../api/client'
import { debounce } from '@/lib/utils'

interface UseAutoSaveOptions {
  data: Partial<Memorial>
  memorialId?: string
  enabled?: boolean
  delay?: number
  onSuccess?: (id: string) => void
  onError?: (error: Error) => void
}

export function useAutoSave({
  data,
  memorialId,
  enabled = true,
  delay = 2000,
  onSuccess,
  onError
}: UseAutoSaveOptions) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<Error | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedDataRef = useRef<string>('')
  const abortControllerRef = useRef<AbortController>()

  // Create debounced save function
  const debouncedSave = useCallback(
    debounce(async (data: Partial<Memorial>) => {
      // Skip if data hasn't changed
      const dataString = JSON.stringify(data)
      if (dataString === lastSavedDataRef.current) {
        return
      }

      // Cancel previous save if in progress
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      setStatus('saving')
      setError(null)

      try {
        const { id, error } = await saveMemorial(data, memorialId, {
          signal: abortControllerRef.current.signal
        })

        if (error) throw error

        lastSavedDataRef.current = dataString
        setStatus('saved')
        
        if (id && onSuccess) {
          onSuccess(id)
        }
      } catch (err) {
        // Ignore abort errors
        if ((err as any)?.name === 'AbortError') return
        
        const error = err as Error
        setStatus('error')
        setError(error)
        
        if (onError) {
          onError(error)
        }
      }
    }, delay),
    [memorialId, delay, onSuccess, onError]
  )

  // Trigger save when data changes
  useEffect(() => {
    if (!enabled) return

    debouncedSave(data)

    return () => {
      // Cleanup on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [data, enabled, debouncedSave])

  // Force save function
  const save = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setStatus('saving')

    try {
      const { id, error } = await saveMemorial(data, memorialId, {
        signal: abortControllerRef.current.signal
      })

      if (error) throw error

      lastSavedDataRef.current = JSON.stringify(data)
      setStatus('saved')
      
      if (id && onSuccess) {
        onSuccess(id)
      }

      return { id, error: null }
    } catch (err) {
      const error = err as Error
      setStatus('error')
      setError(error)
      
      if (onError) {
        onError(error)
      }

      return { id: null, error }
    }
  }, [data, memorialId, onSuccess, onError])

  return {
    status,
    error,
    save
  }
}