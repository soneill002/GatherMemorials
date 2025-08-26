// app/api/memorials/route.ts
// API endpoint for creating new memorials
// Handles authentication, validation, and database operations

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { Database } from '@/types/database'

// Validation schema using Zod for type safety
const createMemorialSchema = z.object({
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional().nullable(),
  lastName: z.string().min(1).max(100),
  nickname: z.string().max(100).optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deathDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1).max(200),
  obituary: z.string().max(5000).optional().nullable(),
  biography: z.string().max(10000).optional().nullable(),
  privacy: z.enum(['public', 'private', 'password_protected']),
  password: z.string().min(8).max(128).optional().nullable(),
  customUrl: z.string().regex(/^[a-z0-9-]+$/).min(3).max(50).optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client with proper typing
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createMemorialSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check for duplicate custom URL if provided
    if (data.customUrl) {
      const { data: existing } = await supabase
        .from('memorials')
        .select('id')
        .eq('custom_url', data.customUrl)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Custom URL already taken' },
          { status: 409 }
        )
      }
    }

    // Hash password if provided (using bcrypt in production)
    let hashedPassword = null
    if (data.privacy === 'password_protected' && data.password) {
      // In production, use bcrypt or argon2
      // const bcrypt = await import('bcryptjs')
      // hashedPassword = await bcrypt.hash(data.password, 10)
      hashedPassword = data.password // Temporary - implement proper hashing
    }

    // Create memorial in database
    const { data: memorial, error: dbError } = await supabase
      .from('memorials')
      .insert({
        user_id: session.user.id,
        first_name: data.firstName,
        middle_name: data.middleName,
        last_name: data.lastName,
        nickname: data.nickname,
        birth_date: data.birthDate,
        death_date: data.deathDate,
        title: data.title,
        obituary: data.obituary,
        biography: data.biography,
        privacy: data.privacy,
        password: hashedPassword,
        custom_url: data.customUrl,
        status: 'draft',
        pricing_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create memorial' },
        { status: 500 }
      )
    }

    // Return created memorial
    return NextResponse.json({ 
      id: memorial.id,
      message: 'Memorial created successfully' 
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}