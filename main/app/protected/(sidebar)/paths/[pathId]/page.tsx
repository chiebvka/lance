import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import React from 'react'
import { redirect } from 'next/navigation';
import PathEditor from './_components/path-editor';
import { getOrganizationPaths } from '@/lib/path';

type Props = {
  params: Promise<{ pathId: string }>
}

export default async function page({ params }: Props) {
  const { pathId } = await params;
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  try {
    const paths = await getOrganizationPaths(supabase);
    const path = paths.find(p => p.id === pathId);

    if (!path) {
      return redirect('/error');
    }

    return (
      <div>
        <PathEditor initialPath={path} />
      </div>
    )
  } catch (error) {
    console.error('Path fetch error:', error);
    return redirect('/error');
  }
}