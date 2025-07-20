import React from 'react'
import ProjectsClient from './_components/projects-client'
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }
  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
      <ProjectsClient />
    </div>
  )
}


