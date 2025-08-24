// app/memorials/new/page.tsx
// Memorial creation page using proper component architecture

'use client'

import { useState } from 'react'
import FormInput from '@/components/forms/FormInput'
import { FormGroup } from '@/components/forms/FormGroup'
import type { CreateMemorialInput } from '@/types/memorial'

// Progress indicator component (could be moved to components/ui/)
function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
              ${step <= currentStep 
                ? 'bg-marian-blue-500 text-white' 
                : 'bg-gray-200 text-gray-400'}
            `}>
              {step}
            </div>
            <span className={`ml-2 text-sm ${step <= currentStep ? 'font-medium' : 'text-gray-400'}`}>
              {step === 1 ? 'Basic Info' : 'Details'}
            </span>
            {index < totalSteps - 1 && (
              <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NewMemorialPage() {
  // Form state management
  const [formData, setFormData] = useState<Partial<CreateMemorialInput>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentStep, setCurrentStep] = useState(1)

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Basic validation
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.firstName) newErrors.firstName = 'First name is required'
    if (!formData.lastName) newErrors.lastName = 'Last name is required'
    if (!formData.birthDate) newErrors.birthDate = 'Date of birth is required'
    if (!formData.deathDate) newErrors.deathDate = 'Date of passing is required'
    if (!formData.title) newErrors.title = 'Memorial title is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep1()) {
      // Move to next step or save
      setCurrentStep(2)
      console.log('Form data:', formData)
    }
  }

  // Handle save as draft
  const handleSaveDraft = () => {
    // Save to local storage or API
    console.log('Saving as draft:', formData)
  }

  return (
    <div className="container-mobile py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} totalSteps={2} />

        {/* Form Header */}
        <div className="text-center mb-8">
          <h1 className="text-title text-gray-900 mb-2">
            Create a Memorial
          </h1>
          <p className="text-body text-gray-600">
            Let's start with some basic information
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="form-section">
          {/* Name Fields */}
          <FormGroup columns={2}>
            <FormInput
              label="First Name"
              name="firstName"
              placeholder="John"
              value={formData.firstName || ''}
              onChange={handleChange}
              error={errors.firstName}
              required
            />
            <FormInput
              label="Last Name"
              name="lastName"
              placeholder="Smith"
              value={formData.lastName || ''}
              onChange={handleChange}
              error={errors.lastName}
              required
            />
          </FormGroup>

          {/* Date Fields */}
          <FormGroup columns={2}>
            <FormInput
              label="Date of Birth"
              name="birthDate"
              type="date"
              value={formData.birthDate || ''}
              onChange={handleChange}
              error={errors.birthDate}
              required
            />
            <FormInput
              label="Date of Passing"
              name="deathDate"
              type="date"
              value={formData.deathDate || ''}
              onChange={handleChange}
              error={errors.deathDate}
              required
            />
          </FormGroup>

          {/* Memorial Title */}
          <FormInput
            label="Memorial Title"
            name="title"
            placeholder="In Loving Memory of John Smith"
            hint="This will appear at the top of the memorial page"
            value={formData.title || ''}
            onChange={handleChange}
            error={errors.title}
            required
          />

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn-secondary w-full sm:w-auto"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto sm:ml-auto"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}