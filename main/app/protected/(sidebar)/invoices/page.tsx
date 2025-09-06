import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react'
import InvoiceClient from './_components/invoice-client';
import { getOrganizationInvoices } from '@/lib/invoice';
import {  Invoice } from '@/hooks/invoices/use-invoices'
import ProjectClientSkeleton from '../projects/_components/project-client-skeleton';


type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  let initialInvoices:  Invoice[] = [] 
  try {
    initialInvoices = await getOrganizationInvoices(supabase)
  } catch {
    // return redirect('/error')
  }

  // console.log(initialInvoices)

  return (
    <div className='w-full py-4 px-6 '>
      <Suspense fallback={<ProjectClientSkeleton />}>
        <InvoiceClient initialInvoices={initialInvoices} userEmail={user?.email ?? null} />
      </Suspense>
    </div>
  )
}