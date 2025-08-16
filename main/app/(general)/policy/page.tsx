import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="container py-12">Privacy Policy</div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Privacy Policy',
  description: 'How BexForte collects, uses and protects your data.',
  path: '/policy',
});