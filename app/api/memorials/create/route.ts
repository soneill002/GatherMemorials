// app/api/memorials/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { Memorial, MemorialStatus } from '@/types/memorial';

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
      status: MemorialStatus.DRAFT,
      
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
      
      return NextResponse.json(
        { error: 'Failed to create memorial. Please try again.' },
        { status: 500 }
      );
    }

    // If services were provided, insert them
    if (body.services && Array.isArray(body.services)) {
      const servicesData = body.services.map((service: any) => ({
        memorial_id: memorial.id,
        service_type: service.type,
        date: service.date,
        time: service.time,
        location: service.location,
        address: service.address,
        notes: service.notes,
        created_at: new Date().toISOString()
      }));

      const { error: servicesError } = await supabase
        .from('memorial_services')
        .insert(servicesData);

      if (servicesError) {
        console.error('Error creating services:', servicesError);
        // Don't fail the whole request, services can be added later
      }
    }

    // Create initial analytics record
    const { error: analyticsError } = await supabase
      .from('memorial_analytics')
      .insert([{
        memorial_id: memorial.id,
        total_views: 0,
        unique_visitors: 0,
        guestbook_entries: 0,
        prayer_list_adds: 0,
        shares: 0,
        last_viewed_at: null
      }]);

    if (analyticsError) {
      console.error('Error creating analytics record:', analyticsError);
      // Non-critical, don't fail the request
    }

    // Return success response with memorial ID
    return NextResponse.json({
      success: true,
      memorial_id: memorial.id,
      status: memorial.status,
      redirect_url: `/memorials/new?id=${memorial.id}`,
      message: 'Memorial draft created successfully. You can now start filling in the details.'
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in memorial creation:', error);
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/memorials/create
 * Check if user has any existing drafts they can continue
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Get user's draft memorials
    const { data: drafts, error: fetchError } = await supabase
      .from('memorials')
      .select('id, first_name, last_name, headline, created_at, updated_at, current_step')
      .eq('user_id', user.id)
      .eq('status', MemorialStatus.DRAFT)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error('Error fetching drafts:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch existing drafts.' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedDrafts = drafts?.map(draft => ({
      id: draft.id,
      name: [draft.first_name, draft.last_name].filter(Boolean).join(' ') || 'Untitled Memorial',
      headline: draft.headline || null,
      created_at: draft.created_at,
      updated_at: draft.updated_at,
      current_step: draft.current_step || 1,
      continue_url: `/memorials/new?id=${draft.id}`
    })) || [];

    return NextResponse.json({
      has_drafts: formattedDrafts.length > 0,
      drafts: formattedDrafts,
      can_create_new: true, // In future, we might limit drafts per user
      message: formattedDrafts.length > 0 
        ? `You have ${formattedDrafts.length} draft memorial(s) you can continue.`
        : 'No existing drafts found. Ready to create a new memorial.'
    });

  } catch (error) {
    console.error('Unexpected error fetching drafts:', error);
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}