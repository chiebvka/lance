import React from 'react'
import ReceiptPreview from './_components/receipt-preview';
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { baseUrl } from '@/utils/universal'

interface PageProps {
  params: Promise<{ receiptId: string }>
}

export default async function page({ params }: PageProps) {
  const { receiptId } = await params;

  return (
    <div className='h-full w-full'>
      <ReceiptPreview receiptId={receiptId} />
    </div>
  )
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { receiptId } = await params
  try {
    const res = await fetch(`${baseUrl}/api/receipts/preview/${receiptId}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('not ok')
    const json = await res.json()
    const num = json?.data?.receiptNumber || receiptId
    const org = json?.data?.organizationName || 'Receipt'
    return createPageMetadata({
      title: `Receipt ${num} – ${org}`,
      description: `Receipt ${num} issued by ${org}. Download and share securely via BexForte.`,
      path: `/r/${receiptId}`,
    })
  } catch {
    return createPageMetadata({ title: 'Receipt', description: 'Receipt details and payment confirmation, shareable and easy to download.', path: `/r/${receiptId}` })
  }
}