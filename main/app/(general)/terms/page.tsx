import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="container py-12">Terms & Conditions</div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Terms & Conditions',
  description: 'Legal terms for using BexForte. Please review these terms carefully.',
  path: '/terms',
});