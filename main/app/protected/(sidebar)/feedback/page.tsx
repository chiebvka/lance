import React, { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getOrganizationFeedback } from '@/lib/feedback';
import FeedbackClient from './_components/feedback-client';
import { getAuthenticatedUser } from '@/utils/auth';
import { Feedbacks } from '@/hooks/feedbacks/use-feedbacks';

type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);


  let initialFeedbacks: Feedbacks[] = []
  try {
    // Fetch org-scoped feedbacks similar to walls/receipts pages
    initialFeedbacks = await getOrganizationFeedback(supabase)
  } catch {
    // return redirect('/error')
  }
  // console.log(initialFeedbacks)
  return (
    <div  className='w-full py-4 px-6 border border-bexoni'>
      <Suspense fallback={<div>Loading feedbacks...</div>}>
        <FeedbackClient initialFeedbacks={initialFeedbacks}   />
      </Suspense>
    </div>
  )
}