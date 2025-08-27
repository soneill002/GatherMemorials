import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a Supabase client for browser/client-side usage
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {
        'x-application-name': 'gathermemorials',
      },
    },
  }
);

// Auth helper functions
export const auth = {
  // Sign up a new user
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out current user
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Reset password request
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helper functions
export const db = {
  // Profiles
  profiles: {
    async get(userId: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return { data, error };
    },

    async update(userId: string, updates: Record<string, any>) {
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
      const { data, error } = await supabase
        .from('memorials')
        .insert(memorial)
        .select()
        .single();
      return { data, error };
    },

    async get(memorialId: string) {
      const { data, error } = await supabase
        .from('memorials')
        .select(`
          *,
          memorial_services (*),
          memorial_donations (*),
          memorial_gallery (*)
        `)
        .eq('id', memorialId)
        .single();
      return { data, error };
    },

    async update(memorialId: string, updates: Record<string, any>) {
      const { data, error } = await supabase
        .from('memorials')
        .update(updates)
        .eq('id', memorialId)
        .select()
        .single();
      return { data, error };
    },

    async delete(memorialId: string) {
      const { error } = await supabase
        .from('memorials')
        .delete()
        .eq('id', memorialId);
      return { error };
    },

    async listByUser(userId: string) {
      const { data, error } = await supabase
        .from('memorials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    async publish(memorialId: string) {
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
      const { data, error } = await supabase
        .from('guestbook_entries')
        .insert(entry)
        .select()
        .single();
      return { data, error };
    },

    async getByMemorial(memorialId: string, status = 'approved') {
      const { data, error } = await supabase
        .from('guestbook_entries')
        .select('*')
        .eq('memorial_id', memorialId)
        .eq('status', status)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    async moderate(entryId: string, status: 'approved' | 'rejected', moderatorId: string) {
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
      const { data, error } = await supabase
        .from('prayer_lists')
        .insert({
          user_id: userId,
          memorial_id: memorialId,
          personal_notes: notes,
        })
        .select()
        .single();
      return { data, error };
    },

    async remove(userId: string, memorialId: string) {
      const { error } = await supabase
        .from('prayer_lists')
        .delete()
        .eq('user_id', userId)
        .eq('memorial_id', memorialId);
      return { error };
    },

    async getByUser(userId: string) {
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
        .order('added_date', { ascending: false });
      return { data, error };
    },

    async check(userId: string, memorialId: string) {
      const { data, error } = await supabase
        .from('prayer_lists')
        .select('id')
        .eq('user_id', userId)
        .eq('memorial_id', memorialId)
        .single();
      return { exists: !!data, error };
    },
  },

  // Services
  services: {
    async create(services: Record<string, any>[]) {
      const { data, error } = await supabase
        .from('memorial_services')
        .insert(services)
        .select();
      return { data, error };
    },

    async update(serviceId: string, updates: Record<string, any>) {
      const { data, error } = await supabase
        .from('memorial_services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();
      return { data, error };
    },

    async delete(serviceId: string) {
      const { error } = await supabase
        .from('memorial_services')
        .delete()
        .eq('id', serviceId);
      return { error };
    },
  },

  // Gallery
  gallery: {
    async upload(memorialId: string, items: Record<string, any>[]) {
      const { data, error } = await supabase
        .from('memorial_gallery')
        .insert(items.map(item => ({ ...item, memorial_id: memorialId })))
        .select();
      return { data, error };
    },

    async delete(itemId: string) {
      const { error } = await supabase
        .from('memorial_gallery')
        .delete()
        .eq('id', itemId);
      return { error };
    },

    async reorder(items: { id: string; order_index: number }[]) {
      const updates = items.map(item => 
        supabase
          .from('memorial_gallery')
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
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // Delete file from storage
  async delete(bucket: string, paths: string[]) {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    return { error };
  },
};

// Real-time subscriptions
export const realtime = {
  // Subscribe to guestbook changes
  subscribeToGuestbook(memorialId: string, callback: (payload: any) => void) {
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

  // Unsubscribe from channel
  unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  },
};

export default supabase;