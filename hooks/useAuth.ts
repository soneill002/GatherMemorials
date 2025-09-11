// hooks/useAuth.ts
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UseAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { redirectTo = '/auth/signin', requireAuth = true } = options;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        console.log('useAuth: Starting auth check...');
        
        // Create a fresh Supabase client
        const supabase = createBrowserClient();
        
        // Try getSession first (more reliable)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('useAuth: Found user from session:', session.user.email);
          setUser(session.user);
          setLoading(false);
          return;
        }
        
        // If no session, try getUser as fallback
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (currentUser) {
          console.log('useAuth: Found user from getUser:', currentUser.email);
          setUser(currentUser);
          setLoading(false);
          return;
        }
        
        // No user found
        console.log('useAuth: No user found');
        
        if (requireAuth && mounted) {
          const redirect = `${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`;
          router.push(redirect);
        }
        
        if (mounted) {
          setLoading(false);
        }
        
      } catch (err) {
        console.error('useAuth: Error during auth check:', err);
        if (mounted) {
          setError('Failed to check authentication');
          setLoading(false);
        }
      }
    };
    
    // Run auth check
    checkAuth();
    
    // Set a hard timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('useAuth: Hard timeout reached, forcing loading to false');
        setLoading(false);
        setError('Authentication check timed out');
        
        if (requireAuth) {
          router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
        }
      }
    }, 5000); // 5 second hard timeout
    
    // Setup auth state listener
    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('useAuth: Auth state changed:', event);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        if (requireAuth) {
          router.push(redirectTo);
        }
      } else if (session?.user) {
        setUser(session.user);
        setLoading(false);
      }
    });
    
    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [requireAuth, redirectTo, router]);

  const signOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        if (requireAuth) {
          router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
        }
      }
    } catch (err) {
      console.error('useAuth: Error refreshing auth:', err);
      setError('Failed to refresh authentication');
    } finally {
      setLoading(false);
    }
  }, [requireAuth, redirectTo, router]);

  return {
    user,
    loading,
    error,
    signOut,
    refreshAuth
  };
}