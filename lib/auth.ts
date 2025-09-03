import { createBrowserClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '@/types/user';

/**
 * Auth Error Types
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'SESSION_EXPIRED' | 'NO_PROFILE' | 'UNKNOWN',
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Session Management Helpers
 */
export const auth = {
  /**
   * Get the current session from the browser
   */
  async getSession() {
    const supabase = createBrowserClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  },

  /**
   * Get the current user from the browser
   */
  async getUser() {
    const supabase = createBrowserClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return user;
  },

  /**
   * Get the current user with their profile data
   */
  async getUserWithProfile(): Promise<{ user: User; profile: UserProfile } | null> {
    const supabase = createBrowserClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Create profile if it doesn't exist
      const metadata = user.user_metadata;
      const newProfile = {
        id: user.id,
        email: user.email!,
        first_name: metadata.first_name || '',
        last_name: metadata.last_name || '',
        full_name: `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim(),
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return null;
      }

      return { user, profile: createdProfile as UserProfile };
    }

    return { user, profile: profile as UserProfile };
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw new AuthError('Failed to sign out', 'UNKNOWN', 500);
    }
  },

  /**
   * Refresh the current session
   */
  async refreshSession() {
    const supabase = createBrowserClient();
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing session:', error);
      throw new AuthError('Session refresh failed', 'SESSION_EXPIRED');
    }
    
    return session;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  },

  /**
   * Check if user has a specific role
   */
  async hasRole(role: 'admin' | 'moderator'): Promise<boolean> {
    const userWithProfile = await this.getUserWithProfile();
    
    if (!userWithProfile) {
      return false;
    }

    return userWithProfile.profile.role === role;
  },

  /**
   * Check if user owns a specific memorial
   */
  async ownsMemorial(memorialId: string): Promise<boolean> {
    const user = await this.getUser();
    
    if (!user) {
      return false;
    }

    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('memorials')
      .select('id')
      .eq('id', memorialId)
      .eq('user_id', user.id)
      .single();

    return !error && !!data;
  },

  /**
   * Check if user can moderate a memorial's guestbook
   */
  async canModerateGuestbook(memorialId: string): Promise<boolean> {
    const user = await this.getUser();
    
    if (!user) {
      return false;
    }

    const supabase = createBrowserClient();
    
    // Check if user owns the memorial or is a contributor with moderation rights
    const { data: memorial, error } = await supabase
      .from('memorials')
      .select(`
        id,
        user_id,
        memorial_contributors!inner (
          user_id,
          can_moderate
        )
      `)
      .eq('id', memorialId)
      .or(`user_id.eq.${user.id},memorial_contributors.user_id.eq.${user.id}`)
      .single();

    if (error || !memorial) {
      return false;
    }

    // Owner always has moderation rights
    if (memorial.user_id === user.id) {
      return true;
    }

    // Check contributor permissions
    const contributor = (memorial as any).memorial_contributors?.find(
      (c: any) => c.user_id === user.id
    );

    return contributor?.can_moderate || false;
  },
};

/**
 * Auth utilities for forms and validation
 */
export const authUtils = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   */
  isValidPassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  },

  /**
   * Get password strength score (0-4)
   */
  getPasswordStrength(password: string): {
    score: number;
    label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
    color: string;
  } {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const labels: Array<'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong'> = 
      ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

    return {
      score: Math.min(score, 4),
      label: labels[Math.min(score, 4)],
      color: colors[Math.min(score, 4)],
    };
  },

  /**
   * Format user display name
   */
  formatDisplayName(profile: UserProfile): string {
    if (profile.full_name) {
      return profile.full_name;
    }
    
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    
    // Fall back to email username
    return profile.email.split('@')[0];
  },

  /**
   * Get user initials for avatar
   */
  getUserInitials(profile: UserProfile): string {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    
    if (profile.full_name && profile.full_name.includes(' ')) {
      const parts = profile.full_name.split(' ');
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    
    // Fall back to first two letters of email
    return profile.email.substring(0, 2).toUpperCase();
  },
};

/**
 * Rate limiting helper for auth endpoints
 */
export const authRateLimit = {
  attempts: new Map<string, { count: number; resetAt: number }>(),
  
  check(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || now > attempt.resetAt) {
      this.attempts.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }
    
    if (attempt.count >= maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  },
  
  reset(identifier: string) {
    this.attempts.delete(identifier);
  },
};