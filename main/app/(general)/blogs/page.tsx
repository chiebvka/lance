import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="container py-12">Blog</div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Blog',
  description: 'Insights on client operations and product updates from the BexForte team.',
  path: '/blogs',
});