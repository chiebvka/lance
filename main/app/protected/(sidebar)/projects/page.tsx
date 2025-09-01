import React from 'react'
import ProjectsClient from './_components/projects-client'
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getProjectsWithDetails } from '@/lib/project';
import { getAuthenticatedUser } from '@/utils/auth';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  let initialProjects = []
  try {
    initialProjects = await getProjectsWithDetails(supabase, user.id)
  } catch {
    return redirect('/error')
  }

  return (
    <div className='w-full py-4 px-6'>
      <ProjectsClient initialProjects={initialProjects} />
    </div>
  )
}


