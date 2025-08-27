'use client';

import { Fragment, useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { clsx } from 'clsx';

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition = 
  | 'top-right' 
  | 'top-center' 
  | 'top-left' 
  | 'bottom-right' 
  | 'bottom-center' 
  | 'bottom-left';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps extends Toast {
  onClose: (id: string) => void;
  position?: ToastPosition;
}

// Icons for each toast type
const icons = {
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Individual Toast Component
function ToastItem({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  action, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const interval = 50; // Update progress every 50ms
      const decrement = (100 / duration) * interval;
      
      const progressTimer = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - decrement;
          if (newProgress <= 0) {
            clearInterval(progressTimer);
            return 0;
          }
          return newProgress;
        });
      }, interval);

      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300); // Allow transition to complete
      }, duration);

      return () => {
        clearTimeout(dismissTimer);
        clearInterval(progressTimer);
      };
    }
  }, [id, duration, onClose]);

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconStyles = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };

  const progressStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  return (
    <Transition
      show={isVisible}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="w-full max-w-sm">
        <div 
          className={clsx(
            'relative overflow-hidden rounded-lg border p-4 shadow-lg transition-all',
            typeStyles[type]
          )}
        >
          <div className="flex items-start">
            <div className={clsx('flex-shrink-0', iconStyles[type])}>
              {icons[type]}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">
                {title}
              </p>
              {message && (
                <p className="mt-1 text-sm opacity-90">
                  {message}
                </p>
              )}
              {action && (
                <button
                  onClick={action.onClick}
                  className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none"
                >
                  {action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(id), 300);
              }}
              className="ml-4 inline-flex text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress bar */}
          {duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
              <div 
                className={clsx(
                  'h-full transition-all duration-50 ease-linear',
                  progressStyles[type]
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Transition>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
  position?: ToastPosition;
  maxToasts?: number;
}

export function ToastContainer({ 
  toasts, 
  onClose, 
  position = 'top-right',
  maxToasts = 5 
}: ToastContainerProps) {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
  };

  const isBottom = position.includes('bottom');
  const displayedToasts = toasts.slice(0, maxToasts);

  return (
    <div
      className={clsx(
        'fixed z-50 flex flex-col gap-3 pointer-events-none',
        positionStyles[position]
      )}
      style={{ maxWidth: position.includes('center') ? '90vw' : '24rem' }}
    >
      {displayedToasts.map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
          style={{
            order: isBottom ? displayedToasts.length - index : index,
          }}
        >
          <ToastItem
            {...toast}
            onClose={onClose}
            position={position}
          />
        </div>
      ))}
    </div>
  );
}

// Toast Hook for managing toasts
export function useToast(defaultPosition: ToastPosition = 'top-right') {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (title: string, message?: string, action?: Toast['action']) => {
    addToast({ type: 'success', title, message, action });
  };

  const error = (title: string, message?: string, action?: Toast['action']) => {
    addToast({ type: 'error', title, message, action });
  };

  const warning = (title: string, message?: string, action?: Toast['action']) => {
    addToast({ type: 'warning', title, message, action });
  };

  const info = (title: string, message?: string, action?: Toast['action']) => {
    addToast({ type: 'info', title, message, action });
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    ToastContainer: (props: Partial<ToastContainerProps>) => (
      <ToastContainer 
        toasts={toasts} 
        onClose={removeToast}
        position={defaultPosition}
        {...props}
      />
    ),
  };
}

// Standalone toast functions for quick use
let toastInstance: ReturnType<typeof useToast> | null = null;

export const toast = {
  success: (title: string, message?: string, action?: Toast['action']) => {
    if (toastInstance) toastInstance.success(title, message, action);
  },
  error: (title: string, message?: string, action?: Toast['action']) => {
    if (toastInstance) toastInstance.error(title, message, action);
  },
  warning: (title: string, message?: string, action?: Toast['action']) => {
    if (toastInstance) toastInstance.warning(title, message, action);
  },
  info: (title: string, message?: string, action?: Toast['action']) => {
    if (toastInstance) toastInstance.info(title, message, action);
  },
  setInstance: (instance: ReturnType<typeof useToast>) => {
    toastInstance = instance;
  },
};