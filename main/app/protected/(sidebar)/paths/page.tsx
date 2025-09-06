import { getOrganizationPaths } from '@/lib/path';
import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react'
import PathClient from './_components/path-client';
import {Path } from "@/hooks/paths/use-paths"
import ProjectClientSkeleton from '../projects/_components/project-client-skeleton';

type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  let initialPaths: Path[] = [];
  try {
    initialPaths = await getOrganizationPaths(supabase);
  } catch {
    // return redirect('/error');
  }

  return (
    <div className='w-full py-4 px-6'>
    <Suspense fallback={<ProjectClientSkeleton />}>
      <PathClient initialPaths={initialPaths} userEmail={user?.email ?? null} />
    </Suspense>
  </div>
  )
}