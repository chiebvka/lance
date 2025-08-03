import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getFeedbacks } from '@/lib/feedback';
import FeedbackClient from './_components/feedback-client';
import { Feedback } from './_components/columns';
import { getAuthenticatedUser } from '@/utils/auth';

type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);


  let initialFeedbacks: Feedback[] = []
  try {
    initialFeedbacks = await getFeedbacks(supabase, user.id)
  } catch {
    // return redirect('/error')
  }
  console.log(initialFeedbacks)
  return (
    <div  className='w-full py-4 px-6 border border-bexoni'>
      <FeedbackClient initialFeedbacks={initialFeedbacks} />
    </div>
  )
}