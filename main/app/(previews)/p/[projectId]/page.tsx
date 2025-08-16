import React from 'react'
import ProjectPreview from './_components/project-preview';
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'

type PageProps = {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function page({ params, searchParams }: PageProps) {
  const { projectId } = await params;
  const { token } = await searchParams;

  // const state = await fetchProjectState(projectId, token);

  // if (state === "draft") {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-purple-700">
  //       <div className="text-center p-8 bg-white rounded-lg shadow-lg">
  //         <h1 className="text-2xl font-bold text-yellow-600 mb-4">Preview Mode</h1>
  //         <p className="text-gray-600">This form is in preview mode and cannot be filled out yet.</p>
  //       </div>
  //     </div>
  //   )
  // }

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