// features/memorials/api/server.ts
// Server-side API functions for memorial operations

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Memorial } from '@/types/memorial'

export async function getMemorialForEdit(
  memorialId: string,
  userId: string
): Promise<{ memorial: Memorial | null; error: any }> {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Check ownership and permissions
    const { data: memorial, error } = await supabase
      .from('memorials')
      .select('*')
      .eq('id', memorialId)
      .single()

    if (error) {
      return { memorial: null, error }
    }

    // Check if user can edit
    if (memorial.userId !== userId) {
      // Check if user is a contributor
      const { data: contributor } = await supabase
        .from('memorial_contributors')
        .select('*')
        .eq('memorial_id', memorialId)
        .eq('user_id', userId)
        .single()

      if (!contributor || !contributor.permissions.canEdit) {
        return { 
          memorial: null, 
          error: { code: 'FORBIDDEN', message: 'Permission denied' }
        }
      }
    }

    return { memorial, error: null }
  } catch (error) {
    return { memorial: null, error }
  }
}