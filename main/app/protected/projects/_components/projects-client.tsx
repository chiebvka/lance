'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import axios from 'axios'
import { format, parseISO, isWithinInterval, isSameDay } from "date-fns"
import { type DateRange } from "react-day-picker"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DataTableViewOptions } from './data-table-view-options'
import { DataTablePagination } from './data-table-pagination'
import { Calendar } from '@/components/ui/calendar'

const fetchProjects = async (): Promise<Project[]> => {
  const response = await axios.get('/api/projects');
  if (response.data.success) {
    return response.data.projects;
  }
  throw new Error(response.data.message || 'Error fetching projects');
};

const paymentTypeOptions = [
  { value: 'milestonePayment', label: 'Milestone' },
  { value: 'deliverablePayment', label: 'Deliverable' },
  { value: 'fullDownPayment', label: 'Full Payment Upfront' },
  { value: 'paymentOnCompletion', label: 'Payment on Completion' },
  { value: 'noPaymentRequired', label: 'No Payment' }
];

export default function ProjectsClient() {
  const queryClient = useQueryClient();
  const closeRef = useRef<HTMLButtonElement>(null);
  const editCloseRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [filterTags, setFilterTags] = useState<FilterTag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [activeFilters, setActiveFilters] = useState<{
    state: string[];
    paymentType: string[];
    hasServiceAgreement: string[];
    type: string[];
    date?: DateRange;
  }>({
    state: [],
    paymentType: [],
    hasServiceAgreement: [],
    type: [],
    date: undefined,
  });

  const { 
    data: projects = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects
  });

  // Initialize from URL params
  useEffect(() => {
    const query = searchParams.get('query') || '';
    setSearchQuery(query);
    
    // Initialize filters from URL
    const stateParams = searchParams.getAll('state');
    const paymentTypeParams = searchParams.getAll('paymentType');
    const hasServiceAgreementParams = searchParams.getAll('hasServiceAgreement');
    const typeParams = searchParams.getAll('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    let dateRange: DateRange | undefined = undefined;
    if (dateFrom) {
      dateRange = { from: parseISO(dateFrom) };
      if (dateTo) {
        dateRange.to = parseISO(dateTo);
      }
    }
    
    setActiveFilters({
      state: stateParams,
      paymentType: paymentTypeParams,
      hasServiceAgreement: hasServiceAgreementParams,
      type: typeParams,
      date: dateRange,
    });

    // Update filter tags based on URL params
    const tags: FilterTag[] = [];
    if (dateRange?.from) {
      let dateLabel = format(dateRange.from, "PPP");
      if (dateRange.to) {
        dateLabel = `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`;
      }
      tags.push({ key: 'date-range', label: 'Date', value: dateLabel });
    }
    stateParams.forEach(value => {
      tags.push({
        key: `state-${value}`,
        label: 'State',
        value: value.charAt(0).toUpperCase() + value.slice(1)
      });
    });
    typeParams.forEach(value => {
      tags.push({
        key: `type-${value}`,
        label: 'Type',
        value: value.charAt(0).toUpperCase() + value.slice(1)
      });
    });
    paymentTypeParams.forEach(value => {
      tags.push({
        key: `paymentType-${value}`,
        label: 'Payment Type',
        value: paymentTypeOptions.find(p => p.value === value)?.label || value
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

  const filteredProjects = useMemo(() => {
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

    // Apply date filter
    if (activeFilters.date?.from) {
      filtered = filtered.filter(project => {
        if (!project.created_at || !activeFilters.date?.from) return false;
        const projectDate = new Date(project.created_at);
        if (isNaN(projectDate.getTime())) return false; // Invalid date

        if (activeFilters.date.to) {
          // Range selected
          return isWithinInterval(projectDate, { start: activeFilters.date.from, end: activeFilters.date.to });
        }
        // Single date selected
        return isSameDay(projectDate, activeFilters.date.from);
      });
    }

    // Apply state filter
    if (activeFilters.state.length > 0) {
      filtered = filtered.filter(project => 
        activeFilters.state.includes(project.state?.trim().toLowerCase() || '')
      );
    }

    // Apply type filter
    if (activeFilters.type.length > 0) {
      filtered = filtered.filter(project =>
        activeFilters.type.includes(project.type?.toLowerCase() || '')
      );
    }

    // Apply payment type filter
    if (activeFilters.paymentType.length > 0) {
      filtered = filtered.filter(project => 
        activeFilters.paymentType.includes(project.paymentType || '')
      );
    }

    // Apply service agreement filter
    if (activeFilters.hasServiceAgreement.length > 0) {
      filtered = filtered.filter(project => {
        const hasAgreement = project.hasServiceAgreement ? 'true' : 'false';
        return activeFilters.hasServiceAgreement.includes(hasAgreement);
      });
    }

    return filtered;
  }, [projects, searchQuery, activeFilters]);

  // --- Table State ---
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({
      description: false,
      customerName: false,
      endDate: false,
    })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: filteredProjects,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

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
    params.delete('state');
    params.delete('type');
    params.delete('paymentType');
    params.delete('hasServiceAgreement');
    params.delete('dateFrom');
    params.delete('dateTo');

    // Add new filter params
    if (newFilters.date?.from) {
      params.append('dateFrom', newFilters.date.from.toISOString());
      if (newFilters.date.to) {
        params.append('dateTo', newFilters.date.to.toISOString());
      }
    }
    newFilters.state.forEach(value => params.append('state', value));
    newFilters.type.forEach(value => params.append('type', value));
    newFilters.paymentType.forEach(value => params.append('paymentType', value));
    newFilters.hasServiceAgreement.forEach(value => params.append('hasServiceAgreement', value));

    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    updateURL(activeFilters, value);
  };

  const handleDateChange = (date: DateRange | undefined) => {
    const newFilters = { ...activeFilters, date };
    setActiveFilters(newFilters);
    updateURL(newFilters);
    updateFilterTags('date', date, !!date);
  }

  const handleFilterChange = (filterType: 'state' | 'paymentType' | 'hasServiceAgreement' | 'type', value: string, checked: boolean) => {
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

  const updateFilterTags = (filterType: 'state' | 'paymentType' | 'hasServiceAgreement' | 'type' | 'date', value: string | DateRange | undefined, checked: boolean) => {
    setFilterTags(prev => {
      if (filterType === 'date') {
        const existingTagIndex = prev.findIndex(tag => tag.key === 'date-range');
        if (checked && value && typeof value !== 'string') {
          const date = value as DateRange;
          let dateLabel = format(date.from!, "PPP");
          if (date.to) {
            dateLabel = `${format(date.from!, "PPP")} - ${format(date.to, "PPP")}`;
          }
          const newTag = { key: 'date-range', label: 'Date', value: dateLabel, className: 'w-auto' };
          if (existingTagIndex > -1) {
            const newTags = [...prev];
            newTags[existingTagIndex] = newTag;
            return newTags;
          }
          return [...prev, newTag];
        }
        return prev.filter(tag => tag.key !== 'date-range');
      }
      
      const key = `${filterType}-${value}`;
      if (checked && typeof value === 'string') {
        let label = '';
        if (filterType === 'state') label = 'State';
        if (filterType === 'type') label = 'Type';
        if (filterType === 'paymentType') label = 'Payment Type';
        if (filterType === 'hasServiceAgreement') label = 'Service Agreement';
        
        let displayValue = '';
        if (filterType === 'paymentType') {
          displayValue = paymentTypeOptions.find(p => p.value === value)?.label || value as string;
        } else if (filterType === 'hasServiceAgreement') {
          displayValue = value === 'true' ? 'Yes' : 'No';
        } else {
          displayValue = value.charAt(0).toUpperCase() + value.slice(1);
        }
        
        return [...prev, { key, label, value: displayValue }];
      } else {
        return prev.filter(tag => tag.key !== key);
      }
    });
  };

  const handleRemoveFilter = (key: string) => {
    if (key === 'date-range') {
      handleDateChange(undefined);
      return;
    }
    const [filterType, value] = key.split('-') as ['state' | 'paymentType' | 'hasServiceAgreement' | 'type', string];
    handleFilterChange(filterType, value, false);
  };

  const handleClearAllFilters = () => {
    setActiveFilters({ state: [], paymentType: [], hasServiceAgreement: [], type: [], date: undefined });
    setFilterTags([]);
    updateURL({ state: [], paymentType: [], hasServiceAgreement: [], type: [], date: undefined });
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
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const handleEditSuccess = () => {
    editCloseRef.current?.click();
    setSelectedProjectId(null);
    // Remove projectId param
    const params = new URLSearchParams(searchParams);
    params.delete('projectId');
    router.replace(`${pathname}?${params.toString()}`);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
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
      
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Date</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="p-0">
          <Calendar
            initialFocus
            mode="range"
            captionLayout="dropdown"
            defaultMonth={activeFilters.date?.from}
            selected={activeFilters.date}
            onSelect={handleDateChange}
            numberOfMonths={1}
            fromYear={2015}
            toYear={2045}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />
      
      {/* State Filter */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>State</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuCheckboxItem
            checked={activeFilters.state.includes('draft')}
            onCheckedChange={(checked) => handleFilterChange('state', 'draft', checked)}
          >
            Draft
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.state.includes('published')}
            onCheckedChange={(checked) => handleFilterChange('state', 'published', checked)}
          >
            Published
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      {/* Type Filter */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Type</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuCheckboxItem
            checked={activeFilters.type.includes('personal')}
            onCheckedChange={(checked) => handleFilterChange('type', 'personal', checked)}
          >
            Personal
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.type.includes('customer')}
            onCheckedChange={(checked) => handleFilterChange('type', 'customer', checked)}
          >
            Customer
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      
      <DropdownMenuSeparator />
      
      {/* Payment Type Filter */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Payment Type</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {paymentTypeOptions.map(option => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={activeFilters.paymentType.includes(option.value)}
              onCheckedChange={(checked) => handleFilterChange('paymentType', option.value, checked)}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
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

  if (isLoading) {
    return <div className="p-8">Loading projects...</div>;
  }

  if (isError) {
    return <div className="p-8">Error fetching projects: {(error as Error).message}</div>;
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

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of your projects!
            </p>
          </div>
          <DataTableViewOptions table={table} />
        </div>
        <DataTable table={table} onProjectSelect={handleProjectSelect} />
        <DataTablePagination table={table} />
      </div>
    </>
  )
} 