import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import React from 'react'
import PathBuilder from './_components/path-builder';

type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  return (
    <div>
        <PathBuilder />
    </div>
  )
}