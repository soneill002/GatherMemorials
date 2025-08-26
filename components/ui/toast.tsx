// components/ui/toast.tsx
// Toast notification system for user feedback
// Accessible and mobile-friendly

'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, type: Toast['type'], duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((
    message: string, 
    type: Toast['type'], 
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ 
  toasts, 
  onRemove 
}: { 
  toasts: Toast[]
  onRemove: (id: string) => void 
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center justify-between p-4 rounded-lg shadow-lg animate-slide-up",
            {
              'bg-green-500 text-white': toast.type === 'success',
              'bg-red-500 text-white': toast.type === 'error',
              'bg-blue-500 text-white': toast.type === 'info',
              'bg-yellow-500 text-white': toast.type === 'warning',
            }
          )}
          role="alert"
        >
          <span className="flex-1 mr-2">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="p-1 hover:opacity-80 transition-opacity"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

// Hook to use toast notifications
export function useToast() {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return {
    success: (message: string, duration?: number) => 
      context.addToast(message, 'success', duration),
    error: (message: string, duration?: number) => 
      context.addToast(message, 'error', duration),
    info: (message: string, duration?: number) => 
      context.addToast(message, 'info', duration),
    warning: (message: string, duration?: number) => 
      context.addToast(message, 'warning', duration),
  }
}

// Export a singleton instance for convenience
export const toast = {
  success: (message: string) => {
    // This would need to be connected to the provider
    console.log('Success:', message)
  },
  error: (message: string) => {
    console.log('Error:', message)
  },
  info: (message: string) => {
    console.log('Info:', message)
  },
  warning: (message: string) => {
    console.log('Warning:', message)
  },
}