import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="container py-12">Branding Assets</div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Branding',
  description: 'Download BexForte logos, colors and brand guidelines.',
  path: '/branding',
});