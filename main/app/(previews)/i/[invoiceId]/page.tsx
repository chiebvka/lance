import React from 'react'
import InvoicePreview from './_components/invoice-preview'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { baseUrl } from '@/utils/universal'

interface PageProps {
  params: Promise<{ invoiceId: string }>
}

export default async function InvoicePage({ params }: PageProps) {
  const { invoiceId } = await params;

  return (
    <div className='h-full w-full'>
      <InvoicePreview invoiceId={invoiceId} />
    </div>
  )
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { invoiceId } = await params
  try {
    const res = await fetch(`${baseUrl}/api/invoices/preview/${invoiceId}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('not ok')
    const json = await res.json()
    const num = json?.data?.invoiceNumber || invoiceId
    const org = json?.data?.organizationName || 'Invoice'
    return createPageMetadata({
      title: `Invoice ${num} – ${org}`,
      description: `Invoice ${num} from ${org}. View, pay and download securely via BexForte.`,
      path: `/i/${invoiceId}`,
    })
  } catch {
    return createPageMetadata({ title: 'Invoice', description: 'View your invoice securely. Pay, download and share via BexForte.', path: `/i/${invoiceId}` })
  }
}