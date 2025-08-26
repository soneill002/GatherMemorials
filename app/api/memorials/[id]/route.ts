// app/api/memorials/[id]/route.ts
// API endpoint for updating and deleting memorials
// Includes proper authorization and optimistic locking

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { Database } from '@/types/database'

// Partial schema for updates
const updateMemorialSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  middleName: z.string().max(100).nullable().optional(),
  lastName: z.string().min(1).max(100).optional(),
  nickname: z.string().max(100).nullable().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  deathDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  title: z.string().min(1).max(200).optional(),
  obituary: z.string().max(5000).nullable().optional(),
  biography: z.string().max(10000).nullable().optional(),
  privacy: z.enum(['public', 'private', 'password_protected']).optional(),
  password: z.string().min(8).max(128).nullable().optional(),
  customUrl: z.string().regex(/^[a-z0-9-]+$/).min(3).max(50).nullable().optional(),
  photos: z.array(z.any()).optional(), // Define proper photo schema
  enablePrayers: z.boolean().optional(),
  enableMassIntentions: z.boolean().optional(),
  parishId: z.string().uuid().nullable().optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Retrieve memorial
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: memorial, error } = await supabase
      .from('memorials')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !memorial) {
      return NextResponse.json(
        { error: 'Memorial not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(memorial)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update memorial
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check ownership
    const { data: memorial } = await supabase
      .from('memorials')
      .select('user_id, updated_at')
      .eq('id', params.id)
      .single()

    if (!memorial) {
      return NextResponse.json(
        { error: 'Memorial not found' },
        { status: 404 }
      )
    }

    if (memorial.user_id !== session.user.id) {
      // Check contributor permissions
      const { data: contributor } = await supabase
        .from('memorial_contributors')
        .select('permissions')
        .eq('memorial_id', params.id)
        .eq('user_id', session.user.id)
        .single()

      if (!contributor?.permissions?.canEdit) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    // Parse and validate update data
    const body = await request.json()
    const validationResult = updateMemorialSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const updates = validationResult.data

    // Check custom URL availability if changing
    if (updates.customUrl) {
      const { data: existing } = await supabase
        .from('memorials')
        .select('id')
        .eq('custom_url', updates.customUrl)
        .neq('id', params.id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Custom URL already taken' },
          { status: 409 }
        )
      }
    }

    // Prepare update data (convert camelCase to snake_case)
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    }

    // Map fields to database columns
    const fieldMap: Record<string, string> = {
      firstName: 'first_name',
      middleName: 'middle_name',
      lastName: 'last_name',
      birthDate: 'birth_date',
      deathDate: 'death_date',
      customUrl: 'custom_url',
      enablePrayers: 'enable_prayers',
      enableMassIntentions: 'enable_mass_intentions',
      parishId: 'parish_id',
    }

    Object.entries(updates).forEach(([key, value]) => {
      const dbKey = fieldMap[key] || key
      dbUpdates[dbKey] = value
    })

    // Handle password update separately
    if (updates.privacy === 'password_protected' && updates.password) {
      // Hash password (implement proper hashing)
      dbUpdates.password = updates.password
    } else if (updates.privacy !== 'password_protected') {
      dbUpdates.password = null
    }

    // Update memorial with optimistic locking
    const { data: updated, error: updateError } = await supabase
      .from('memorials')
      .update(dbUpdates)
      .eq('id', params.id)
      .eq('updated_at', memorial.updated_at) // Optimistic locking
      .select()
      .single()

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Memorial was modified by another user. Please refresh and try again.' },
          { status: 409 }
        )
      }
      throw updateError
    }

    return NextResponse.json({ 
      id: params.id,
      message: 'Memorial updated successfully' 
    })

  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete memorial
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check ownership (only owners can delete)
    const { data: memorial } = await supabase
      .from('memorials')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!memorial) {
      return NextResponse.json(
        { error: 'Memorial not found' },
        { status: 404 }
      )
    }

    if (memorial.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Soft delete (mark as deleted rather than removing)
    const { error: deleteError } = await supabase
      .from('memorials')
      .update({ 
        status: 'deleted',
        deleted_at: new Date().toISOString() 
      })
      .eq('id', params.id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ 
      message: 'Memorial deleted successfully' 
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}