import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// PUT /api/guestbook/moderate - Approve or reject entries
export async function PUT(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { entry_id, entry_ids, action, reason } = body;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Handle single or bulk moderation
    const idsToModerate = entry_ids || (entry_id ? [entry_id] : []);
    
    if (idsToModerate.length === 0) {
      return NextResponse.json(
        { error: 'Entry ID(s) required' },
        { status: 400 }
      );
    }

    // Get entries and verify ownership
    const { data: entries, error: entriesError } = await supabase
      .from('guestbook_entries')
      .select(`
        id,
        user_id,
        author_email,
        author_name,
        message,
        memorial:memorials!inner(
          id,
          user_id,
          first_name,
          last_name
        )
      `)
      .in('id', idsToModerate);

    if (entriesError || !entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'Entries not found' },
        { status: 404 }
      );
    }

    // Verify user owns all memorials
    const unauthorizedEntry = entries.find(
      entry => entry.memorial.user_id !== session.user.id
    );
    
    if (unauthorizedEntry) {
      return NextResponse.json(
        { error: 'Unauthorized to moderate these entries' },
        { status: 403 }
      );
    }

    // Update entries status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error: updateError } = await supabase
      .from('guestbook_entries')
      .update({
        status: newStatus,
        moderated_at: new Date().toISOString(),
        moderated_by: session.user.id,
        moderation_reason: reason
      })
      .in('id', idsToModerate);

    if (updateError) {
      console.error('Error updating entries:', updateError);
      return NextResponse.json(
        { error: 'Failed to moderate entries' },
        { status: 500 }
      );
    }

    // Log moderation action
    const moderationLogs = entries.map(entry => ({
      entry_id: entry.id,
      memorial_id: entry.memorial.id,
      moderator_id: session.user.id,
      action: newStatus,
      reason,
      created_at: new Date().toISOString()
    }));

    await supabase
      .from('moderation_logs')
      .insert(moderationLogs);

    // Prepare email notifications
    const emailNotifications = entries.map(entry => ({
      to: entry.author_email,
      type: action === 'approve' ? 'entry_approved' : 'entry_rejected',
      data: {
        author_name: entry.author_name,
        memorial_name: `${entry.memorial.first_name} ${entry.memorial.last_name}`,
        message: entry.message,
        reason: reason
      }
    }));

    // Queue email notifications (in production, send to email service)
    console.log('Queue email notifications:', emailNotifications);
    
    // In production, you would send these to your email queue
    // await queueEmailNotifications(emailNotifications);

    return NextResponse.json({
      success: true,
      moderated: idsToModerate.length,
      action: newStatus,
      message: `Successfully ${action}ed ${idsToModerate.length} ${idsToModerate.length === 1 ? 'entry' : 'entries'}`
    });

  } catch (error) {
    console.error('Error in PUT /api/guestbook/moderate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/guestbook/moderate/block - Block a user from posting
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

    const body = await request.json();
    const { user_id, reason } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if already blocked
    const { data: existingBlock } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('user_id', user_id)
      .eq('blocked_by', session.user.id)
      .single();

    if (existingBlock) {
      return NextResponse.json(
        { error: 'User is already blocked' },
        { status: 400 }
      );
    }

    // Create block record
    const { error: blockError } = await supabase
      .from('blocked_users')
      .insert({
        user_id,
        blocked_by: session.user.id,
        reason: reason || 'Inappropriate content',
        blocked_at: new Date().toISOString()
      });

    if (blockError) {
      console.error('Error blocking user:', blockError);
      return NextResponse.json(
        { error: 'Failed to block user' },
        { status: 500 }
      );
    }

    // Reject all pending entries from this user for this owner's memorials
    const { data: ownerMemorials } = await supabase
      .from('memorials')
      .select('id')
      .eq('user_id', session.user.id);

    if (ownerMemorials && ownerMemorials.length > 0) {
      const memorialIds = ownerMemorials.map(m => m.id);
      
      await supabase
        .from('guestbook_entries')
        .update({
          status: 'rejected',
          moderated_at: new Date().toISOString(),
          moderated_by: session.user.id,
          moderation_reason: 'User blocked'
        })
        .eq('user_id', user_id)
        .in('memorial_id', memorialIds)
        .eq('status', 'pending');
    }

    return NextResponse.json({
      success: true,
      message: 'User has been blocked from posting to your memorials'
    });

  } catch (error) {
    console.error('Error in POST /api/guestbook/moderate/block:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/guestbook/moderate/block - Unblock a user
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
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete block record
    const { error: unblockError } = await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', user_id)
      .eq('blocked_by', session.user.id);

    if (unblockError) {
      console.error('Error unblocking user:', unblockError);
      return NextResponse.json(
        { error: 'Failed to unblock user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User has been unblocked'
    });

  } catch (error) {
    console.error('Error in DELETE /api/guestbook/moderate/block:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/guestbook/moderate/stats - Get moderation statistics
export async function GET(request: NextRequest) {
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

    // Get user's memorials
    const { data: memorials } = await supabase
      .from('memorials')
      .select('id')
      .eq('user_id', session.user.id);

    if (!memorials || memorials.length === 0) {
      return NextResponse.json({
        pending: 0,
        approved_today: 0,
        rejected_today: 0,
        total_approved: 0,
        total_rejected: 0,
        blocked_users: 0
      });
    }

    const memorialIds = memorials.map(m => m.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get pending count
    const { count: pendingCount } = await supabase
      .from('guestbook_entries')
      .select('*', { count: 'exact', head: true })
      .in('memorial_id', memorialIds)
      .eq('status', 'pending');

    // Get today's moderation stats
    const { data: todayStats } = await supabase
      .from('guestbook_entries')
      .select('status')
      .in('memorial_id', memorialIds)
      .gte('moderated_at', today.toISOString())
      .in('status', ['approved', 'rejected']);

    const approvedToday = todayStats?.filter(e => e.status === 'approved').length || 0;
    const rejectedToday = todayStats?.filter(e => e.status === 'rejected').length || 0;

    // Get all-time stats
    const { data: allTimeStats } = await supabase
      .from('guestbook_entries')
      .select('status')
      .in('memorial_id', memorialIds)
      .in('status', ['approved', 'rejected']);

    const totalApproved = allTimeStats?.filter(e => e.status === 'approved').length || 0;
    const totalRejected = allTimeStats?.filter(e => e.status === 'rejected').length || 0;

    // Get blocked users count
    const { count: blockedCount } = await supabase
      .from('blocked_users')
      .select('*', { count: 'exact', head: true })
      .eq('blocked_by', session.user.id);

    return NextResponse.json({
      pending: pendingCount || 0,
      approved_today: approvedToday,
      rejected_today: rejectedToday,
      total_approved: totalApproved,
      total_rejected: totalRejected,
      blocked_users: blockedCount || 0
    });

  } catch (error) {
    console.error('Error in GET /api/guestbook/moderate/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}