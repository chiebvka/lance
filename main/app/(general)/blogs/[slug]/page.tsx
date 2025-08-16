import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="container py-12">Blog Post</div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Article',
  description: 'Read the full article on BexForte.',
});