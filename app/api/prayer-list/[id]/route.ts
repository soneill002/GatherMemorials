import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

// DELETE /api/prayer-list/[id] - Remove item from prayer list
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const itemId = params.id

    // Verify the prayer list item belongs to the user
    const { data: item, error: itemError } = await supabase
      .from('prayer_lists')
      .select('id, memorial_id, user_id')
      .eq('id', itemId)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Prayer list item not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('prayer_lists')
      .update({ 
        is_active: false,
        removed_date: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error removing from prayer list:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove from prayer list' },
        { status: 500 }
      )
    }

    // Track analytics event
    await supabase
      .from('memorial_analytics')
      .insert({
        memorial_id: item.memorial_id,
        event_type: 'prayer_list_removed',
        user_id: user.id
      })

    // Get memorial name for response
    const { data: memorial } = await supabase
      .from('memorials')
      .select('first_name, last_name')
      .eq('id', item.memorial_id)
      .single()

    return NextResponse.json({
      message: 'Removed from prayer list',
      memorial_name: memorial ? `${memorial.first_name} ${memorial.last_name}` : 'Memorial'
    })
  } catch (error) {
    console.error('Prayer list DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/prayer-list/[id] - Update prayer list item (notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const itemId = params.id
    const body = await request.json()
    const { notes } = body

    // Validate input
    if (notes !== undefined && notes !== null && typeof notes !== 'string') {
      return NextResponse.json(
        { error: 'Notes must be a string or null' },
        { status: 400 }
      )
    }

    if (notes && notes.length > 500) {
      return NextResponse.json(
        { error: 'Notes cannot exceed 500 characters' },
        { status: 400 }
      )
    }

    // Verify the prayer list item belongs to the user
    const { data: item, error: itemError } = await supabase
      .from('prayer_lists')
      .select('id, user_id, is_active')
      .eq('id', itemId)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Prayer list item not found' },
        { status: 404 }
      )
    }

    if (!item.is_active) {
      return NextResponse.json(
        { error: 'Cannot update removed prayer list item' },
        { status: 400 }
      )
    }

    // Update the notes
    const { data: updated, error: updateError } = await supabase
      .from('prayer_lists')
      .update({ 
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select(`
        id,
        memorial_id,
        notes,
        added_date,
        memorials (
          id,
          first_name,
          last_name
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating prayer list notes:', updateError)
      return NextResponse.json(
        { error: 'Failed to update prayer list notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Prayer list notes updated',
      prayer_list_item: {
        id: updated.id,
        memorial_id: updated.memorial_id,
        notes: updated.notes,
        added_date: updated.added_date,
        memorial_name: updated.memorials ? 
          `${updated.memorials.first_name} ${updated.memorials.last_name}` : 
          'Memorial'
      }
    })
  } catch (error) {
    console.error('Prayer list PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}