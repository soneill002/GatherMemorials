// lib/utils.ts
// Utility functions used across the application

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines clsx and tailwind-merge for optimal class name handling
 * This prevents Tailwind class conflicts and allows conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }).format(dateObj)
}

/**
 * Format a date for HTML date input value
 */
export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString().split('T')[0]
}

/**
 * Debounce function for performance optimization
 * Delays function execution until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for rate limiting
 * Ensures function is called at most once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Check if we're on a mobile device
 */
export function isMobileDevice():
// lib/utils.ts (continued)

export function isMobileDevice(): boolean {
 if (typeof window === 'undefined') return false
 return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

/**
* Generate a unique ID
*/
export function generateId(prefix?: string): string {
 const id = Math.random().toString(36).substr(2, 9)
 return prefix ? `${prefix}-${id}` : id
}

/**
* Sleep function for testing/debugging
*/
export function sleep(ms: number): Promise<void> {
 return new Promise(resolve => setTimeout(resolve, ms))
}

/**
* Safely parse JSON with fallback
*/
export function safeJsonParse<T>(json: string, fallback: T): T {
 try {
   return JSON.parse(json)
 } catch {
   return fallback
 }
}

/**
* Format file size for display
*/
export function formatFileSize(bytes: number): string {
 if (bytes === 0) return '0 Bytes'
 const k = 1024
 const sizes = ['Bytes', 'KB', 'MB', 'GB']
 const i = Math.floor(Math.log(bytes) / Math.log(k))
 return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
* Validate email format
*/
export function isValidEmail(email: string): boolean {
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 return emailRegex.test(email)
}

/**
* Truncate text with ellipsis
*/
export function truncate(text: string, length: number): string {
 if (text.length <= length) return text
 return text.substring(0, length) + '...'
}