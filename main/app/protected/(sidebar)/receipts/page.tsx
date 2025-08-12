import { getReceiptsWithDetails } from '@/lib/receipt';
import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react'
import ReceiptClient from './_components/receipt-client';

type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  let initialReceipts = []
  try {
    initialReceipts = await getReceiptsWithDetails(supabase, user.id)
  } catch {
    return redirect('/error')
  }

  console.log(initialReceipts)


  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
      <ReceiptClient initialReceipts={initialReceipts} />
    </div>
  )
}