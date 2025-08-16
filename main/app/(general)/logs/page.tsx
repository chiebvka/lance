import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="container py-12">Product Updates</div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Product Updates',
  description: 'Changelog of improvements and new features for BexForte.',
  path: '/logs',
});