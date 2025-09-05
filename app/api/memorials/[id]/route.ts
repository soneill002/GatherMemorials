// app/api/memorials/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { Memorial, MemorialService, GalleryItem } from '@/types/memorial';

/**
 * GET /api/memorials/[id]
 * Fetch a memorial by ID
 * Handles privacy settings and ownership checks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const memorialId = params.id;

    // Get current user (may be null for public memorials)
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch memorial with related data
    const { data: memorial, error: fetchError } = await supabase
      .from('memorials')
      .select(`
        *,
        memorial_services (*),
        memorial_photos (*),
        memorial_analytics (
          total_views,
          unique_visitors,
          guestbook_entries,
          prayer_list_adds
        )
      `)
      .eq('id', memorialId)
      .single();

    if (fetchError || !memorial) {
      return NextResponse.json(
        { error: 'Memorial not found.' },
        { status: 404 }
      );
    }

    // Check privacy settings and ownership
    const isOwner = user?.id === memorial.user_id;
    
    // Handle privacy restrictions
    if (!isOwner) {
      // Check if memorial is published
      if (memorial.status !== 'published') {
        return NextResponse.json(
          { error: 'This memorial is not yet published.' },
          { status: 403 }
        );
      }

      // Check privacy settings
      if (memorial.privacy === 'private') {
        return NextResponse.json(
          { error: 'This memorial is private.' },
          { status: 403 }
        );
      }

      // Password protected memorials need verification
      if (memorial.privacy === 'password') {
        // Check for password in headers (from frontend)
        const providedPassword = request.headers.get('X-Memorial-Password');
        
        if (!providedPassword || providedPassword !== memorial.password) {
          return NextResponse.json(
            { 
              error: 'Password required',
              requiresPassword: true 
            },
            { status: 401 }
          );
        }
      }

      // Increment view count for non-owners
      const { error: analyticsError } = await supabase
        .from('memorial_analytics')
        .update({
          total_views: (memorial.memorial_analytics?.total_views || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('memorial_id', memorialId);

      if (analyticsError) {
        console.error('Error updating analytics:', analyticsError);
        // Non-critical, continue
      }
    }

    // Remove sensitive data for non-owners
    if (!isOwner) {
      delete memorial.password;
      delete memorial.guestbook_notify_email;
      delete memorial.completed_steps;
      delete memorial.current_step;
      delete memorial.last_saved_at;
    }

    // Format the response
    const response = {
      ...memorial,
      isOwner,
      analytics: memorial.memorial_analytics || {
        total_views: 0,
        unique_visitors: 0,
        guestbook_entries: 0,
        prayer_list_adds: 0
      },
      services: memorial.memorial_services || [],
      gallery: memorial.memorial_photos || []
    };

    // Clean up nested data
    delete response.memorial_analytics;
    delete response.memorial_services;
    delete response.memorial_photos;

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching memorial:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memorial.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/memorials/[id]
 * Update a memorial (owner only)
 * Supports partial updates for wizard steps
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const memorialId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Verify ownership
    const { data: memorial, error: fetchError } = await supabase
      .from('memorials')
      .select('user_id, status')
      .eq('id', memorialId)
      .single();

    if (fetchError || !memorial) {
      return NextResponse.json(
        { error: 'Memorial not found.' },
        { status: 404 }
      );
    }

    if (memorial.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this memorial.' },
        { status: 403 }
      );
    }

    // Parse update data
    const updates = await request.json();
    
    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;
    delete updates.status; // Status changes through specific endpoints
    
    // Add update timestamp
    updates.updated_at = new Date().toISOString();
    updates.last_saved_at = new Date().toISOString();

    // Handle services separately (if provided)
    if (updates.services) {
      const services = updates.services;
      delete updates.services;

      // Delete existing services
      await supabase
        .from('memorial_services')
        .delete()
        .eq('memorial_id', memorialId);

      // Insert new services
      if (services.length > 0) {
        const servicesData = services.map((service: MemorialService) => ({
          memorial_id: memorialId,
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
          console.error('Error updating services:', servicesError);
          return NextResponse.json(
            { error: 'Failed to update service information.' },
            { status: 500 }
          );
        }
      }
    }

    // Handle gallery items separately (if provided)
    if (updates.gallery) {
      const gallery = updates.gallery;
      delete updates.gallery;

      // Delete existing gallery items
      await supabase
        .from('memorial_photos')
        .delete()
        .eq('memorial_id', memorialId);

      // Insert new gallery items
      if (gallery.length > 0) {
        const galleryData = gallery.map((item: GalleryItem, index: number) => ({
          memorial_id: memorialId,
          url: item.url,
          caption: item.caption,
          type: item.type,
          order_index: index,
          created_at: new Date().toISOString()
        }));

        const { error: galleryError } = await supabase
          .from('memorial_photos')
          .insert(galleryData);

        if (galleryError) {
          console.error('Error updating gallery:', galleryError);
          return NextResponse.json(
            { error: 'Failed to update gallery.' },
            { status: 500 }
          );
        }
      }
    }

    // Update completed steps tracking
    if (updates.current_step) {
      const completedSteps = updates.completed_steps || [];
      const stepNumber = updates.current_step - 1; // Previous step is now complete
      
      if (stepNumber > 0 && !completedSteps.includes(stepNumber)) {
        completedSteps.push(stepNumber);
        updates.completed_steps = completedSteps;
      }
    }

    // Update the memorial
    const { data: updatedMemorial, error: updateError } = await supabase
      .from('memorials')
      .update(updates)
      .eq('id', memorialId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating memorial:', updateError);
      
      // Handle specific errors
      if (updateError.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'The custom URL is already taken. Please choose another.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update memorial.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      memorial: updatedMemorial,
      message: 'Memorial updated successfully.'
    });

  } catch (error) {
    console.error('Error updating memorial:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/memorials/[id]
 * Delete a memorial (owner only)
 * Soft delete for published memorials, hard delete for drafts
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const memorialId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Verify ownership and get status
    const { data: memorial, error: fetchError } = await supabase
      .from('memorials')
      .select('user_id, status, first_name, last_name')
      .eq('id', memorialId)
      .single();

    if (fetchError || !memorial) {
      return NextResponse.json(
        { error: 'Memorial not found.' },
        { status: 404 }
      );
    }

    if (memorial.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this memorial.' },
        { status: 403 }
      );
    }

    // For published memorials, perform soft delete
    if (memorial.status === 'published') {
      const { error: updateError } = await supabase
        .from('memorials')
        .update({
          status: 'deleted', // Note: You'll need to add 'deleted' to your database enum if not already present
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', memorialId);

      if (updateError) {
        console.error('Error soft deleting memorial:', updateError);
        return NextResponse.json(
          { error: 'Failed to delete memorial.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Published memorial has been archived.',
        memorialName: `${memorial.first_name} ${memorial.last_name}`.trim()
      });
    }

    // For drafts, perform hard delete
    // Delete related data first (due to foreign key constraints)
    
    // Delete services
    await supabase
      .from('memorial_services')
      .delete()
      .eq('memorial_id', memorialId);

    // Delete photos
    await supabase
      .from('memorial_photos')
      .delete()
      .eq('memorial_id', memorialId);

    // Delete guestbook entries
    await supabase
      .from('guestbook_entries')
      .delete()
      .eq('memorial_id', memorialId);

    // Delete analytics
    await supabase
      .from('memorial_analytics')
      .delete()
      .eq('memorial_id', memorialId);

    // Delete the memorial
    const { error: deleteError } = await supabase
      .from('memorials')
      .delete()
      .eq('id', memorialId);

    if (deleteError) {
      console.error('Error deleting memorial:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete memorial.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Draft memorial has been permanently deleted.',
      memorialName: `${memorial.first_name} ${memorial.last_name}`.trim() || 'Untitled Memorial'
    });

  } catch (error) {
    console.error('Error deleting memorial:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}