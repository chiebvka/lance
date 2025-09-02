import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import TermsOfService from './_components/terms-of-service'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="container py-12">
      <TermsOfService />
    </div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Terms of Service - Bexforte',
  description: 'Legal terms and conditions for using Bexforte. Please review these terms carefully before using our services.',
  path: '/terms',
});