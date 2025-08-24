// components/forms/FormGroup.tsx
// Responsive form group component for managing form layouts

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormGroupProps {
  children: ReactNode
  className?: string
  columns?: 1 | 2 | 3 | 4
  mobileColumns?: 1 | 2
}

/**
 * FormGroup - Handles responsive grid layouts for form fields
 * Mobile-first with configurable column layouts
 */
export function FormGroup({ 
  children, 
  className,
  columns = 1,
  mobileColumns = 1
}: FormGroupProps) {
  const gridClasses = cn(
    'form-group',
    // Mobile-first grid
    mobileColumns === 1 && 'grid-cols-1',
    mobileColumns === 2 && 'grid-cols-2',
    // Desktop grid (sm breakpoint and up)
    columns === 1 && 'sm:grid-cols-1',
    columns === 2 && 'sm:grid-cols-2',
    columns === 3 && 'sm:grid-cols-3',
    columns === 4 && 'sm:grid-cols-4',
    className
  )
  
  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}