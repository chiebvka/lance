import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import RefundPolicy from './_components/refund-policy'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="container py-12">
      <RefundPolicy />
    </div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Refund Policy - Bexforte',
  description: 'Bexforte refund policy and billing terms. Learn about our 3-day refund window and subscription management policies.',
  path: '/refund',
});