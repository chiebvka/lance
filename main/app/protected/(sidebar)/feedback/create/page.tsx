import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import FeedbackBuilder from './_components/feedback-builder';
import { getAuthenticatedUser } from '@/utils/auth';

type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  return (
    <div>
        <FeedbackBuilder />
    </div>
  )
}