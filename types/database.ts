/**
 * Database types for Supabase
 * Generated based on the database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          display_name: string | null
          phone: string | null
          timezone: string
          email_notifications: boolean
          prayer_reminders: boolean
          guestbook_notifications: boolean
          marketing_emails: boolean
          account_type: 'free' | 'premium' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          display_name?: string | null
          phone?: string | null
          timezone?: string
          email_notifications?: boolean
          prayer_reminders?: boolean
          guestbook_notifications?: boolean
          marketing_emails?: boolean
          account_type?: 'free' | 'premium' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          display_name?: string | null
          phone?: string | null
          timezone?: string
          email_notifications?: boolean
          prayer_reminders?: boolean
          guestbook_notifications?: boolean
          marketing_emails?: boolean
          account_type?: 'free' | 'premium' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      memorials: {
        Row: {
          id: string
          user_id: string
          first_name: string
          middle_name: string | null
          last_name: string
          nickname: string | null
          date_of_birth: string
          date_of_death: string
          featured_image_url: string | null
          cover_photo_url: string | null
          headline: string
          obituary: string | null
          guestbook_enabled: boolean
          guestbook_moderation: boolean
          gallery_enabled: boolean
          privacy_setting: 'public' | 'private' | 'password'
          password_hash: string | null
          custom_url: string | null
          status: 'draft' | 'published'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_intent_id: string | null
          published_at: string | null
          view_count: number
          created_at: string
          updated_at: string
          name?: string // Computed field
          deceased_name?: string // Computed field for backwards compatibility
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          middle_name?: string | null
          last_name: string
          nickname?: string | null
          date_of_birth: string
          date_of_death: string
          featured_image_url?: string | null
          cover_photo_url?: string | null
          headline: string
          obituary?: string | null
          guestbook_enabled?: boolean
          guestbook_moderation?: boolean
          gallery_enabled?: boolean
          privacy_setting?: 'public' | 'private' | 'password'
          password_hash?: string | null
          custom_url?: string | null
          status?: 'draft' | 'published'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_intent_id?: string | null
          published_at?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          middle_name?: string | null
          last_name?: string
          nickname?: string | null
          date_of_birth?: string
          date_of_death?: string
          featured_image_url?: string | null
          cover_photo_url?: string | null
          headline?: string
          obituary?: string | null
          guestbook_enabled?: boolean
          guestbook_moderation?: boolean
          gallery_enabled?: boolean
          privacy_setting?: 'public' | 'private' | 'password'
          password_hash?: string | null
          custom_url?: string | null
          status?: 'draft' | 'published'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_intent_id?: string | null
          published_at?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorials_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      memorial_services: {
        Row: {
          id: string
          memorial_id: string
          service_type: 'visitation' | 'funeral' | 'burial' | 'celebration' | 'rosary' | 'mass' | 'other'
          service_name: string
          date: string
          time: string
          location_name: string
          location_address: string
          location_city: string
          location_state: string
          location_zip: string
          location_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          memorial_id: string
          service_type: 'visitation' | 'funeral' | 'burial' | 'celebration' | 'rosary' | 'mass' | 'other'
          service_name: string
          date: string
          time: string
          location_name: string
          location_address: string
          location_city: string
          location_state: string
          location_zip: string
          location_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          memorial_id?: string
          service_type?: 'visitation' | 'funeral' | 'burial' | 'celebration' | 'rosary' | 'mass' | 'other'
          service_name?: string
          date?: string
          time?: string
          location_name?: string
          location_address?: string
          location_city?: string
          location_state?: string
          location_zip?: string
          location_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorial_services_memorial_id_fkey"
            columns: ["memorial_id"]
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          }
        ]
      }
      memorial_donations: {
        Row: {
          id: string
          memorial_id: string
          charity_name: string
          charity_url: string | null
          charity_description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          memorial_id: string
          charity_name: string
          charity_url?: string | null
          charity_description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          memorial_id?: string
          charity_name?: string
          charity_url?: string | null
          charity_description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorial_donations_memorial_id_fkey"
            columns: ["memorial_id"]
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          }
        ]
      }
      memorial_media: {
        Row: {
          id: string
          memorial_id: string
          media_type: 'image' | 'video'
          media_url: string
          thumbnail_url: string | null
          caption: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          memorial_id: string
          media_type: 'image' | 'video'
          media_url: string
          thumbnail_url?: string | null
          caption?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          memorial_id?: string
          media_type?: 'image' | 'video'
          media_url?: string
          thumbnail_url?: string | null
          caption?: string | null
          order_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorial_media_memorial_id_fkey"
            columns: ["memorial_id"]
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          }
        ]
      }
      guestbook_entries: {
        Row: {
          id: string
          memorial_id: string
          user_id: string | null
          author_name: string
          author_email: string
          message: string
          photo_url: string | null
          status: 'pending' | 'approved' | 'rejected'
          moderation_note: string | null
          moderated_at: string | null
          moderated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          memorial_id: string
          user_id?: string | null
          author_name: string
          author_email: string
          message: string
          photo_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          moderation_note?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          memorial_id?: string
          user_id?: string | null
          author_name?: string
          author_email?: string
          message?: string
          photo_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          moderation_note?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guestbook_entries_memorial_id_fkey"
            columns: ["memorial_id"]
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guestbook_entries_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      prayer_list: {
        Row: {
          id: string
          user_id: string
          memorial_id: string
          notes: string | null
          reminder_enabled: boolean
          reminder_frequency: 'daily' | 'weekly' | 'monthly' | 'anniversary' | null
          last_reminder_sent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          memorial_id: string
          notes?: string | null
          reminder_enabled?: boolean
          reminder_frequency?: 'daily' | 'weekly' | 'monthly' | 'anniversary' | null
          last_reminder_sent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          memorial_id?: string
          notes?: string | null
          reminder_enabled?: boolean
          reminder_frequency?: 'daily' | 'weekly' | 'monthly' | 'anniversary' | null
          last_reminder_sent?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_list_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_list_memorial_id_fkey"
            columns: ["memorial_id"]
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_transactions: {
        Row: {
          id: string
          user_id: string
          memorial_id: string
          stripe_payment_intent_id: string
          stripe_charge_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded'
          description: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          memorial_id: string
          stripe_payment_intent_id: string
          stripe_charge_id?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded'
          description?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          memorial_id?: string
          stripe_payment_intent_id?: string
          stripe_charge_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded'
          description?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_memorial_id_fkey"
            columns: ["memorial_id"]
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      memorial_status: 'draft' | 'published'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
      privacy_setting: 'public' | 'private' | 'password'
      service_type: 'visitation' | 'funeral' | 'burial' | 'celebration' | 'rosary' | 'mass' | 'other'
      guestbook_status: 'pending' | 'approved' | 'rejected'
      account_type: 'free' | 'premium' | 'admin'
      reminder_frequency: 'daily' | 'weekly' | 'monthly' | 'anniversary'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types
export type Profile = Tables<'profiles'>
export type Memorial = Tables<'memorials'>
export type MemorialService = Tables<'memorial_services'>
export type MemorialDonation = Tables<'memorial_donations'>
export type MemorialMedia = Tables<'memorial_media'>
export type GuestbookEntry = Tables<'guestbook_entries'>
export type PrayerListItem = Tables<'prayer_list'>
export type PaymentTransaction = Tables<'payment_transactions'>

// Enum types
export type MemorialStatus = Enums<'memorial_status'>
export type PaymentStatus = Enums<'payment_status'>
export type PrivacySetting = Enums<'privacy_setting'>
export type ServiceType = Enums<'service_type'>
export type GuestbookStatus = Enums<'guestbook_status'>
export type AccountType = Enums<'account_type'>
export type ReminderFrequency = Enums<'reminder_frequency'>