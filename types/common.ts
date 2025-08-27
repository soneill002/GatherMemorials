// Common/Shared Type Definitions

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form Types
export interface FormState<T = any> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'time' | 'file';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: SelectOption[];
  validation?: FieldValidation;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

// File Upload Types
export interface UploadedFile {
  id: string;
  url: string;
  thumbnail_url?: string;
  filename: string;
  size: number;
  mime_type: string;
  width?: number;
  height?: number;
  uploaded_at: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// SEO & Meta Types
export interface MetaTags {
  title: string;
  description: string;
  keywords?: string[];
  og?: OpenGraphTags;
  twitter?: TwitterCardTags;
  canonical?: string;
  robots?: string;
}

export interface OpenGraphTags {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  site_name?: string;
  locale?: string;
}

export interface TwitterCardTags {
  card: 'summary' | 'summary_large_image';
  title: string;
  description: string;
  image: string;
  site?: string;
  creator?: string;
}

// Navigation Types
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

export interface Breadcrumb {
  label: string;
  href?: string;
  current?: boolean;
}

// Modal & Dialog Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  showCloseButton?: boolean;
}

export interface DialogAction {
  label: string;
  action: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

// Toast/Notification Types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Date & Time Types
export interface DateRange {
  start: Date | string;
  end: Date | string;
}

export interface TimeSlot {
  start: string; // "HH:mm" format
  end: string;   // "HH:mm" format
  available?: boolean;
}

// Address Types
export interface Address {
  street_1: string;
  street_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  lat?: number;
  lng?: number;
}

// Share Types
export interface ShareData {
  url: string;
  title: string;
  description?: string;
  image?: string;
  via?: string;
}

export interface SharePlatform {
  name: 'facebook' | 'twitter' | 'email' | 'whatsapp' | 'copy';
  icon: string;
  action: (data: ShareData) => void;
}

// Analytics Types
export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface PageView {
  path: string;
  title: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

// Status Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: LoadingState;
}

// Error Boundary Types
export interface ErrorInfo {
  componentStack: string;
  digest?: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

// Environment Types
export type Environment = 'development' | 'staging' | 'production';

// Feature Flag Types
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  userGroups?: string[];
}

// Constants
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export const MAX_FILE_SIZE = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
} as const;

export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type ValueOf<T> = T[keyof T];

// Re-export for convenience
export type { Memorial, ServiceEvent, GalleryItem, GuestbookEntry } from './memorial';
export type { User, UserProfile, UserSession, PrayerListEntry } from './user';