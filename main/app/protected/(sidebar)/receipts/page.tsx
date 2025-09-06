import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';
import ReceiptClient from './_components/receipt-client';
import { getOrganizationReceipts } from '@/lib/receipt'; // Import shared
import ProjectClientSkeleton from '../projects/_components/project-client-skeleton';
import {  Receipt } from '@/hooks/receipts/use-receipts';

type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase); // Still check auth

  let initialReceipts: Receipt[] = [];
  try {
    initialReceipts = await getOrganizationReceipts(supabase);
  } catch {
    // return redirect('/error');
  }

  return (
    <div className='w-full py-4 px-6'>
      <Suspense fallback={<ProjectClientSkeleton />}>
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