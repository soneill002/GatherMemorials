// Central constants file for type-safe, maintainable configuration
// This follows the DRY principle - define once, use everywhere

// Memorial-related constants
export const MEMORIAL_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export const MEMORIAL_PRIVACY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  PASSWORD: 'password_protected',
} as const

// Pricing tiers
export const PRICING_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Basic memorial page',
      'Up to 10 photos',
      '30-day duration',
      'Share via link',
    ],
  },
  STANDARD: {
    id: 'standard',
    name: 'Standard',
    price: 29.99,
    features: [
      'Everything in Free',
      'Unlimited photos',
      '1-year duration',
      'Virtual candles',
      'Prayer request book',
      'Custom URL',
    ],
  },
  ETERNAL: {
    id: 'eternal',
    name: 'Eternal',
    price: 99.99,
    features: [
      'Everything in Standard',
      'Lifetime duration',
      'Video uploads',
      'Parish integration',
      'Download archive',
      'Priority support',
    ],
  },
} as const

// API endpoints (when you need them)
export const API_ROUTES = {
  MEMORIALS: '/api/memorials',
  AUTH: '/api/auth',
  UPLOAD: '/api/upload',
  STRIPE: '/api/stripe',
} as const

// External service URLs
export const EXTERNAL_URLS = {
  SUPPORT: 'https://support.catholicmemorials.com',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  PARISH_SIGNUP: '/partners',
} as const

// Validation rules
export const VALIDATION = {
  MEMORIAL_TITLE_MAX: 100,
  MEMORIAL_DESCRIPTION_MAX: 5000,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
} as const

// SEO defaults
export const SEO = {
  DEFAULT_TITLE: 'Catholic Memorials',
  TITLE_TEMPLATE: '%s | Catholic Memorials',
  DEFAULT_DESCRIPTION: 'Create beautiful, faith-centered digital memorials with prayers, virtual candles, and parish support.',
} as const

// Mobile breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

// Type helpers for TypeScript
export type MemorialStatus = typeof MEMORIAL_STATUS[keyof typeof MEMORIAL_STATUS]
export type MemorialPrivacy = typeof MEMORIAL_PRIVACY[keyof typeof MEMORIAL_PRIVACY]
export type PricingTierId = keyof typeof PRICING_TIERS