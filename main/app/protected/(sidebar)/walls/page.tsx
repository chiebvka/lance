import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import React, { Suspense } from 'react'
import WallClient from './_components/wall-client';
import { redirect } from 'next/navigation';
import { getOrganizationWalls } from '@/lib/wall';

type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  let initialWalls = [];
  try {
    initialWalls = await getOrganizationWalls(supabase);
  } catch {
    return redirect('/error');
  }

  console.log(initialWalls);

  return (
    <div className='w-full py-4 px-6'>
      <Suspense fallback={<div>Loading walls...</div>}>
        <WallClient initialWalls={initialWalls} userEmail={user?.email ?? null} />
      </Suspense>
    </div>
  )
}