import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

// GET /api/prayer-list - Fetch user's prayer list with memorial details
export async function GET(request: NextRequest) {
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

    // Fetch prayer list with memorial details
    const { data: prayerList, error: listError } = await supabase
      .from('prayer_lists')
      .select(`
        id,
        memorial_id,
        added_date,
        notes,
        memorials (
          id,
          first_name,
          middle_name,
          last_name,
          nickname,
          date_of_birth,
          date_of_death,
          headline,
          featured_image,
          cover_photo,
          privacy_setting,
          custom_url,
          status
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('added_date', { ascending: false })

    if (listError) {
      console.error('Error fetching prayer list:', listError)
      return NextResponse.json(
        { error: 'Failed to fetch prayer list' },
        { status: 500 }
      )
    }

    // Transform the data to match expected format
    const formattedList = prayerList?.map(item => ({
      id: item.id,
      memorial_id: item.memorial_id,
      added_date: item.added_date,
      notes: item.notes,
      memorial: item.memorials
    })) || []

    // Calculate upcoming anniversaries (within next 30 days)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const anniversaries = []
    const thisYear = today.getFullYear()
    
    for (const item of formattedList) {
      if (!item.memorial) continue
      
      // Check death anniversary
      if (item.memorial.date_of_death) {
        const deathDate = new Date(item.memorial.date_of_death)
        const deathAnniversary = new Date(thisYear, deathDate.getMonth(), deathDate.getDate())
        
        // If anniversary already passed this year, check next year
        if (deathAnniversary < today) {
          deathAnniversary.setFullYear(thisYear + 1)
        }
        
        const daysUntilDeath = Math.ceil((deathAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilDeath <= 30 && daysUntilDeath >= 0) {
          anniversaries.push({
            memorial_id: item.memorial.id,
            memorial_name: `${item.memorial.first_name} ${item.memorial.last_name}`,
            type: 'death',
            date: deathAnniversary.toISOString(),
            days_until: daysUntilDeath,
            years_since: thisYear - deathDate.getFullYear()
          })
        }
      }
      
      // Check birthday
      if (item.memorial.date_of_birth) {
        const birthDate = new Date(item.memorial.date_of_birth)
        const birthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate())
        
        // If birthday already passed this year, check next year
        if (birthday < today) {
          birthday.setFullYear(thisYear + 1)
        }
        
        const daysUntilBirth = Math.ceil((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilBirth <= 30 && daysUntilBirth >= 0) {
          anniversaries.push({
            memorial_id: item.memorial.id,
            memorial_name: `${item.memorial.first_name} ${item.memorial.last_name}`,
            type: 'birthday',
            date: birthday.toISOString(),
            days_until: daysUntilBirth,
            years_old: birthday.getFullYear() - birthDate.getFullYear()
          })
        }
      }
    }
    
    // Sort anniversaries by days_until
    anniversaries.sort((a, b) => a.days_until - b.days_until)

    // Get prayer list statistics
    const stats = {
      total_count: formattedList.length,
      anniversaries_count: anniversaries.length,
      recent_additions: formattedList.slice(0, 5).map(item => ({
        memorial_id: item.memorial_id,
        memorial_name: item.memorial ? `${item.memorial.first_name} ${item.memorial.last_name}` : 'Unknown',
        added_date: item.added_date
      }))
    }

    return NextResponse.json({
      prayer_list: formattedList,
      upcoming_anniversaries: anniversaries,
      stats: stats
    })
  } catch (error) {
    console.error('Prayer list API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/prayer-list - Add a memorial to prayer list
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { memorial_id, notes } = body

    if (!memorial_id) {
      return NextResponse.json(
        { error: 'Memorial ID is required' },
        { status: 400 }
      )
    }

    // Check if memorial exists and is accessible
    const { data: memorial, error: memorialError } = await supabase
      .from('memorials')
      .select('id, first_name, last_name, privacy_setting, password_hash')
      .eq('id', memorial_id)
      .single()

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: 'Memorial not found' },
        { status: 404 }
      )
    }

    // Check if memorial is public or user is the owner
    if (memorial.privacy_setting === 'private') {
      const { data: owner } = await supabase
        .from('memorials')
        .select('user_id')
        .eq('id', memorial_id)
        .single()
      
      if (owner?.user_id !== user.id) {
        return NextResponse.json(
          { error: 'This memorial is private' },
          { status: 403 }
        )
      }
    }

    // Check if already in prayer list
    const { data: existing } = await supabase
      .from('prayer_lists')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('memorial_id', memorial_id)
      .single()

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { error: 'Memorial already in prayer list' },
          { status: 409 }
        )
      }
      
      // Reactivate if previously removed
      const { data: updated, error: updateError } = await supabase
        .from('prayer_lists')
        .update({ 
          is_active: true, 
          notes: notes || existing.notes,
          added_date: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error reactivating prayer list item:', updateError)
        return NextResponse.json(
          { error: 'Failed to add to prayer list' },
          { status: 500 }
        )
      }

      // Track analytics event
      await supabase
        .from('memorial_analytics')
        .insert({
          memorial_id,
          event_type: 'prayer_list_readded',
          user_id: user.id
        })

      return NextResponse.json({
        message: 'Memorial re-added to prayer list',
        prayer_list_item: updated
      })
    }

    // Add new prayer list item
    const { data: newItem, error: insertError } = await supabase
      .from('prayer_lists')
      .insert({
        user_id: user.id,
        memorial_id,
        notes: notes || null,
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error adding to prayer list:', insertError)
      return NextResponse.json(
        { error: 'Failed to add to prayer list' },
        { status: 500 }
      )
    }

    // Track analytics event
    await supabase
      .from('memorial_analytics')
      .insert({
        memorial_id,
        event_type: 'prayer_list_added',
        user_id: user.id
      })

    // Send notification email (if user has it enabled)
    const { data: preferences } = await supabase
      .from('prayer_list_reminders')
      .select('email_notifications')
      .eq('user_id', user.id)
      .single()

    if (preferences?.email_notifications) {
      // Queue email notification (implement with your email service)
      // This would typically be done via a job queue or email service
      console.log(`Queue confirmation email for adding ${memorial.first_name} ${memorial.last_name} to prayer list`)
    }

    return NextResponse.json({
      message: 'Memorial added to prayer list',
      prayer_list_item: newItem,
      memorial_name: `${memorial.first_name} ${memorial.last_name}`
    }, { status: 201 })
  } catch (error) {
    console.error('Prayer list POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}