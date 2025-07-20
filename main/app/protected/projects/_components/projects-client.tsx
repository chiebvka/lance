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
import { Sheet, SheetContent,SheetClose, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { ScrollArea } from '@/components/ui/scroll-area'
import { DataTable } from "./data-table"
import { columns, Project } from "./columns"
import ProjectForm from './project-form'
import EditProjectForm from './edit-project-form'
import { Bubbles, Trash2, Save, ChevronDown } from "lucide-react"
import { FilterTag } from '@/components/filtering/search-filter'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DataTableViewOptions } from './data-table-view-options'
import { Calendar } from '@/components/ui/calendar'
import Pagination from '../../../../components/pagination';
import { getTableColumns, setTableColumns, getTableColumnsWithDefaults } from '@/cookie-persist/tableColumns';
import ConfirmModal from '@/components/modal/confirm-modal'
import { toast } from 'sonner'
import { z } from 'zod'
import { projectCreateSchema } from '@/validation/projects'
import deliverableSchema from '@/validation/deliverables'
import paymentTermSchema from '@/validation/payment'

const fetchProjects = async (): Promise<Project[]> => {
  const response = await axios.get('/api/projects');
  if (response.data.success) {
    return response.data.projects;
  }
  throw new Error(response.data.message || 'Error fetching projects');
};


type ProjectFormValues = z.infer<typeof projectCreateSchema>
type DeliverableFormValues = z.infer<typeof deliverableSchema>
type PaymentTermFormValues = z.infer<typeof paymentTermSchema>

// Payload-specific interfaces
interface PayloadPaymentMilestone {
  id?: string
  name: string | null
  percentage: number | null
  amount: number | null
  dueDate: string
  description?: string | null
  status?: string | null
  type?: "milestone" | "deliverable" | null
}

interface PayloadDeliverable {
  id: string
  name: string
  description: string
  dueDate: string
  position: number
  isPublished: boolean
  status: "pending" | "in_progress" | "completed"
}

interface ProjectData {
  id?: string
  customerId?: string | null
  currency?: string
  currencyEnabled?: boolean
  projectType?: "personal" | "customer"
  budget?: number
  projectName?: string
  projectDescription?: string
  startDate?: string
  endDate?: string
  deliverables?: PayloadDeliverable[]
  deliverablesEnabled?: boolean
  paymentStructure?: string
  paymentMilestones?: PayloadPaymentMilestone[]
  hasServiceAgreement?: boolean
  serviceAgreement?: string
  agreementTemplate?: string
  hasAgreedToTerms?: boolean
  isPublished?: boolean
  state?: "draft" | "published"
  emailToCustomer?: boolean
}

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
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false)
  
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
    
    // Sync selected project with URL projectId, which controls the sheet
    const projectId = searchParams.get('projectId');
    setSelectedProjectId(projectId);
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

  const projectBeingEdited = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId)
  }, [projects, selectedProjectId])

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return axios.delete(`/api/projects/${projectId}`);
    },
    onSuccess: () => {
      toast.success("Project deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.delete('projectId');
      const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
      router.replace(newUrl);
    },
    onError: (error: any) => {
      console.error("Delete project error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to delete project";
      toast.error(errorMessage);
    },
  });

  // --- Table State ---
  const [rowSelection, setRowSelection] = useState({})
  // Load initial column visibility from cookie with proper defaults
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window !== 'undefined') {
      const visibleColumns = getTableColumnsWithDefaults('projects');
      
      // Create visibility state: default columns visible, others hidden
      const state: VisibilityState = {};
      
      // All available columns (excluding select and actions which are always visible)
      const allColumns = ['name', 'description', 'type', 'customerName', 'budget', 'hasServiceAgreement', 'state', 'status', 'paymentType', 'endDate'];
      
      // Set visibility based on saved/default columns
      for (const col of allColumns) {
        state[col] = visibleColumns.includes(col);
      }
      
      return state;
    }
    // Fallback for SSR
    return {};
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Persist column visibility to cookie on change
  useEffect(() => {
    // Only store columns that are visible
    const visibleCols = Object.entries(columnVisibility)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    setTableColumns('projects', visibleCols);
  }, [columnVisibility]);

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

  // Add these new handlers for project form actions
  const [isSaving, setIsSaving] = useState(false);
  const [projectFormValid, setProjectFormValid] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [projectType, setProjectType] = useState<string>('customer');

  // Update the event handlers to be more robust
  const handleSaveDraft = () => {
    const formElement = document.getElementById('edit-project-form') || document.getElementById('project-form');
    if (formElement) {
      // Create a custom event with more specific details
      const event = new CustomEvent('submit-draft', { 
        bubbles: true, 
        cancelable: true,
        detail: { action: 'save-draft' }
      });
      formElement.dispatchEvent(event);
    }
  };

  const handlePublishProject = (emailToCustomer = false) => {
    const formElement = document.getElementById('edit-project-form') || document.getElementById('project-form');
    if (formElement) {
      const eventName = emailToCustomer ? 'submit-publish-email' : 'submit-publish';
      const event = new CustomEvent(eventName, { 
        bubbles: true, 
        cancelable: true,
        detail: { action: eventName, emailToCustomer }
      });
      formElement.dispatchEvent(event);
    }
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

  const handleDeleteFromSheet = () => {
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedProjectId) {
      deleteProjectMutation.mutate(selectedProjectId)
    }
    setDeleteModalOpen(false)
  }

  const footer = (
    <>
      <SheetClose asChild>
        <Button variant="ghost" ref={closeRef}>Cancel</Button>
      </SheetClose>
      <Button variant="outlinebrimary" onClick={handleSaveDraft} disabled={isSaving} className="px-3 sm:px-4">
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? "Saving..." : "Save Draft"}
      </Button>

      <div className="inline-flex rounded-md shadow-sm">
        <Button
          onClick={() => handlePublishProject(false)}
          disabled={!projectFormValid || isSaving}
          className="rounded-r-none px-3 sm:px-4"
        >
          {isSaving ? "Publishing..." : "Publish Project"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={!projectFormValid || isSaving}
              className="rounded-l-none border-l border-purple-700 px-3"
            >
              <span className="sr-only">Open options</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handlePublishProject(false)}>Publish Project</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handlePublishProject(true)}
              disabled={projectType !== "customer" || !selectedCustomer}
            >
              Publish & Email to Customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  const editFooter = (
    <>
      <SheetClose asChild>
        <Button variant="ghost" onClick={handleCloseSheet}>Cancel</Button>
      </SheetClose>
      <Button variant="outlinebrimary" onClick={handleSaveDraft} disabled={isSaving} className="px-3 sm:px-4">
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? "Saving..." : "Save Draft"}
      </Button>

      <div className="inline-flex rounded-md shadow-sm">
        <Button
          onClick={() => handlePublishProject(false)}
          disabled={!projectFormValid || isSaving}
          className="rounded-r-none px-3 sm:px-4"
        >
          {isSaving ? "Publishing..." : "Update Project"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={!projectFormValid || isSaving}
              className="rounded-l-none border-l border-purple-700 px-3"
            >
              <span className="sr-only">Open options</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handlePublishProject(false)}>Update Project</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handlePublishProject(true)}
              disabled={projectType !== "customer" || !selectedCustomer}
            >
              Update & Email to Customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

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
            onCheckedChange={(checked: boolean) => handleFilterChange('state', 'draft', checked)}
          >
            Draft
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.state.includes('published')}
            onCheckedChange={(checked: boolean) => handleFilterChange('state', 'published', checked)}
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
            onCheckedChange={(checked: boolean) => handleFilterChange('type', 'personal', checked)}
          >
            Personal
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.type.includes('customer')}
            onCheckedChange={(checked: boolean) => handleFilterChange('type', 'customer', checked)}
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
              onCheckedChange={(checked: boolean) => handleFilterChange('paymentType', option.value, checked)}
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
            onCheckedChange={(checked: boolean) => handleFilterChange('hasServiceAgreement', 'true', checked)}
          >
            Yes
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.hasServiceAgreement.includes('false')}
            onCheckedChange={(checked: boolean) => handleFilterChange('hasServiceAgreement', 'false', checked)}
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
        sheetContent={
          <ProjectForm 
            onSuccess={handleCreateSuccess} 
            onLoadingChange={setIsSubmitting}
            onCancel={handleCreateCancel}
            onFormValidChange={setProjectFormValid}
            onCustomerChange={setSelectedCustomer}
            onProjectTypeChange={setProjectType}
            onSavingChange={setIsSaving}
          />
        }
        sheetContentClassName='w-full sm:w-3/4 md:w-1/2 lg:w-[40%]'
        footer={footer}
        closeRef={closeRef}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={projectBeingEdited?.name || "this project"}
        itemType="Project"
        isLoading={deleteProjectMutation.isPending}
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
            <div className="flex justify-between items-center">
              <SheetTitle>Edit Project</SheetTitle>
              {selectedProjectId && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteFromSheet}
                  disabled={deleteProjectMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </Button>
              )}
            </div>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            <div className="p-4">
              {selectedProjectId && (
                <EditProjectForm 
                  projectId={selectedProjectId} 
                  onSuccess={handleEditSuccess} 
                  onLoadingChange={setIsSubmitting} 
                  onCancel={handleCloseSheet}
                  onFormValidChange={setProjectFormValid}
                  onCustomerChange={setSelectedCustomer}
                  onProjectTypeChange={setProjectType}
                  onSavingChange={setIsSaving}
                />
              )}
            </div>
          </ScrollArea>
          <SheetFooter className="p-4 border-t">
            {editFooter}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
   
          <DataTableViewOptions table={table} />
        </div>
        <DataTable 
          table={table} 
          onProjectSelect={handleProjectSelect} 
          searchQuery={searchQuery}
        />
        <Pagination
          currentPage={table.getState().pagination.pageIndex + 1}
          totalPages={table.getPageCount()}
          pageSize={table.getState().pagination.pageSize}
          totalItems={table.getFilteredRowModel().rows.length}
          onPageChange={page => table.setPageIndex(page - 1)}
          onPageSizeChange={size => table.setPageSize(size)}
          itemName="projects"
        />
      </div>
    </>
  )
} 