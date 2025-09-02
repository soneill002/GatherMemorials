import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Simple rate limiting function
function checkRateLimit(identifier: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= limit) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Spam detection function
function detectSpam(message: string): boolean {
  // Basic spam patterns
  const spamPatterns = [
    /\b(viagra|cialis|lottery|winner|click here|buy now)\b/gi,
    /\b(www\.|https?:\/\/)[^\s]+\.[^\s]+/gi, // URLs (might want to allow some)
    /(.)\1{10,}/g, // Repeated characters
    /[A-Z\s]{20,}/g, // All caps messages
  ];

  const suspiciousScore = spamPatterns.reduce((score, pattern) => {
    return score + (pattern.test(message) ? 1 : 0);
  }, 0);

  // Check for minimum content quality
  const wordCount = message.trim().split(/\s+/).length;
  if (wordCount < 3) return true; // Too short
  if (wordCount > 500) return true; // Too long

  return suspiciousScore >= 2; // Flag if multiple patterns match
}

// POST /api/guestbook/entries - Create new entry
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting by user ID
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before posting again.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { memorial_id, message, photo_url } = body;

    // Validate required fields
    if (!memorial_id || !message) {
      return NextResponse.json(
        { error: 'Memorial ID and message are required' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Check for spam
    if (detectSpam(message)) {
      return NextResponse.json(
        { error: 'Your message was flagged as potential spam. Please revise and try again.' },
        { status: 400 }
      );
    }

    // Check if memorial exists and get its settings
    const { data: memorial, error: memorialError } = await supabase
      .from('memorials')
      .select('id, user_id, guestbook_settings, status')
      .eq('id', memorial_id)
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: 'Memorial not found' },
        { status: 404 }
      );
    }

    // Check if memorial is published
    if (memorial.status !== 'published') {
      return NextResponse.json(
        { error: 'This memorial is not published' },
        { status: 403 }
      );
    }

    // Check if guestbook is enabled
    if (!memorial.guestbook_settings?.enabled) {
      return NextResponse.json(
        { error: 'Guestbook is not enabled for this memorial' },
        { status: 403 }
      );
    }

    // Check if user is blocked
    const { data: blockedCheck } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('blocked_by', memorial.user_id)
      .single();

    if (blockedCheck) {
      return NextResponse.json(
        { error: 'You are not allowed to post to this memorial' },
        { status: 403 }
      );
    }

    // Get user profile for author info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    // Determine initial status based on moderation settings
    const status = memorial.guestbook_settings?.moderated ? 'pending' : 'approved';

    // Create the guestbook entry
    const { data: entry, error: insertError } = await supabase
      .from('guestbook_entries')
      .insert({
        memorial_id,
        user_id: session.user.id,
        author_name: profile?.full_name || session.user.email?.split('@')[0] || 'Anonymous',
        author_email: session.user.email,
        message: message.trim(),
        photo_url,
        status,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating guestbook entry:', insertError);
      return NextResponse.json(
        { error: 'Failed to create guestbook entry' },
        { status: 500 }
      );
    }

    // If entry requires moderation, send notification to memorial owner
    if (status === 'pending') {
      // Get memorial owner's email
      const { data: owner } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', memorial.user_id)
        .single();

      if (owner?.email) {
        // Queue notification email (would be sent via email service)
        // This would typically be done through a queue or email service
        console.log('Queue moderation notification email to:', owner.email);
        
        // In production, you would call your email service here
        // await sendModerationNotificationEmail(owner.email, entry, memorial);
      }
    }

    return NextResponse.json({
      success: true,
      entry,
      requiresModeration: status === 'pending'
    });

  } catch (error) {
    console.error('Error in POST /api/guestbook/entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/guestbook/entries - Fetch entries for a memorial
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const memorial_id = searchParams.get('memorial_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'approved';

    if (!memorial_id) {
      return NextResponse.json(
        { error: 'Memorial ID is required' },
        { status: 400 }
      );
    }

    // Check if memorial exists and is public or user is owner
    const { data: memorial, error: memorialError } = await supabase
      .from('memorials')
      .select('id, user_id, privacy, status')
      .eq('id', memorial_id)
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: 'Memorial not found' },
        { status: 404 }
      );
    }

    // Check if user can view this memorial
    const { data: { session } } = await supabase.auth.getSession();
    const isOwner = session?.user?.id === memorial.user_id;

    // For non-public memorials, check access
    if (memorial.privacy === 'private' && !isOwner) {
      return NextResponse.json(
        { error: 'This memorial is private' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('guestbook_entries')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('memorial_id', memorial_id)
      .order('created_at', { ascending: false });

    // Filter by status (only owners can see pending/rejected)
    if (isOwner && status === 'all') {
      // Owner can see all entries
    } else if (isOwner && status !== 'approved') {
      query = query.eq('status', status);
    } else {
      // Non-owners can only see approved entries
      query = query.eq('status', 'approved');
    }

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data: entries, error: entriesError, count } = await query;

    if (entriesError) {
      console.error('Error fetching guestbook entries:', entriesError);
      return NextResponse.json(
        { error: 'Failed to fetch entries' },
        { status: 500 }
      );
    }

    // Transform entries to include profile info
    const transformedEntries = (entries || []).map(entry => ({
      ...entry,
      author_name: entry.author_name || entry.profiles?.full_name || 'Anonymous',
      author_avatar: entry.profiles?.avatar_url
    }));

    return NextResponse.json({
      entries: transformedEntries,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/guestbook/entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/guestbook/entries - Delete an entry (owner only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entry_id = searchParams.get('id');

    if (!entry_id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    // Get the entry and check ownership
    const { data: entry, error: entryError } = await supabase
      .from('guestbook_entries')
      .select(`
        id,
        memorial:memorials!inner(
          user_id
        )
      `)
      .eq('id', entry_id)
      .single();

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Check if user is the memorial owner
    if (entry.memorial.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the entry
    const { error: deleteError } = await supabase
      .from('guestbook_entries')
      .delete()
      .eq('id', entry_id);

    if (deleteError) {
      console.error('Error deleting entry:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Entry deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/guestbook/entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}