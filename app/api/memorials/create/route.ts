// app/api/memorials/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { Memorial } from '@/types/memorial';

/**
 * POST /api/memorials/create
 * Creates a new memorial draft for the authenticated user
 * Returns the memorial ID to start the wizard process
 */
export async function POST(request: NextRequest) {
  try {
    // Get the session from the request
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to create a memorial.' },
        { status: 401 }
      );
    }

    // Parse request body for any initial data (optional)
    const body = await request.json().catch(() => ({}));
    
    // Create initial memorial draft with default values
    const memorialData = {
      user_id: user.id,
      status: 'draft',
      
      // Step 1: Basic Info (will be filled by wizard)
      first_name: body.first_name || null,
      middle_name: body.middle_name || null,
      last_name: body.last_name || null,
      nickname: body.nickname || null,
      date_of_birth: body.date_of_birth || null,
      date_of_death: body.date_of_death || null,
      featured_photo_url: null,
      cover_photo_url: null,
      
      // Step 2: Headline
      headline: body.headline || null,
      
      // Step 3: Obituary
      obituary: body.obituary || null,
      
      // Step 5: Donation
      donation_enabled: false,
      donation_type: null,
      donation_url: null,
      donation_description: null,
      
      // Step 7: Guestbook
      guestbook_enabled: false,
      guestbook_moderation: 'pre', // Default to pre-moderation for safety
      guestbook_notify_email: user.email,
      guestbook_notify_frequency: 'instant',
      
      // Step 8: Privacy
      privacy: 'private', // Default to private until published
      password: null,
      custom_url: null,
      seo_enabled: false,
      
      // Metadata
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: null,
      
      // Wizard progress tracking
      completed_steps: [],
      current_step: 1,
      last_saved_at: new Date().toISOString()
    };

    // Insert memorial into database
    const { data: memorial, error: insertError } = await supabase
      .from('memorials')
      .insert([memorialData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating memorial:', insertError);
      
      // Handle specific database errors
      if (insertError.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'A memorial with this information already exists.' },
          { status: 409 }
        );
      }
      
      if (insertError.code === '23503') { // Foreign key violation
        return NextResponse.json(
          { error: 'Invalid user reference. Please sign in again.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create memorial. Please try again.' },
        { status: 500 }
      );
    }

    // Create initial analytics entry for the memorial
    await supabase
      .from('memorial_analytics')
      .insert([{
        memorial_id: memorial.id,
        total_views: 0,
        unique_visitors: 0,
        guestbook_entries: 0,
        prayer_list_adds: 0,
        last_viewed_at: null,
        created_at: new Date().toISOString()
      }]);
    // Don't fail if analytics creation fails - it's not critical

    // Return the created memorial with success response
    return NextResponse.json({
      success: true,
      memorial: {
        id: memorial.id,
        status: memorial.status,
        current_step: memorial.current_step || 1,
        completed_steps: memorial.completed_steps || [],
        created_at: memorial.created_at
      },
      message: 'Memorial draft created successfully.',
      nextStep: '/memorials/new?id=' + memorial.id
    });

  } catch (error) {
    console.error('Error in create memorial route:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}