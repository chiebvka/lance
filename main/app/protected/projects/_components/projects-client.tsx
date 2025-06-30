'use client'

import React from 'react'
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { DataTable } from "./data-table";
import { columns } from "./columns";

interface ProjectsClientProps {
  tasks: any[] // Replace with proper type from your schema
}

export default function ProjectsClient({ tasks }: ProjectsClientProps) {
  const handleSearch = (value: string) => {
    // TODO: Implement project search logic
    console.log('Searching for project:', value);
  }

  return (
    <>
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

      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of your tasks for this month!
            </p>
          </div>
        </div>
        <DataTable data={tasks} columns={columns} />
      </div>
    </>
  )
} 