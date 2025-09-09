import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Helper to clear corrupted auth data
 */
export function clearAuthData() {
  if (typeof window === 'undefined') return;
  
  // Clear all potential auth-related keys
  const keysToRemove = [
    'gathermemorials-auth-token',
    'sb-auth-token',
    'supabase.auth.token',
    'sb-gathermemorials-auth-token',
  ];
  
  keysToRemove.forEach(key => {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  });
  
  // Also clear any cookies with auth data
  if (typeof document !== 'undefined') {
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.includes('auth') || name.includes('supabase') || name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
      }
    });
  }
}

/**
 * Create a new Supabase browser client instance
 * Always creates a fresh instance to avoid state corruption issues
 */
export function createBrowserClient() {
  // Always create a fresh instance - no singleton
  // The Supabase SDK handles connection pooling internally
  return createSupabaseBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'sb-gathermemorials-auth-token',
        storage: {
          getItem: (key: string) => {
            if (typeof window === 'undefined') return null;
            try {
              const item = window.localStorage.getItem(key);
              // Handle corrupted data
              if (item) {
                // Check if it's malformed (starts with base64- prefix)
                if (item.startsWith('base64-')) {
                  console.warn('Corrupted auth data detected, clearing...');
                  window.localStorage.removeItem(key);
                  return null;
                }
                // Try to parse to verify it's valid JSON
                try {
                  JSON.parse(item);
                  return item;
                } catch {
                  console.warn('Invalid JSON in auth storage, clearing...');
                  window.localStorage.removeItem(key);
                  return null;
                }
              }
              return item;
            } catch (error) {
              console.error('Error reading from localStorage:', error);
              window.localStorage.removeItem(key);
              return null;
            }
          },
          setItem: (key: string, value: string) => {
            if (typeof window === 'undefined') return;
            try {
              window.localStorage.setItem(key, value);
            } catch (error) {
              console.error('Error writing to localStorage:', error);
            }
          },
          removeItem: (key: string) => {
            if (typeof window === 'undefined') return;
            try {
              window.localStorage.removeItem(key);
            } catch (error) {
              console.error('Error removing from localStorage:', error);
            }
          },
        },
      },
      global: {
        headers: {
          'x-application-name': 'gathermemorials',
        },
      },
      db: {
        schema: 'public'
      }
    }
  );
}

/**
 * Get current user with better error handling - no hanging
 */
export async function getCurrentUser() {
  try {
    const supabase = createBrowserClient();
    
    // Skip getSession and go straight to getUser
    // This avoids the hanging issue with getSession
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('getCurrentUser error:', error);
      return { user: null, error };
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('getCurrentUser unexpected error:', error);
    return { user: null, error };
  }
}

/**
 * Alias for createBrowserClient for backwards compatibility
 */
export const createClient = createBrowserClient;

/**
 * Create a server client (for backwards compatibility with API routes)
 * Note: This is a stub - actual server clients should use @/lib/supabase/server
 */
export function createServerClient(cookieStore?: any) {
  console.warn('createServerClient called from client.ts - consider using @/lib/supabase/server instead');
  return createBrowserClient();
}

// Auth helper functions with better error handling
export const auth = {
  // Sign up a new user
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { data, error };
    } catch (error) {
      console.error('SignUp error:', error);
      return { data: null, error };
    }
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      console.error('SignIn error:', error);
      return { data: null, error };
    }
  },

  // Sign out current user
  async signOut() {
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('SignOut error:', error);
      return { error };
    }
  },

  // Get current session
  async getSession() {
    try {
      const supabase = createBrowserClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      return { session, error };
    } catch (error) {
      console.error('GetSession error:', error);
      return { session: null, error };
    }
  },

  // Get current user
  async getUser() {
    try {
      const supabase = createBrowserClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    } catch (error) {
      console.error('GetUser error:', error);
      return { user: null, error };
    }
  },

  // Reset password request
  async resetPassword(email: string) {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { data, error };
    } catch (error) {
      console.error('ResetPassword error:', error);
      return { data: null, error };
    }
  },

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { data, error };
    } catch (error) {
      console.error('UpdatePassword error:', error);
      return { data: null, error };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = createBrowserClient();
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helper functions
export const db = {
  // Profiles
  profiles: {
    async get(userId: string) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return { data, error };
    },

    async update(userId: string, updates: Record<string, any>) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      return { data, error };
    },
  },

  // Memorials
  memorials: {
    async create(memorial: Record<string, any>) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('memorials')
        .insert(memorial)
        .select()
        .single();
      return { data, error };
    },

    async get(memorialId: string) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('memorials')
        .select(`
          *,
          memorial_services (*),
          memorial_donations (*),
          memorial_media (*)
        `)
        .eq('id', memorialId)
        .single();
      return { data, error };
    },

    async update(memorialId: string, updates: Record<string, any>) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('memorials')
        .update(updates)
        .eq('id', memorialId)
        .select()
        .single();
      return { data, error };
    },

    async delete(memorialId: string) {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('memorials')
        .delete()
        .eq('id', memorialId);
      return { error };
    },

    async listByUser(userId: string) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('memorials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    async publish(memorialId: string) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('memorials')
        .update({ 
          status: 'published', 
          published_at: new Date().toISOString() 
        })
        .eq('id', memorialId)
        .select()
        .single();
      return { data, error };
    },
  },

  // Guestbook
  guestbook: {
    async create(entry: Record<string, any>) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('guestbook_entries')
        .insert(entry)
        .select()
        .single();
      return { data, error };
    },

    async getByMemorial(memorialId: string, status = 'approved') {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('guestbook_entries')
        .select('*')
        .eq('memorial_id', memorialId)
        .eq('status', status)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    async moderate(entryId: string, status: 'approved' | 'rejected', moderatorId: string) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('guestbook_entries')
        .update({ 
          status, 
          moderated_by: moderatorId,
          moderated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single();
      return { data, error };
    },
  },

  // Prayer Lists
  prayerLists: {
    async add(userId: string, memorialId: string, notes?: string) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('prayer_lists')
        .insert({
          user_id: userId,
          memorial_id: memorialId,
          notes: notes,
        })
        .select()
        .single();
      return { data, error };
    },

    async remove(userId: string, memorialId: string) {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('prayer_lists')
        .delete()
        .eq('user_id', userId)
        .eq('memorial_id', memorialId);
      return { error };
    },

    async getByUser(userId: string) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('prayer_lists')
        .select(`
          *,
          memorials (
            id,
            first_name,
            last_name,
            date_of_birth,
            date_of_death,
            featured_image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    async check(userId: string, memorialId: string) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('prayer_lists')
        .select('id')
        .eq('user_id', userId)
        .eq('memorial_id', memorialId)
        .maybeSingle();
      return { exists: !!data, error };
    },
  },

  // Services
  services: {
    async create(services: Record<string, any>[]) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('memorial_services')
        .insert(services)
        .select();
      return { data, error };
    },

    async update(serviceId: string, updates: Record<string, any>) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('memorial_services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();
      return { data, error };
    },

    async delete(serviceId: string) {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('memorial_services')
        .delete()
        .eq('id', serviceId);
      return { error };
    },
  },

  // Gallery/Media
  gallery: {
    async upload(memorialId: string, items: Record<string, any>[]) {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('memorial_media')
        .insert(items.map(item => ({ ...item, memorial_id: memorialId })))
        .select();
      return { data, error };
    },

    async delete(itemId: string) {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('memorial_media')
        .delete()
        .eq('id', itemId);
      return { error };
    },

    async reorder(items: { id: string; order_index: number }[]) {
      const supabase = createBrowserClient();
      const updates = items.map(item => 
        supabase
          .from('memorial_media')
          .update({ order_index: item.order_index })
          .eq('id', item.id)
      );
      const results = await Promise.all(updates);
      return results;
    },
  },
};

// Storage helper functions
export const storage = {
  // Upload file to storage bucket
  async upload(bucket: string, path: string, file: File) {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    return { data, error };
  },

  // Get public URL for file
  getPublicUrl(bucket: string, path: string) {
    const supabase = createBrowserClient();
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // Delete file from storage
  async delete(bucket: string, paths: string[]) {
    const supabase = createBrowserClient();
    const { error } = await supabase.storage.from(bucket).remove(paths);
    return { error };
  },

  // Download file from storage
  async download(bucket: string, path: string) {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.storage.from(bucket).download(path);
    return { data, error };
  },
};

// Real-time subscriptions
export const realtime = {
  // Subscribe to guestbook changes
  subscribeToGuestbook(memorialId: string, callback: (payload: any) => void) {
    const supabase = createBrowserClient();
    return supabase
      .channel(`guestbook:${memorialId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guestbook_entries',
          filter: `memorial_id=eq.${memorialId}`,
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to memorial changes
  subscribeToMemorial(memorialId: string, callback: (payload: any) => void) {
    const supabase = createBrowserClient();
    return supabase
      .channel(`memorial:${memorialId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memorials',
          filter: `id=eq.${memorialId}`,
        },
        callback
      )
      .subscribe();
  },

  // Unsubscribe from channel
  unsubscribe(channel: any) {
    const supabase = createBrowserClient();
    return supabase.removeChannel(channel);
  },
};

// For backwards compatibility - create a default instance
// But note that each function now creates its own client
export const supabase = createBrowserClient();

export default supabase;