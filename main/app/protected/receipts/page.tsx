import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react'

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
    <div>page</div>
  )
}