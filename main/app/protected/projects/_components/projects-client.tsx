'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import axios from 'axios'
import CreateSearchFilter from "@/components/general/create-search-filter"
import { Button } from "@/components/ui/button"
import { SheetClose, SheetHeader } from '@/components/ui/sheet'
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { ScrollArea } from '@/components/ui/scroll-area'
import { DataTable } from "./data-table"
import { columns, Project } from "./columns"
import ProjectForm from './project-form'
import EditProjectForm from './edit-project-form'
import { Bubbles } from "lucide-react"
import { FilterTag } from '@/components/filtering/search-filter'
import { 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"

export default function ProjectsClient() {
  const closeRef = useRef<HTMLButtonElement>(null);
  const editCloseRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTags, setFilterTags] = useState<FilterTag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [activeFilters, setActiveFilters] = useState<{
    status: string[];
    paymentType: string[];
    hasServiceAgreement: string[];
  }>({
    status: [],
    paymentType: [],
    hasServiceAgreement: []
  });

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const query = searchParams.get('query') || '';
    setSearchQuery(query);
    
    // Initialize filters from URL
    const statusParams = searchParams.getAll('status');
    const paymentTypeParams = searchParams.getAll('paymentType');
    const hasServiceAgreementParams = searchParams.getAll('hasServiceAgreement');
    
    setActiveFilters({
      status: statusParams,
      paymentType: paymentTypeParams,
      hasServiceAgreement: hasServiceAgreementParams
    });

    // Update filter tags based on URL params
    const tags: FilterTag[] = [];
    statusParams.forEach(value => {
      tags.push({
        key: `status-${value}`,
        label: 'Status',
        value: value.charAt(0).toUpperCase() + value.slice(1)
      });
    });
    paymentTypeParams.forEach(value => {
      tags.push({
        key: `paymentType-${value}`,
        label: 'Payment Type',
        value: value.charAt(0).toUpperCase() + value.slice(1)
      });
    });
    hasServiceAgreementParams.forEach(value => {
      tags.push({
        key: `hasServiceAgreement-${value}`,
        label: 'Service Agreement',
        value: value === 'true' ? 'Yes' : 'No'
      });
    });
    setFilterTags(tags);

    // Handle sheet opening for creating
    if (searchParams.get('createProject') === 'true') {
      // Trigger sheet open
    }
    
    // Handle project selection for editing
    const projectId = searchParams.get('projectId');
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [searchParams]);

  // Apply filters whenever activeFilters, projects, or searchQuery change
  useEffect(() => {
    applyFilters();
  }, [activeFilters, projects, searchQuery]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/projects');
      if (response.data.success) {
        setProjects(response.data.projects);
        setFilteredProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Apply search query - search in name, description, customer name, and type
    if (searchQuery) {
      filtered = filtered.filter(project => 
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (activeFilters.status.length > 0) {
      filtered = filtered.filter(project => 
        activeFilters.status.includes(project.status?.toLowerCase() || '')
      );
    }

    // Apply payment type filter
    if (activeFilters.paymentType.length > 0) {
      filtered = filtered.filter(project => 
        activeFilters.paymentType.includes(project.paymentType?.toLowerCase() || '')
      );
    }

    // Apply service agreement filter
    if (activeFilters.hasServiceAgreement.length > 0) {
      filtered = filtered.filter(project => {
        const hasAgreement = project.hasServiceAgreement ? 'true' : 'false';
        return activeFilters.hasServiceAgreement.includes(hasAgreement);
      });
    }

    setFilteredProjects(filtered);
  };

  const updateURL = (newFilters: typeof activeFilters, search?: string) => {
    const params = new URLSearchParams(searchParams);
    
    // Update search query
    if (search !== undefined) {
      if (search) {
        params.set('query', search);
      } else {
        params.delete('query');
      }
    }

    // Clear existing filter params
    params.delete('status');
    params.delete('paymentType');
    params.delete('hasServiceAgreement');

    // Add new filter params
    newFilters.status.forEach(value => params.append('status', value));
    newFilters.paymentType.forEach(value => params.append('paymentType', value));
    newFilters.hasServiceAgreement.forEach(value => params.append('hasServiceAgreement', value));

    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    updateURL(activeFilters, value);
  };

  const handleFilterChange = (filterType: 'status' | 'paymentType' | 'hasServiceAgreement', value: string, checked: boolean) => {
    const newFilters = { ...activeFilters };
    if (checked) {
      newFilters[filterType] = [...newFilters[filterType], value];
    } else {
      newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
    }
    
    setActiveFilters(newFilters);
    updateURL(newFilters);
    updateFilterTags(filterType, value, checked);
  };

  const updateFilterTags = (filterType: 'status' | 'paymentType' | 'hasServiceAgreement', value: string, checked: boolean) => {
    setFilterTags(prev => {
      const key = `${filterType}-${value}`;
      if (checked) {
        let label = filterType.charAt(0).toUpperCase() + filterType.slice(1);
        if (filterType === 'paymentType') label = 'Payment Type';
        if (filterType === 'hasServiceAgreement') label = 'Service Agreement';
        
        let displayValue = value.charAt(0).toUpperCase() + value.slice(1);
        if (filterType === 'hasServiceAgreement') {
          displayValue = value === 'true' ? 'Yes' : 'No';
        }
        
        return [...prev, { key, label, value: displayValue }];
      } else {
        return prev.filter(tag => tag.key !== key);
      }
    });
  };

  const handleRemoveFilter = (key: string) => {
    const [filterType, value] = key.split('-') as ['status' | 'paymentType' | 'hasServiceAgreement', string];
    handleFilterChange(filterType, value, false);
  };

  const handleClearAllFilters = () => {
    setActiveFilters({ status: [], paymentType: [], hasServiceAgreement: [] });
    setFilterTags([]);
    updateURL({ status: [], paymentType: [], hasServiceAgreement: [] });
  };

  const handleProjectSelect = (projectId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('projectId', projectId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreateSuccess = () => {
    closeRef.current?.click();
    // Remove createProject param
    const params = new URLSearchParams(searchParams);
    params.delete('createProject');
    router.replace(`${pathname}?${params.toString()}`);
    fetchProjects(); // Refresh projects list
  };

  const handleEditSuccess = () => {
    editCloseRef.current?.click();
    setSelectedProjectId(null);
    // Remove projectId param
    const params = new URLSearchParams(searchParams);
    params.delete('projectId');
    router.replace(`${pathname}?${params.toString()}`);
    fetchProjects(); // Refresh projects list
  };

  const handleCloseSheet = () => {
    router.push("/protected/projects");
    setSelectedProjectId(null);
  };

  const handleCreateCancel = () => {
    closeRef.current?.click();
    const params = new URLSearchParams(searchParams);
    params.delete('createProject');
    router.replace(`${pathname}?${params.toString()}`);
  }

  const filterContent = (
    <div className="p-2">
      <DropdownMenuLabel>Filter projects</DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      {/* Status Filter */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuCheckboxItem
            checked={activeFilters.status.includes('active')}
            onCheckedChange={(checked) => handleFilterChange('status', 'active', checked)}
          >
            Active
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.status.includes('completed')}
            onCheckedChange={(checked) => handleFilterChange('status', 'completed', checked)}
          >
            Completed
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.status.includes('on hold')}
            onCheckedChange={(checked) => handleFilterChange('status', 'on hold', checked)}
          >
            On Hold
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.status.includes('cancelled')}
            onCheckedChange={(checked) => handleFilterChange('status', 'cancelled', checked)}
          >
            Cancelled
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      
      <DropdownMenuSeparator />
      
      {/* Payment Type Filter */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Payment Type</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuCheckboxItem
            checked={activeFilters.paymentType.includes('milestone')}
            onCheckedChange={(checked) => handleFilterChange('paymentType', 'milestone', checked)}
          >
            Milestone
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.paymentType.includes('hourly')}
            onCheckedChange={(checked) => handleFilterChange('paymentType', 'hourly', checked)}
          >
            Hourly
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.paymentType.includes('fixed')}
            onCheckedChange={(checked) => handleFilterChange('paymentType', 'fixed', checked)}
          >
            Fixed
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />
      
      {/* Service Agreement Filter */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Service Agreement</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuCheckboxItem
            checked={activeFilters.hasServiceAgreement.includes('true')}
            onCheckedChange={(checked) => handleFilterChange('hasServiceAgreement', 'true', checked)}
          >
            Yes
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.hasServiceAgreement.includes('false')}
            onCheckedChange={(checked) => handleFilterChange('hasServiceAgreement', 'false', checked)}
          >
            No
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </div>
  );

  if (loading) {
    return <div className="p-8">Loading projects...</div>;
  }

  return (
    <>
      <CreateSearchFilter 
        placeholder="Search projects..." 
        onSearch={handleSearch}
        filterContent={filterContent}
        filterTags={filterTags}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        sheetTriggerText="Create Project"
        sheetTitle="New Project"
        sheetContent={<ProjectForm onSuccess={handleCreateSuccess} onLoadingChange={setIsSubmitting} onCancel={handleCreateCancel} />}
        sheetContentClassName='w-full sm:w-3/4 md:w-1/2 lg:w-[40%]'
        closeRef={closeRef}
      />

      {/* Edit Project Sheet */}
      <Sheet open={!!selectedProjectId} onOpenChange={open => { if (!open) handleCloseSheet(); }}>
        <SheetContent 
          side="right" 
          bounce="right" 
          withGap={true} 
          className="w-full flex flex-col p-0 sm:w-3/4 md:w-1/2 lg:w-[40%]"
        >
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Edit Sheet</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            <div className="p-4">
              {selectedProjectId && <EditProjectForm projectId={selectedProjectId} onSuccess={handleEditSuccess} onLoadingChange={setIsEditSubmitting} onCancel={handleCloseSheet} />}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="mt-6">
        <ProjectTableHeader filteredProjects={filteredProjects} onProjectSelect={handleProjectSelect} />
      </div>
    </>
  )
}

// Component for the table header with column visibility
function ProjectTableHeader({ filteredProjects, onProjectSelect }: { filteredProjects: Project[], onProjectSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of your projects!
          </p>
        </div>
        <div id="column-visibility-placeholder"></div>
      </div>
      <DataTable 
        data={filteredProjects} 
        columns={columns} 
        showToolbar={false}
        onProjectSelect={onProjectSelect}
      />
    </div>
  )
} 