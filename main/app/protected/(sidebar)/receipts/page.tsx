import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';
import ReceiptClient from './_components/receipt-client';
import { getOrganizationReceipts } from '@/lib/receipt'; // Import shared

type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase); // Still check auth

  let initialReceipts = [];
  try {
    initialReceipts = await getOrganizationReceipts(supabase);
  } catch {
    return redirect('/error');
  }

  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
      <Suspense fallback={<div>Loading receipts...</div>}>
        <ReceiptClient initialReceipts={initialReceipts} userEmail={user?.email ?? null} />
      </Suspense>
    </div>
  )
}








// import { getReceiptsWithDetails } from '@/lib/receipt';
// import { getAuthenticatedUser } from '@/utils/auth';
// import { createClient } from '@/utils/supabase/server';
// import { redirect } from 'next/navigation';
// import React from 'react'
// import ReceiptClient from './_components/receipt-client';

// type Props = {}

// export default async function page({}: Props) {
//   const supabase = await createClient();
//   const user = await getAuthenticatedUser(supabase);

//   let initialReceipts = []
//   try {
//     initialReceipts = await getReceiptsWithDetails(supabase, user.id)
//   } catch {
//     return redirect('/error')
//   }




//   return (
//     <div className='w-full py-4 px-6 border border-bexoni'>
//       <ReceiptClient initialReceipts={initialReceipts} />
//     </div>
//   )
// }