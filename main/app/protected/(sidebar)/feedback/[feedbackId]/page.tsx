import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import EditFeedbackBuilder from './_components/edit-feedback-builder';
import { getAuthenticatedUser } from '@/utils/auth';

interface PageProps {
  params: {
    feedbackId: string
  }
}

export default async function FeedbackEditPage({ params }: PageProps) {
  const feedbackId =  params?.feedbackId;
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);


  return (
    <div>
      <EditFeedbackBuilder feedbackId={feedbackId} />
    </div>
  )
}