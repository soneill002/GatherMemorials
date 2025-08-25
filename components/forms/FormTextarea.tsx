// components/forms/FormTextarea.tsx
// Reusable textarea component with character count and auto-resize

'use client'

import { forwardRef, TextareaHTMLAttributes, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  containerClassName?: string
  showCharCount?: boolean
  autoResize?: boolean
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ 
    label, 
    error, 
    hint, 
    containerClassName,
    className,
    id,
    required,
    maxLength,
    showCharCount,
    autoResize,
    value,
    ...props 
  }, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    // Auto-resize functionality
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [value, autoResize])

    // Combine refs
    const setRefs = (el: HTMLTextAreaElement | null) => {
      textareaRef.current = el
      if (ref) {
        if (typeof ref === 'function') {
          ref(el)
        } else {
          ref.current = el
        }
      }
    }

    const currentLength = value ? String(value).length : 0

    return (
      <div className={cn('form-input-container', containerClassName)}>
        {label && (
          <label 
            htmlFor={inputId}
            className="form-input-label"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <textarea
            ref={setRefs}
            id={inputId}
            value={value}
            maxLength={maxLength}
            className={cn(
              'form-input',
              'resize-none',
              autoResize && 'overflow-hidden',
              error && 'form-input-error',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          
          {showCharCount && maxLength && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
              {currentLength} / {maxLength}
            </div>
          )}
        </div>
        
        {hint && !error && (
          <p id={`${inputId}-hint`} className="form-input-hint">
            {hint}
          </p>
        )}
        
        {error && (
          <p id={`${inputId}-error`} className="form-input-error-message" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'

export default FormTextarea