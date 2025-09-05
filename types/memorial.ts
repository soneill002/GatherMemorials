// Memorial Type Definitions

export interface Memorial {
  id: string;
  user_id: string;
  
  // Step 1: Basic Info
  first_name: string;
  middle_name?: string;
  last_name: string;
  nickname?: string;
  date_of_birth: string;
  date_of_death: string;
  featured_image_url?: string;
  cover_photo_url?: string;
  
  // Step 2: Headline
  headline: string;
  
  // Step 3: Obituary
  obituary?: string;
  
  // Step 4: Service Information
  services?: ServiceEvent[];
  
  // Step 5: Donations
  donations?: DonationLink[];
  
  // Step 6: Gallery
  gallery_enabled: boolean;
  gallery_items?: GalleryItem[];
  
  // Step 7: Guestbook
  guestbook_enabled: boolean;
  guestbook_moderation: boolean;
  
  // Step 8: Privacy
  privacy_setting: 'public' | 'private' | 'password';
  password_hash?: string;
  custom_url?: string;
  
  // System fields
  status: 'draft' | 'published';
  payment_status: 'pending' | 'completed' | 'failed';
  payment_id?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  view_count: number;
}

export interface ServiceEvent {
  id: string;
  memorial_id: string;
  type: 'visitation' | 'funeral' | 'burial' | 'celebration';
  name: string;
  date: string;
  time: string;
  location_name: string;
  location_address: string;
  location_lat?: number;
  location_lng?: number;
  additional_info?: string;
  order_index: number;
}

export interface DonationLink {
  id: string;
  memorial_id: string;
  type: 'charity' | 'gofundme' | 'parish' | 'other';
  organization_name: string;
  url: string;
  description?: string;
  order_index: number;
}

export interface GalleryItem {
  id: string;
  memorial_id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail_url?: string;
  caption?: string;
  uploaded_by: string;
  order_index: number;
  created_at: string;
}

export interface GuestbookEntry {
  id: string;
  memorial_id: string;
  user_id: string;
  author_name: string;
  author_email: string;
  message: string;
  photo_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  moderated_by?: string;
  moderated_at?: string;
  created_at: string;
  updated_at: string;
}

// Memorial Creation Wizard Types
export interface MemorialFormData {
  // Step 1
  basicInfo: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    nickname?: string;
    date_of_birth: string;
    date_of_death: string;
    featured_image?: File | string;
    cover_photo?: File | string;
  };
  
  // Step 2
  headline: string;
  
  // Step 3
  obituary: string;
  
  // Step 4
  services: Omit<ServiceEvent, 'id' | 'memorial_id'>[];
  
  // Step 5
  donations: Omit<DonationLink, 'id' | 'memorial_id'>[];
  
  // Step 6
  gallery: {
    enabled: boolean;
    items: File[];
  };
  
  // Step 7
  guestbook: {
    enabled: boolean;
    moderation: boolean;
  };
  
  // Step 8
  privacy: {
    setting: 'public' | 'private' | 'password';
    password?: string;
    custom_url?: string;
  };
}

export interface MemorialWizardStep {
  id: number;
  title: string;
  description: string;
  component: string;
  validation?: any; // Will be Zod schema
  isOptional?: boolean;
}

export const MEMORIAL_WIZARD_STEPS: MemorialWizardStep[] = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Name, dates, and photos',
    component: 'BasicInfoStep',
  },
  {
    id: 2,
    title: 'Headline',
    description: 'A meaningful tribute headline',
    component: 'HeadlineStep',
  },
  {
    id: 3,
    title: 'Obituary',
    description: 'Share their life story',
    component: 'ObituaryStep',
  },
  {
    id: 4,
    title: 'Service Information',
    description: 'Funeral and memorial service details',
    component: 'ServiceStep',
    isOptional: true,
  },
  {
    id: 5,
    title: 'Memorial Donations',
    description: 'Charity and donation information',
    component: 'DonationStep',
    isOptional: true,
  },
  {
    id: 6,
    title: 'Photo & Video Gallery',
    description: 'Upload photos and videos',
    component: 'GalleryStep',
    isOptional: true,
  },
  {
    id: 7,
    title: 'Guestbook Settings',
    description: 'Enable visitor messages',
    component: 'GuestbookStep',
  },
  {
    id: 8,
    title: 'Privacy & Sharing',
    description: 'Control who can view the memorial',
    component: 'PrivacyStep',
  },
  {
    id: 9,
    title: 'Review & Publish',
    description: 'Preview and complete payment',
    component: 'ReviewStep',
  },
];

// Standard Cover Photo Options
export const STANDARD_COVER_PHOTOS = [
  {
    id: 'peaceful-field',
    name: 'Peaceful Field',
    url: '/images/cover-photos/peaceful-field.jpg',
    thumbnail: '/images/cover-photos/peaceful-field-thumb.jpg',
  },
  {
    id: 'stained-glass',
    name: 'Stained Glass Window',
    url: '/images/cover-photos/stained-glass.jpg',
    thumbnail: '/images/cover-photos/stained-glass-thumb.jpg',
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    url: '/images/cover-photos/ocean-waves.jpg',
    thumbnail: '/images/cover-photos/ocean-waves-thumb.jpg',
  },
  {
    id: 'forest',
    name: 'Forest Path',
    url: '/images/cover-photos/forest.jpg',
    thumbnail: '/images/cover-photos/forest-thumb.jpg',
  },
];

// Service Type Labels
export const SERVICE_TYPE_LABELS = {
  visitation: 'Visitation',
  funeral: 'Funeral Mass',
  burial: 'Burial',
  celebration: 'Celebration of Life',
} as const;

// Donation Type Labels
export const DONATION_TYPE_LABELS = {
  charity: 'Charity',
  gofundme: 'GoFundMe',
  parish: 'Parish/Church',
  other: 'Other',
} as const;

// Re-export MemorialStatus from database types
export { type MemorialStatus } from '@/types/database';