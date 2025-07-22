import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import FeedbackBuilder from './_components/feedback-builder';

type Props = {}

export default async function page({}: Props) {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect("/login");
    }
  return (
    <div>
        <FeedbackBuilder />
    </div>
  )
}