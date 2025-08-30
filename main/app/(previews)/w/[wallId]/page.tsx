import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { createClient } from '@/utils/supabase/server'
import WallClient from './_components/wall-client'

type Props = {
  params: Promise<{ wallId: string }>
  searchParams: Promise<{ token?: string }>
}

async function fetchWallState(wallId: string, token?: string) {
  const supabase = await createClient()
  
  const { data: wall, error } = await supabase
    .from('walls')
    .select('state, token, private')
    .eq('id', wallId)
    .single()

  if (error || !wall) {
    return { state: 'not_found', hasValidToken: false, isPrivate: false }
  }

  const hasValidToken = wall.token === token
  return { 
    state: wall.state, 
    hasValidToken, 
    isPrivate: wall.private,
    hasToken: !!wall.token 
  }
}

export default async function page({ params, searchParams }: Props) {
  const { wallId } = await params
  const { token } = await searchParams

  const { state, hasValidToken, isPrivate, hasToken } = await fetchWallState(wallId, token)

  // Check if wall exists
  if (state === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center p-8 bg-lightCard dark:bg-darkCard rounded-none shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Wall Not Found</h1>
          <p className="text-gray-600">The requested wall could not be found or may have been removed.</p>
        </div>
      </div>
    )
  }

  // For private walls, check if valid token is provided
  if (isPrivate && (!token || !hasValidToken)) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center p-8 bg-lightCard dark:bg-darkCard rounded-none shadow-lg max-w-lg">
          <h1 className="text-2xl font-bold text-primary mb-4">Access Required</h1>
          <p className="text-gray-600">
            {!token ? 
              'This wall is private and requires an unlock code to view.' :
              'The provided unlock code is invalid or expired.'
            }
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please contact whoever sent you this link to get a new link.
          </p>
        </div>
      </div>
    )
  }

  // Allow preview of public walls even in draft state
  return (
    <div className='h-full w-full'>
      <WallClient wallId={wallId} token={token || ''} state={state} />
    </div>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { wallId } = await params
  
  try {
    const supabase = await createClient()
    const { data: wall } = await supabase
      .from('walls')
      .select('name, description')
      .eq('id', wallId)
      .single()
    
    return createPageMetadata({
      title: wall?.name || 'Wall',
      description: wall?.description || 'A beautiful wall page to share instructions, media and links in one URL.',
      image: `/api/og?type=walls&id=${wallId}`,
    })
  } catch (error) {
    return createPageMetadata({
      title: 'Wall Not Found',
      description: 'The requested wall could not be found.',
      image: `/api/og?type=walls&id=${wallId}`,
    })
  }
}

