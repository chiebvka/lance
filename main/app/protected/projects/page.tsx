import { promises as fs } from "fs"
import path from "path"
import React from 'react'
import CreateProjectView from './_components/create-project-view'
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import ProjectForm from './_components/project-form';
import { z } from "zod"
import { RichTextEditor } from '@/components/tiptap/rich-text-editor';
import { TipTapEditor } from '@/components/tiptap/tip-tap-editor';
import { taskSchema } from "./data/schema";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import ProjectsClient from "./_components/projects-client";


// Simulate a database read for tasks.
async function getTasks() {
  const data = await fs.readFile(
    path.join(process.cwd(), "app/protected/projects/data/tasks.json")
  )

  const tasks = JSON.parse(data.toString())

  return z.array(taskSchema).parse(tasks)
}

export default async function ProjectsPage() {
  const tasks = await getTasks()

  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
      <ProjectsClient tasks={tasks} />
    </div>
  )
}


