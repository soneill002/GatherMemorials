// app/memorials/new/page.tsx
// Memorial creation page - the single source of truth for new memorial creation
// This is the primary route users will access

import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import StudioSkeleton from '@/features/memorials/components/StudioSkeleton'

// Dynamic import for better code splitting and initial load performance
// This ensures the heavy studio component only loads when needed
const MemorialStudio = dynamic(
  () => import('@/features/memorials/components/MemorialStudio'),
  {
    loading: () => <StudioSkeleton />,
    ssr: false // Disable SSR for studio to prevent hydration issues with local storage
  }
)

export const metadata: Metadata = {
  title: 'Create Memorial - Gather Memorials',
  description: 'Create a beautiful, faith-centered digital memorial for your loved one',
  robots: 'noindex, nofollow', // Don't index draft pages
}

export default async function NewMemorialPage() {
  // Server-side authentication check
  const supabase = createServerComponentClient({ cookies })
  const { data: { session }, error } = await supabase.auth.getSession()

  // Redirect to login if not authenticated
  // Store the intended destination so we can redirect back after login
  if (!session || error) {
    redirect('/auth/login?returnTo=/memorials/new')
  }

  // Check if user has reached their memorial limit (for free tier)
  const { count } = await supabase
    .from('memorials')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)

  // Free tier limit check (you can adjust based on your business logic)
  const FREE_TIER_LIMIT = 1
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', session.user.id)
    .single()

  if (!subscription?.tier && count && count >= FREE_TIER_LIMIT) {
    // Redirect to upgrade page if they've hit the free tier limit
    redirect('/pricing?reason=memorial_limit')
  }

  return (
    <Suspense fallback={<StudioSkeleton />}>
      <MemorialStudio mode="create" />
    </Suspense>
  )
}