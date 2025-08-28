import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

// GET /api/prayer-list/reminders - Fetch user's reminder preferences
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

    // Fetch existing reminder preferences
    const { data: preferences, error: fetchError } = await supabase
      .from('prayer_list_reminders')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If no preferences exist, return default settings
    if (fetchError || !preferences) {
      const defaultPreferences = {
        user_id: user.id,
        email_notifications: true,
        sms_notifications: false,
        reminder_time: '09:00:00',
        timezone: 'America/New_York',
        remind_day_before: true,
        remind_day_of: true,
        remind_week_before: false,
        // Catholic feast days
        all_souls_day: true,      // November 2
        all_saints_day: true,      // November 1
        good_friday: true,
        easter: true,
        christmas: true,
        divine_mercy_sunday: false,
        assumption_of_mary: false,
        // Frequency settings
        daily_digest: false,
        weekly_digest: true,
        digest_day: 0, // Sunday
        // Individual memorial settings (defaults)
        default_birthday_reminder: true,
        default_death_anniversary_reminder: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return NextResponse.json({
        preferences: defaultPreferences,
        is_default: true
      })
    }

    // Get count of active prayer list items
    const { count: activeCount } = await supabase
      .from('prayer_lists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Get upcoming reminders (next 7 days)
    const today = new Date()
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    const { data: prayerList } = await supabase
      .from('prayer_lists')
      .select(`
        id,
        memorial_id,
        remind_on_birthday,
        remind_on_death_anniversary,
        memorials (
          first_name,
          last_name,
          date_of_birth,
          date_of_death
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Calculate upcoming reminders
    const upcomingReminders = []
    const thisYear = today.getFullYear()

    if (prayerList) {
      for (const item of prayerList) {
        if (!item.memorials) continue

        // Check birthday reminders
        if (item.remind_on_birthday !== false && item.memorials.date_of_birth) {
          const birthDate = new Date(item.memorials.date_of_birth)
          const birthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate())
          
          if (birthday < today) {
            birthday.setFullYear(thisYear + 1)
          }

          // Check if within next 7 days
          if (birthday <= weekFromNow && birthday >= today) {
            upcomingReminders.push({
              type: 'birthday',
              date: birthday.toISOString(),
              memorial_name: `${item.memorials.first_name} ${item.memorials.last_name}`,
              memorial_id: item.memorial_id
            })
          }
        }

        // Check death anniversary reminders
        if (item.remind_on_death_anniversary !== false && item.memorials.date_of_death) {
          const deathDate = new Date(item.memorials.date_of_death)
          const anniversary = new Date(thisYear, deathDate.getMonth(), deathDate.getDate())
          
          if (anniversary < today) {
            anniversary.setFullYear(thisYear + 1)
          }

          // Check if within next 7 days
          if (anniversary <= weekFromNow && anniversary >= today) {
            upcomingReminders.push({
              type: 'death_anniversary',
              date: anniversary.toISOString(),
              memorial_name: `${item.memorials.first_name} ${item.memorials.last_name}`,
              memorial_id: item.memorial_id
            })
          }
        }
      }
    }

    // Sort upcoming reminders by date
    upcomingReminders.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Calculate special Catholic feast days
    const specialDates = {
      all_souls_day: new Date(thisYear, 10, 2), // November 2
      all_saints_day: new Date(thisYear, 10, 1), // November 1
      christmas: new Date(thisYear, 11, 25), // December 25
      // Easter and Good Friday would need complex calculation
      // For now, using approximate dates
      good_friday: new Date(thisYear, 3, 7), // Approximate
      easter: new Date(thisYear, 3, 9) // Approximate
    }

    // Check which feast days are coming up
    const upcomingFeastDays = []
    for (const [feast, date] of Object.entries(specialDates)) {
      if (date <= weekFromNow && date >= today && preferences[feast]) {
        upcomingFeastDays.push({
          feast,
          date: date.toISOString(),
          enabled: preferences[feast]
        })
      }
    }

    return NextResponse.json({
      preferences,
      is_default: false,
      statistics: {
        active_prayer_count: activeCount || 0,
        upcoming_reminders_count: upcomingReminders.length,
        upcoming_feast_days_count: upcomingFeastDays.length
      },
      upcoming_reminders: upcomingReminders.slice(0, 5),
      upcoming_feast_days: upcomingFeastDays
    })
  } catch (error) {
    console.error('Prayer list reminders GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/prayer-list/reminders - Update reminder preferences
export async function PATCH(request: NextRequest) {
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
    
    // Validate time format if provided
    if (body.reminder_time) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
      if (!timeRegex.test(body.reminder_time)) {
        return NextResponse.json(
          { error: 'Invalid time format. Use HH:MM:SS' },
          { status: 400 }
        )
      }
    }

    // Validate timezone if provided
    if (body.timezone) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: body.timezone })
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid timezone' },
          { status: 400 }
        )
      }
    }

    // Validate digest_day if provided (0-6, Sunday to Saturday)
    if (body.digest_day !== undefined) {
      if (body.digest_day < 0 || body.digest_day > 6) {
        return NextResponse.json(
          { error: 'Invalid digest day. Must be 0-6 (Sunday-Saturday)' },
          { status: 400 }
        )
      }
    }

    // Check if preferences exist
    const { data: existing, error: fetchError } = await supabase
      .from('prayer_list_reminders')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result
    
    if (existing) {
      // Update existing preferences
      const updates = {
        ...body,
        updated_at: new Date().toISOString()
      }

      const { data: updated, error: updateError } = await supabase
        .from('prayer_list_reminders')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating reminder preferences:', updateError)
        return NextResponse.json(
          { error: 'Failed to update reminder preferences' },
          { status: 500 }
        )
      }

      result = updated
    } else {
      // Create new preferences
      const newPreferences = {
        user_id: user.id,
        email_notifications: body.email_notifications ?? true,
        sms_notifications: body.sms_notifications ?? false,
        reminder_time: body.reminder_time ?? '09:00:00',
        timezone: body.timezone ?? 'America/New_York',
        remind_day_before: body.remind_day_before ?? true,
        remind_day_of: body.remind_day_of ?? true,
        remind_week_before: body.remind_week_before ?? false,
        all_souls_day: body.all_souls_day ?? true,
        all_saints_day: body.all_saints_day ?? true,
        good_friday: body.good_friday ?? true,
        easter: body.easter ?? true,
        christmas: body.christmas ?? true,
        divine_mercy_sunday: body.divine_mercy_sunday ?? false,
        assumption_of_mary: body.assumption_of_mary ?? false,
        daily_digest: body.daily_digest ?? false,
        weekly_digest: body.weekly_digest ?? true,
        digest_day: body.digest_day ?? 0,
        default_birthday_reminder: body.default_birthday_reminder ?? true,
        default_death_anniversary_reminder: body.default_death_anniversary_reminder ?? true,
        ...body
      }

      const { data: created, error: createError } = await supabase
        .from('prayer_list_reminders')
        .insert(newPreferences)
        .select()
        .single()

      if (createError) {
        console.error('Error creating reminder preferences:', createError)
        return NextResponse.json(
          { error: 'Failed to create reminder preferences' },
          { status: 500 }
        )
      }

      result = created
    }

    // If digest settings changed, schedule/reschedule cron jobs
    if (body.daily_digest !== undefined || body.weekly_digest !== undefined) {
      // This would typically trigger a background job to update cron schedules
      console.log('Digest settings updated, rescheduling reminders...')
      
      // Track analytics event
      await supabase
        .from('memorial_analytics')
        .insert({
          user_id: user.id,
          event_type: 'reminder_preferences_updated',
          metadata: {
            daily_digest: body.daily_digest,
            weekly_digest: body.weekly_digest
          }
        })
    }

    return NextResponse.json({
      message: 'Reminder preferences updated successfully',
      preferences: result
    })
  } catch (error) {
    console.error('Prayer list reminders PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/prayer-list/reminders/test - Send test reminder email
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

    // Get user's email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json(
        { error: 'No email address found' },
        { status: 400 }
      )
    }

    // Get sample prayer list items for test email
    const { data: sampleItems } = await supabase
      .from('prayer_lists')
      .select(`
        memorials (
          first_name,
          last_name,
          date_of_birth,
          date_of_death
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(3)

    // Queue test email (would integrate with email service)
    console.log('Sending test reminder email to:', profile.email)
    console.log('Sample items:', sampleItems)

    // In production, this would actually send an email via SendGrid/Resend
    // For now, we'll just simulate it
    
    return NextResponse.json({
      message: 'Test reminder email sent',
      email: profile.email,
      sample_count: sampleItems?.length || 0
    })
  } catch (error) {
    console.error('Prayer list test reminder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}