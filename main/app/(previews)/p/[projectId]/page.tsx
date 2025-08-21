import React from 'react'
import ProjectPreview from './_components/project-preview';
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { createClient } from '@/utils/supabase/server'

type PageProps = {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ token?: string }>
}

async function fetchProjectState(projectId: string, token?: string) {
  const supabase = await createClient()
  
  const { data: project, error } = await supabase
    .from('projects')
    .select('state, token, type')
    .eq('id', projectId)
    .single()

  if (error || !project) {
    return { state: 'not_found', hasValidToken: false, type: null }
  }

  const hasValidToken = project.token === token
  return { 
    state: project.state, 
    hasValidToken, 
    type: project.type,
    hasToken: !!project.token 
  }
}

export default async function page({ params, searchParams }: PageProps) {
  const { projectId } = await params;
  const { token } = await searchParams;

  const { state, hasValidToken, type, hasToken } = await fetchProjectState(projectId, token);

  // Check if project exists
  if (state === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Project Not Found</h1>
          <p className="text-gray-600">The requested project could not be found or may have been removed.</p>
        </div>
      </div>
    )
  }

  // Check if project is still in draft mode
  if (state === 'draft') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-yellow-500 to-orange-600">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">Still in Draft Mode</h1>
          <p className="text-gray-600">This project is still being prepared and is not ready for viewing yet.</p>
        </div>
      </div>
    )
  }

  // Check if project is published but missing token
  if (state === 'published' && !hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Missing Required Information</h1>
          <p className="text-gray-600">This project is missing required information to view. Please contact the project owner.</p>
        </div>
      </div>
    )
  }

  // For customer projects, check if valid token is provided
  if (type === 'customer' && (!token || !hasValidToken)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-purple-600 mb-4">Access Required</h1>
          <p className="text-gray-600">
            {!token ? 
              'A valid access token is required to view this project.' :
              'The provided access token is invalid or expired.'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='h-full w-full'>
      <ProjectPreview projectId={projectId} token={token || ''} />
    </div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Project Wall',
  description: 'A single wall with instructions, assets and approvals for your project.',
});