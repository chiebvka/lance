import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { createClient } from '@/utils/supabase/server'
import PathClient from './_components/path-client'

type Props = {
  params: Promise<{ pathId: string }>
  searchParams: Promise<{ token?: string }>
}

async function fetchPathState(pathId: string, token?: string) {
  const supabase = await createClient()
  
  const { data: path, error } = await supabase
    .from('paths')
    .select('state, token, private')
    .eq('id', pathId)
    .single()

  if (error || !path) {
    return { state: 'not_found', hasValidToken: false, isPrivate: false }
  }

  const hasValidToken = path.token === token
  return { 
    state: path.state, 
    hasValidToken, 
    isPrivate: path.private,
    hasToken: !!path.token 
  }
}

export default async function Page({ params, searchParams }: Props) {
  const { pathId } = await params
  const { token } = await searchParams

  const { state, hasValidToken, isPrivate, hasToken } = await fetchPathState(pathId, token)

  // Check if path exists
  if (state === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center p-8 bg-lightCard dark:bg-darkCard rounded-none shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Path Not Found</h1>
          <p className="text-gray-600">The requested path could not be found or may have been removed.</p>
        </div>
      </div>
    )
  }

  // For private paths, check if valid token is provided
  if (isPrivate && (!token || !hasValidToken)) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center p-8 bg-lightCard dark:bg-darkCard rounded-none shadow-lg max-w-lg">
          <h1 className="text-2xl font-bold text-primary mb-4">Access Required</h1>
          <p className="text-gray-600">
            {!token ? 
              'This path is private and requires an unlock code to view.' :
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

  // Allow preview of public paths even in draft state
  return (
    <div className='h-full w-full'>
      <PathClient pathId={pathId} token={token || ''} state={state} />
    </div>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pathId } = await params
  
  try {
    const supabase = await createClient()
    const { data: path } = await supabase
      .from('paths')
      .select('name, description')
      .eq('id', pathId)
      .single()
    
    return createPageMetadata({
      title: path?.name || 'Path',
      description: path?.description || 'A page to share links and contact information.',
      image: `/api/og?type=paths&id=${pathId}`,
    })
  } catch (error) {
    return createPageMetadata({
      title: 'Path Not Found',
      description: 'The requested path could not be found.',
      image: `/api/og?type=paths&id=${pathId}`,
    })
  }
}