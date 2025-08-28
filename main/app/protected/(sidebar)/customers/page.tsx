import React from 'react'
import RecentActivityWrapper from './_components/recent-activity-wrapper'
import CustomersClient from './_components/customers-client'
import { createClient } from '@/utils/supabase/server';
import { getAuthenticatedUser } from '@/utils/auth';
import { redirect } from 'next/navigation';

// You'll need to fetch your customers data here
// This is just a placeholder - replace with your actual data fetching


export default async function CustomersPage() {

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);



  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
      <CustomersClient />
      {/* <RecentActivityWrapper /> */}
    </div>
  )
}