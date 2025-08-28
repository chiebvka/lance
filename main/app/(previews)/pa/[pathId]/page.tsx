import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { fetchPublicPathMetadata } from '@/hooks/paths/use-public-path'
import PathClient from './_components/path-client'

type Props = {
  params: Promise<{ pathId: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function Page({ params, searchParams }: Props) {
  const { pathId } = await params
  const { token } = await searchParams

  return <PathClient pathId={pathId} token={token} />
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pathId } = await params
  
  try {
    const metadata = await fetchPublicPathMetadata(pathId)
    
    return createPageMetadata({
      title: metadata.name || 'Path',
      description: metadata.description || 'A page to share links and contact information.',
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