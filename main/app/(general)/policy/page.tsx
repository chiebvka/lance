import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import PrivacyPolicy from './_components/privacy-policy'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="container py-12">
      <PrivacyPolicy />
    </div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Privacy Policy - Bexforte',
  description: 'How Bexforte collects, uses, and protects your personal information and business data.',
  path: '/policy',
});