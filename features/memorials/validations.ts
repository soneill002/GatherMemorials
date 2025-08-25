// features/memorials/validations.ts
// Validation logic for memorial forms

import { Memorial } from '@/types/memorial'

interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateMemorial(data: Partial<Memorial>): ValidationResult {
  const errors: Record<string, string> = {}

  // Required fields
  if (!data.firstName?.trim()) {
    errors.firstName = 'First name is required'
  }

  if (!data.lastName?.trim()) {
    errors.lastName = 'Last name is required'
  }

  if (!data.birthDate) {
    errors.birthDate = 'Date of birth is required'
  }

  if (!data.deathDate) {
    errors.deathDate = 'Date of passing is required'
  }

  if (!data.title?.trim()) {
    errors.title = 'Memorial title is required'
  }

  // Date validation
  if (data.birthDate && data.deathDate) {
    const birth = new Date(data.birthDate)
    const death = new Date(data.deathDate)
    
    if (birth >= death) {
      errors.deathDate = 'Date of passing must be after date of birth'
    }
    
    if (death > new Date()) {
      errors.deathDate = 'Date of passing cannot be in the future'
    }
  }

  // Password validation for password-protected memorials
  if (data.privacy === 'password_protected' && !data.password) {
    errors.password = 'Password is required for password-protected memorials'
  }

  // Custom URL validation
  if (data.customUrl) {
    const urlRegex = /^[a-z0-9-]+$/
    if (!urlRegex.test(data.customUrl)) {
      errors.customUrl = 'URL can only contain lowercase letters, numbers, and hyphens'
    }
    
    if (data.customUrl.length < 3) {
      errors.customUrl = 'URL must be at least 3 characters long'
    }
    
    if (data.customUrl.length > 50) {
      errors.customUrl = 'URL must be less than 50 characters'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}