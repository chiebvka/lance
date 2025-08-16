import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="w-full">Links Wall</div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Links',
  description: 'A curated list of important links. Share one URL for everything.',
});