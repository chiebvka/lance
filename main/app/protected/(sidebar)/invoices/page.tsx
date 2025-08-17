import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react'
import InvoiceClient from './_components/invoice-client';
import { getInvoicesWithDetails } from '@/lib/invoice';

type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  let initialInvoices = []
  try {
    initialInvoices = await getInvoicesWithDetails(supabase, user.id)
  } catch {
    return redirect('/error')
  }

  // console.log(initialInvoices)

  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
      <InvoiceClient initialInvoices={initialInvoices} />
    </div>
  )
}