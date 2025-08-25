// types/database.ts
// Supabase database types for type safety
// Generate these from your Supabase schema in production

export interface Database {
  public: {
    Tables: {
      memorials: {
        Row: {
          id: string
          user_id: string
          first_name: string
          middle_name: string | null
          last_name: string
          nickname: string | null
          birth_date: string
          death_date: string
          title: string
          obituary: string | null
          biography: string | null
          profile_photo_url: string | null
          cover_photo_url: string | null
          status: 'draft' | 'published' | 'archived' | 'deleted'
          privacy: 'public' | 'private' | 'password_protected'
          password: string | null
          custom_url: string | null
          enable_prayers: boolean
          enable_mass_intentions: boolean
          parish_id: string | null
          pricing_tier: 'free' | 'standard' | 'eternal'
          stripe_payment_id: string | null
          created_at: string
          updated_at: string
          published_at: string | null
          deleted_at: string | null
          expires_at: string | null
          view_count: number
        }
        Insert: Omit<Database['public']['Tables']['memorials']['Row'], 'id' | 'created_at' | 'view_count'>
        Update: Partial<Database['public']['Tables']['memorials']['Insert']>
      }
      memorial_photos: {
        Row: {
          id: string
          memorial_id: string
          url: string
          thumbnail_url: string
          caption: string | null
          uploaded_by: string
          uploaded_at: string
          order: number
        }
        Insert: Omit<Database['public']['Tables']['memorial_photos']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['memorial_photos']['Insert']>
      }
      memorial_contributors: {
        Row: {
          id: string
          memorial_id: string
          user_id: string
          role: 'viewer' | 'contributor' | 'admin'
          permissions: {
            canEdit: boolean
            canUploadPhotos: boolean
            canInviteOthers: boolean
            canDelete: boolean
          }
          invited_by: string
          invited_at: string
          accepted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['memorial_contributors']['Row'], 'id' | 'invited_at'>
        Update: Partial<Database['public']['Tables']['memorial_contributors']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: 'free' | 'standard' | 'eternal'
          stripe_subscription_id: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
    }
  }
}