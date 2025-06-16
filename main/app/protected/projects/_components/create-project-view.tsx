'use client'
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

type Props = {
    onSearch: (value: string) => void;
}

export default function CreateProjectView({ onSearch }: Props) {
  return (
    <div className='w-full'>
        <PageHeader 
            placeholder="Search projects..." 
            onSearch={onSearch} 
            action={
                <Button asChild>
                    <Link href="/protected/projects/create">
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Create Project</span>
                    </Link>
                </Button>
            }
        />
    </div>
  )
}