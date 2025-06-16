'use client'
import React from 'react'
import CreateProjectView from './_components/create-project-view'
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import ProjectForm from './_components/project-form';

export default function ProjectsPage() {
  const handleSearch = (value: string) => {
    // TODO: Implement project search logic
    console.log('Searching for project:', value);
  }

  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
        <PageHeader 
            placeholder="Search projects..." 
            onSearch={handleSearch} 
            action={
                <Button asChild>
                    <Link href="/protected/projects/create">
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Create Project</span>
                    </Link>
                </Button>
            }
        />

        {/* <CreateProjectView onSearch={handleSearch} /> */}
    </div>
  )
}


