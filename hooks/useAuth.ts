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

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create a fresh Supabase client
      const supabase = createBrowserClient();
      
      // Try to get user with a timeout
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 3000)
      );
      
      try {
        const { data: { user: currentUser } } = await Promise.race([
          userPromise,
          timeoutPromise
        ]) as any;
        
        if (currentUser) {
          setUser(currentUser);
          return currentUser;
        }
      } catch (timeoutError) {
        console.log('Auth check timed out, trying session...');
      }
      
      // Fallback to session if getUser fails or times out
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        return session.user;
      }
      
      // No user found
      if (requireAuth) {
        const redirect = `${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`;
        router.push(redirect);
      }
      
      return null;
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Failed to check authentication');
      return null;
    } finally {
      setLoading(false);
    }
  }, [requireAuth, redirectTo, router]);

  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      if (mounted) {
        await checkAuth();
      }
    };
    
    initialize();
    
    // Setup auth state listener
    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          if (requireAuth) {
            router.push(redirectTo);
          }
        } else if (session?.user) {
          setUser(session.user);
        }
      }
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAuth, requireAuth, redirectTo, router]);

  const signOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  return {
    user,
    loading,
    error,
    signOut,
    refreshAuth: checkAuth
  };
}