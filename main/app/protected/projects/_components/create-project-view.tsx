import PageHeaderWrapper from '@/components/page-header-wrapper'
import React from 'react'
import ProjectForm from './project-form'

type Props = {}

export default function CreateProjectView({}: Props) {
  return (
    <div>
        <PageHeaderWrapper 
      placeholder="Search projects" 
      buttonText=" New Project" 
      formComponent={<ProjectForm  />} 
      sheetTitle="New Project" 
      sheetContentClassName="w-full sm:w-3/4 md:w-1/2 lg:w-[40%]"
    />
    </div>
  )
}