import PageTitles from '@/components/page-titles'
import React from 'react'
import ProjectForm from '../_components/project-form'

type Props = {}

export default function page({}: Props) {
  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
        <PageTitles title='Create Project' description='Create a new project' tips={{ title: 'Project Creation Tips', items: ['Use descriptive names that clearly identify the project purpose', 'Add team members early to establish collaboration from the start', 'Set realistic deadlines and milestones for better project tracking'] }} />
        <ProjectForm />
    </div>
  )
}