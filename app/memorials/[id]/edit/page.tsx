// app/memorials/[id]/edit/page.tsx
// Edit existing memorial page with authentication and permission checks
// Handles data fetching and authorization before rendering the studio

import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import StudioSkeleton from '@/features/memorials/components/StudioSkeleton'
import { getMemorialForEdit } from '@/features/memorials/api/server'

const MemorialStudio = dynamic(
  () => import('@/features/memorials/components/MemorialStudio'),
  {
    loading: () => <StudioSkeleton />,
    ssr: false
  }
)

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: 'Edit Memorial - Gather Memorials',
    robots: 'noindex, nofollow',
  }
}

interface EditMemorialPageProps {
  params: {
    id: string
  }
}

export default async function EditMemorialPage({ params }: EditMemorialPageProps) {
  // Initialize Supabase client with cookies for auth
  const supabase = createServerComponentClient({ cookies })
  
  // Check authentication
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  
  if (!session || authError) {
    // Redirect to login with return URL
    redirect(`/auth/login?returnTo=/memorials/${params.id}/edit`)
  }

  // Fetch memorial with edit permissions check
  const { memorial, error } = await getMemorialForEdit(params.id, session.user.id)

  if (error || !memorial) {
    // Check if it's a permission error vs not found
    if (error?.code === 'FORBIDDEN') {
      redirect(`/memorials/${params.id}`) // Redirect to view-only page
    }
    notFound()
  }

  return (
    <Suspense fallback={<StudioSkeleton />}>
      <MemorialStudio 
        mode="edit" 
        initialData={memorial}
        memorialId={params.id}
      />
    </Suspense>
  )
}