import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react'
import InvoiceClient from './_components/invoice-client';
import { getOrganizationInvoices } from '@/lib/invoice';


type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  let initialInvoices = []
  try {
    initialInvoices = await getOrganizationInvoices(supabase)
  } catch {
    return redirect('/error')
  }

  // console.log(initialInvoices)

  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
      <Suspense fallback={<div>Loading invoices...</div>}>
        <InvoiceClient initialInvoices={initialInvoices} userEmail={user?.email ?? null} />
      </Suspense>
    </div>
  )
}