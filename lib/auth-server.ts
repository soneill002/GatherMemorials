import { createServerClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/user';

/**
 * Server-side auth helpers for middleware and API routes
 */
export const serverAuth = {
  /**
   * Get session from server (for middleware/API routes)
   */
  async getSession(request: NextRequest) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Server: Error getting session:', error);
      return null;
    }
    
    return session;
  },

  /**
   * Get user from server (for middleware/API routes)
   */
  async getUser(request: NextRequest) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Server: Error getting user:', error);
      return null;
    }
    
    return user;
  },

  /**
   * Protected route middleware
   */
  async requireAuth(request: NextRequest) {
    const session = await this.getSession(request);
    
    if (!session) {
      // Redirect to sign in with return URL
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  },

  /**
   * Admin-only route middleware
   */
  async requireAdmin(request: NextRequest) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      // Redirect to 403 forbidden page or home
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  },

  /**
   * Memorial owner middleware
   */
  async requireMemorialOwner(request: NextRequest, memorialId: string) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Check if user owns the memorial
    const { data, error } = await supabase
      .from('memorials')
      .select('id')
      .eq('id', memorialId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      // Redirect to 403 forbidden page or memorial view page
      return NextResponse.redirect(new URL(`/memorials/${memorialId}`, request.url));
    }

    return NextResponse.next();
  },
};

/**
 * Protected route wrapper for API routes
 */
export function withAuth(
  handler: (req: NextRequest, context: { user: User }) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return handler(req, { user });
  };
}

/**
 * Admin-only route wrapper for API routes
 */
export function withAdmin(
  handler: (req: NextRequest, context: { user: User; profile: UserProfile }) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    return handler(req, { user, profile: profile as UserProfile });
  };
}