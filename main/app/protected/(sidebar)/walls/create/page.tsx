import { getAuthenticatedUser } from '@/utils/auth';
import { createClient } from '@/utils/supabase/server';
import React from 'react'
import WallBuilder from './_components/wall-builder';


type Props = {}

export default async function page({}: Props) {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
  return (
    <div>
        <WallBuilder />
    </div>
  )
}