import PageTitles from '@/components/page-titles'
import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import EditProjectForm from './_components/edit-project-form'
import { Tables } from '@/types/supabase'

type Props = {
    params: { projectId: string }
}

export default async function page({ params }: Props) {
    const supabase = await createClient()
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params?.projectId)
        .single()

    if (error || !project) {
        notFound()
    }

    return (
        <div className='w-full py-4 px-6 border border-bexoni'>
            <PageTitles 
                title={project.name || 'Edit Project'} 
                description={project.description || 'Update your project details'} 
                tips={{ 
                    title: 'Project Editing Tips', 
                    items: [
                        'Keep project details up-to-date to ensure clarity for your team and client.',
                        'Regularly review deliverables and timelines.',
                        'Document any changes to the scope or budget.'
                    ] 
                }} 
            />
            <EditProjectForm project={project as unknown as Tables<'projects'>} />
        </div>
    )
}