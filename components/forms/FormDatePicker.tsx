// components/forms/FormDatePicker.tsx
// Date picker component with mobile-friendly input

'use client'

import { forwardRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { formatDateForInput } from '@/lib/utils'

interface FormDatePickerProps {
  label?: string
  name: string
  value?: Date
  onChange: (date: Date | null) => void
  error?: string
  hint?: string
  required?: boolean
  min?: Date
  max?: Date
  containerClassName?: string
  className?: string
}

const FormDatePicker = forwardRef<HTMLInputElement, FormDatePickerProps>(
  ({ 
    label, 
    name,
    value,
    onChange,
    error, 
    hint, 
    required,
    min,
    max,
    containerClassName,
    className
  }, ref) => {
    const inputId = `date-${name}-${Math.random().toString(36).substr(2, 9)}`

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const dateString = e.target.value
      if (dateString) {
        const date = new Date(dateString + 'T00:00:00')
        onChange(date)
      } else {
        onChange(null)
      }
    }, [onChange])

    const dateValue = value ? formatDateForInput(value) : ''
    const minValue = min ? formatDateForInput(min) : undefined
    const maxValue = max ? formatDateForInput(max) : undefined

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
        
        <div className="form-input-wrapper date-input-wrapper">
          <input
            ref={ref}
            id={inputId}
            name={name}
            type="date"
            value={dateValue}
            onChange={handleChange}
            min={minValue}
            max={maxValue}
            className={cn(
              'form-input form-input-date',
              error && 'form-input-error',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            required={required}
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

FormDatePicker.displayName = 'FormDatePicker'

export default FormDatePicker