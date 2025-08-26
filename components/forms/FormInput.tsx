// components/forms/FormInput.tsx
// Reusable, accessible, mobile-first form input component

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils' // We'll create this utility

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  containerClassName?: string
}

/**
 * FormInput - A mobile-first, accessible input component
 * Handles all input types including problematic date inputs on mobile
 */
const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ 
    label, 
    error, 
    hint, 
    containerClassName,
    className,
    id,
    required,
    type = 'text',
    ...props 
  }, ref) => {
    // Generate ID if not provided (for label association)
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    // Special handling for date inputs on mobile
    const isDateInput = type === 'date' || type === 'datetime-local'
    
    return (
      <div className={cn('form-input-container', containerClassName)}>
       {label && (
  <label 
    htmlFor={inputId}
    className="form-input-label"
  >
    {label}
  </label>
)}
        
        <div className={cn(
          'form-input-wrapper',
          isDateInput && 'date-input-wrapper'
        )}>
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'form-input',
              isDateInput && 'form-input-date',
              error && 'form-input-error',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
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

FormInput.displayName = 'FormInput'

export default FormInput