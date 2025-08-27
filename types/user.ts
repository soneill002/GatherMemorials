// User Type Definitions

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  last_sign_in: string | null;
  
  // Profile data
  profile?: UserProfile;
  
  // Related data counts
  memorial_count?: number;
  prayer_list_count?: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  
  // Personal information
  first_name: string;
  last_name: string;
  display_name?: string;
  phone?: string;
  
  // Preferences
  timezone: string;
  email_notifications: boolean;
  prayer_reminders: boolean;
  guestbook_notifications: boolean;
  marketing_emails: boolean;
  
  // Account type
  account_type: 'free' | 'premium' | 'admin';
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
}

// Prayer List Types
export interface PrayerListEntry {
  id: string;
  user_id: string;
  memorial_id: string;
  
  // Memorial reference
  memorial?: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    date_of_death: string;
    featured_image_url?: string;
  };
  
  // User notes
  personal_notes?: string;
  
  // Dates
  added_date: string;
  last_prayed?: string;
  
  // Reminder preferences
  remind_on_birthday: boolean;
  remind_on_death_anniversary: boolean;
  remind_on_holy_days: boolean;
}

export interface PrayerReminder {
  id: string;
  user_id: string;
  
  // Reminder settings
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'anniversary_only';
  time_of_day: string; // "09:00" format
  
  // Specific date reminders
  remind_all_souls_day: boolean;
  remind_all_saints_day: boolean;
  remind_easter: boolean;
  remind_christmas: boolean;
  remind_good_friday: boolean;
  
  // Email preferences
  email_format: 'simple' | 'detailed';
  include_prayer_suggestions: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// User Memorial Management
export interface UserMemorial {
  id: string;
  user_id: string;
  memorial_id: string;
  role: 'owner' | 'contributor' | 'viewer';
  
  // Permissions
  can_edit: boolean;
  can_delete: boolean;
  can_moderate_guestbook: boolean;
  can_view_analytics: boolean;
  
  // Metadata
  created_at: string;
  last_accessed?: string;
}

// Authentication Types
export interface SignUpData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  terms_accepted: boolean;
}

export interface SignInData {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Account Settings Types
export interface AccountSettings {
  profile: {
    first_name: string;
    last_name: string;
    display_name?: string;
    phone?: string;
    timezone: string;
  };
  
  notifications: {
    email_notifications: boolean;
    prayer_reminders: boolean;
    guestbook_notifications: boolean;
    marketing_emails: boolean;
    
    // Frequency settings
    guestbook_digest: 'instant' | 'daily' | 'weekly' | 'never';
    prayer_reminder_time: string; // "09:00" format
  };
  
  privacy: {
    profile_visibility: 'public' | 'private';
    show_prayer_list: boolean;
    allow_memorial_invites: boolean;
  };
  
  billing: {
    payment_method?: PaymentMethod;
    billing_history: BillingTransaction[];
  };
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last_four?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
}

export interface BillingTransaction {
  id: string;
  user_id: string;
  memorial_id?: string;
  
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  
  description: string;
  receipt_url?: string;
  
  created_at: string;
  refunded_at?: string;
  refund_reason?: string;
}

// Admin User Types
export interface AdminUser extends User {
  admin_role: 'super_admin' | 'moderator' | 'support';
  permissions: AdminPermissions;
}

export interface AdminPermissions {
  can_manage_users: boolean;
  can_manage_memorials: boolean;
  can_moderate_content: boolean;
  can_process_refunds: boolean;
  can_view_analytics: boolean;
  can_send_emails: boolean;
  can_access_billing: boolean;
}

// User Activity Types
export interface UserActivity {
  id: string;
  user_id: string;
  action: 'memorial_created' | 'memorial_viewed' | 'guestbook_entry' | 'prayer_added' | 'payment_made';
  resource_type: 'memorial' | 'guestbook' | 'prayer_list' | 'payment';
  resource_id: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Export Requests (GDPR)
export interface DataExportRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'expired';
  download_url?: string;
  expires_at?: string;
  requested_at: string;
  completed_at?: string;
}

// Constants
export const DEFAULT_TIMEZONE = 'America/New_York';
export const DEFAULT_PRAYER_TIME = '09:00';
export const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export const HOLY_DAYS = {
  ALL_SOULS: 'November 2',
  ALL_SAINTS: 'November 1',
  EASTER: 'Variable - Calculated',
  CHRISTMAS: 'December 25',
  GOOD_FRIDAY: 'Variable - Calculated',
} as const;