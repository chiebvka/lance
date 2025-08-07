import React from 'react'
import InvoicePreview from './_components/invoice-preview'

interface PageProps {
  params: Promise<{ invoiceId: string }>
}

export default async function InvoicePage({ params }: PageProps) {
  const { invoiceId } = await params;

  return (
    <div>
      <InvoicePreview invoiceId={invoiceId} />
    </div>
  )
}