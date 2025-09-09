// app/api/memorials/[id]/autosave/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { Memorial } from '@/types/memorial';

/**
 * Auto-save endpoint for memorial wizard
 * Optimized for frequent saves with minimal overhead
 */

// Track recent saves to prevent too frequent updates
const recentSaves = new Map<string, number>();

// Cleanup old entries from map every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, timestamp] of recentSaves.entries()) {
    if (timestamp < oneHourAgo) {
      recentSaves.delete(key);
    }
  }
}, 3600000);

/**
 * POST /api/memorials/[id]/autosave
 * Auto-save memorial data during wizard progress
 * Rate-limited and optimized for performance
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const memorialId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting: Check if saved too recently (within 1 second)
    const lastSaveKey = `${user.id}-${memorialId}`;
    const lastSaveTime = recentSaves.get(lastSaveKey);
    const now = Date.now();
    
    if (lastSaveTime && now - lastSaveTime < 1000) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Rate limited - please wait before saving again',
          nextSaveAvailable: 1000 - (now - lastSaveTime)
        },
        { status: 429 }
      );
    }

    // Quick ownership check (minimal data fetch)
    const { data: memorial, error: fetchError } = await supabase
      .from('memorials')
      .select('user_id, status')
      .eq('id', memorialId)
      .single();

    if (fetchError || !memorial) {
      return NextResponse.json(
        { error: 'Memorial not found' },
        { status: 404 }
      );
    }

    if (memorial.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Don't auto-save published memorials (they should use the regular update)
    if (memorial.status === 'published') {
      return NextResponse.json(
        { 
          success: false,
          message: 'Cannot auto-save published memorials. Use the edit function instead.'
        },
        { status: 400 }
      );
    }

    // Parse the auto-save data
    const { 
      step,
      data: stepData,
      completed
    } = await request.json();

    // Validate step number
    if (!step || step < 1 || step > 9) {
      return NextResponse.json(
        { error: 'Invalid step number' },
        { status: 400 }
      );
    }

    // Build update object based on step
    const updates: any = {
      last_saved_at: new Date().toISOString(),
      current_step: step
    };

    // Map step data to database fields
    switch (step) {
      case 1: // Basic Info
        if (stepData.firstName !== undefined) updates.first_name = stepData.firstName;
        if (stepData.middleName !== undefined) updates.middle_name = stepData.middleName;
        if (stepData.lastName !== undefined) updates.last_name = stepData.lastName;
        if (stepData.nickname !== undefined) updates.nickname = stepData.nickname;
        if (stepData.dateOfBirth !== undefined) updates.date_of_birth = stepData.dateOfBirth;
        if (stepData.dateOfDeath !== undefined) updates.date_of_death = stepData.dateOfDeath;
        if (stepData.featuredPhotoUrl !== undefined) updates.featured_photo_url = stepData.featuredPhotoUrl;
        if (stepData.coverPhotoUrl !== undefined) updates.cover_photo_url = stepData.coverPhotoUrl;
        break;

      case 2: // Headline
        if (stepData.headline !== undefined) updates.headline = stepData.headline;
        break;

      case 3: // Obituary
        if (stepData.obituary !== undefined) updates.obituary = stepData.obituary;
        break;

      case 4: // Services - Handle separately
        // Services are stored in a separate table, skip for auto-save
        // They'll be saved when user completes the step
        break;

      case 5: // Donation
        if (stepData.donationEnabled !== undefined) updates.donation_enabled = stepData.donationEnabled;
        if (stepData.donationType !== undefined) updates.donation_type = stepData.donationType;
        if (stepData.donationUrl !== undefined) updates.donation_url = stepData.donationUrl;
        if (stepData.donationDescription !== undefined) updates.donation_description = stepData.donationDescription;
        break;

      case 6: // Gallery - Handle separately
        // Gallery items are stored in a separate table, skip for auto-save
        // They'll be saved when user completes the step
        break;

      case 7: // Guestbook
        if (stepData.guestbookEnabled !== undefined) updates.guestbook_enabled = stepData.guestbookEnabled;
        if (stepData.guestbookModeration !== undefined) updates.guestbook_moderation = stepData.guestbookModeration;
        if (stepData.guestbookNotifyEmail !== undefined) updates.guestbook_notify_email = stepData.guestbookNotifyEmail;
        if (stepData.guestbookNotifyFrequency !== undefined) updates.guestbook_notify_frequency = stepData.guestbookNotifyFrequency;
        break;

      case 8: // Privacy
        if (stepData.privacy !== undefined) updates.privacy = stepData.privacy;
        if (stepData.password !== undefined) updates.password = stepData.password;
        if (stepData.customUrl !== undefined) updates.custom_url = stepData.customUrl;
        if (stepData.seoEnabled !== undefined) updates.seo_enabled = stepData.seoEnabled;
        break;

      case 9: // Review
        // No specific fields for review step
        break;
    }

    // Handle completed step tracking
    if (completed) {
      const completedSteps = memorial.completed_steps || [];
      if (!completedSteps.includes(step)) {
        completedSteps.push(step);
        updates.completed_steps = completedSteps;
      }
    }

    // Only update if there are actual changes (beyond timestamps)
    const hasChanges = Object.keys(updates).length > 2; // More than just timestamps
    
    if (hasChanges) {
      // Record save time for rate limiting
      recentSaves.set(lastSaveKey, now);

      // Perform the update
      const { error: updateError } = await supabase
        .from('memorials')
        .update(updates)
        .eq('id', memorialId);

      if (updateError) {
        console.error('Auto-save update error:', updateError);
        return NextResponse.json(
          { 
            success: false,
            message: 'Failed to save changes',
            retry: true
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Changes saved',
        step,
        savedAt: updates.last_saved_at,
        hasChanges: true
      });
    }

    return NextResponse.json({
      success: true,
      message: 'No changes to save',
      step
    });

  } catch (error) {
    console.error('Auto-save error:', error);
    
    // Return minimal error for auto-save (don't disrupt user experience)
    return NextResponse.json(
      { 
        success: false,
        message: 'Auto-save failed',
        retry: true
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/memorials/[id]/autosave
 * Get the last auto-save timestamp and progress
 * Used to show "Last saved X minutes ago" in the UI
 */
export async function GET(
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get memorial save status
    const { data: memorial, error: fetchError } = await supabase
      .from('memorials')
      .select('user_id, last_saved_at, current_step, completed_steps')
      .eq('id', memorialId)
      .single();

    if (fetchError || !memorial) {
      return NextResponse.json(
        { error: 'Memorial not found' },
        { status: 404 }
      );
    }

    if (memorial.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Calculate time since last save
    const lastSaved = memorial.last_saved_at ? new Date(memorial.last_saved_at) : null;
    const timeSinceLastSave = lastSaved ? Date.now() - lastSaved.getTime() : null;

    // Format time for display
    let lastSavedDisplay = 'Not saved yet';
    if (timeSinceLastSave !== null) {
      const seconds = Math.floor(timeSinceLastSave / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (seconds < 10) {
        lastSavedDisplay = 'Just saved';
      } else if (seconds < 60) {
        lastSavedDisplay = `${seconds} seconds ago`;
      } else if (minutes < 60) {
        lastSavedDisplay = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (hours < 24) {
        lastSavedDisplay = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        lastSavedDisplay = lastSaved.toLocaleDateString();
      }
    }

    // Calculate progress percentage
    const completedSteps = memorial.completed_steps || [];
    const progressPercentage = Math.round((completedSteps.length / 9) * 100);

    return NextResponse.json({
      lastSaved: memorial.last_saved_at,
      lastSavedDisplay,
      timeSinceLastSave,
      currentStep: memorial.current_step || 1,
      completedSteps,
      progressPercentage,
      isAutoSaveEnabled: true
    });

  } catch (error) {
    console.error('Error getting auto-save status:', error);
    return NextResponse.json(
      { error: 'Failed to get save status' },
      { status: 500 }
    );
  }
}