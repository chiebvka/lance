import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { fetchPublicWallMetadata } from '@/hooks/walls/use-public-wall'
import WallClient from './_components/wall-client'

type Props = {
  params: Promise<{ wallId: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function page({ params, searchParams }: Props) {
  const { wallId } = await params
  const { token } = await searchParams

  return <WallClient wallId={wallId} token={token} />
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { wallId } = await params
  
  try {
    const metadata = await fetchPublicWallMetadata(wallId)
    
    return createPageMetadata({
      title: metadata.name || 'Wall',
      description: metadata.description || 'A beautiful wall page to share instructions, media and links in one URL.',
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

