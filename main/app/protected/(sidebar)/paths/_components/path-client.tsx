"use client"

import React, { useMemo, useRef, useState, useEffect, Suspense }  from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
} from "@tanstack/react-table";
import CreateSearchFilter, { DropdownOption } from "@/components/general/create-search-filter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent,SheetClose, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { columns } from "./columns";
import { Bubbles, Trash2, Save, ChevronDown, LayoutTemplate, HardDriveDownload, Scroll } from "lucide-react";
import { FilterTag } from '@/components/filtering/search-filter';
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
  } from "@/components/ui/dropdown-menu";
import { DataTableViewOptions } from  './data-table-view-options'
import { Calendar } from '@/components/ui/calendar'
import { getTableColumns, setTableColumns, getTableColumnsWithDefaults, getDefaultColumns } from '@/cookie-persist/tableColumns';
import ConfirmModal from '@/components/modal/confirm-modal';
import { parseAsArrayOf, parseAsIsoDateTime, parseAsString, useQueryStates } from 'nuqs'; 
import Pagination from '@/components/pagination';
import {usePaths, Path } from "@/hooks/paths/use-paths"
import { toast } from 'sonner';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import PathDetailsSheet from './path-details-sheet';
import { DataTable } from './data-table';
import ProjectClientSkeleton from '../../projects/_components/project-client-skeleton';
import WallDetailsSheet from '../../walls/_components/wall-details-sheet';


interface Props {
    initialPaths: Path[]
    userEmail: string | null
  }

export default function PathClient({ initialPaths, userEmail }: Props) {

    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const closeRef = useRef<HTMLButtonElement>(null);
    const editCloseRef = useRef<HTMLButtonElement>(null);
    const [filterTags, setFilterTags] = useState<FilterTag[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false)
  
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isCreatingWall, setIsCreatingWall] = useState(false);
  


      // nuqs for URL params (replaces useSearchParams, big useEffect, updateURL)
  const [params, setParams] = useQueryStates({
    query: parseAsString.withDefault(''),
    pathId: parseAsString.withOptions({ clearOnDefault: true }), // null to remove
    state: parseAsArrayOf(parseAsString).withDefault([]),
    type: parseAsArrayOf(parseAsString).withDefault([]),

    created_atFrom: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    created_atTo: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    updatedAtFrom: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    updatedAtTo: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
  }, { history: 'push' }); // Push to URL on change

    // Derive activeFilters from params
    const activeFilters = useMemo(() => ({
        state: params.state,
        type: params.type,
        created_at: params.created_atFrom ? { from: params.created_atFrom, to: params.created_atTo ?? undefined } : undefined,
        updatedAt: params.updatedAtFrom ? { from: params.updatedAtFrom, to: params.updatedAtTo ?? undefined } : undefined,
    }), [params]);

    // Build filterTags from activeFilters
    const filterTagsMemo = useMemo<FilterTag[]>(() => {
        const tags: FilterTag[] = [];

        if (activeFilters.created_at?.from) {
            let label = format(activeFilters.created_at.from, 'PPP');
            if (activeFilters.created_at.to) {
            label = `${format(activeFilters.created_at.from, 'PPP')} - ${format(activeFilters.created_at.to, 'PPP')}`;
            }
            tags.push({ key: 'created-at-range', label: 'Created At', value: label });
        }

        if (activeFilters.updatedAt?.from) {
            let label = format(activeFilters.updatedAt.from, 'PPP');
            if (activeFilters.updatedAt.to) {
            label = `${format(activeFilters.updatedAt.from, 'PPP')} - ${format(activeFilters.updatedAt.to, 'PPP')}`;
            }
            tags.push({ key: 'updated-at-range', label: 'Updated At', value: label });
        }



        activeFilters.state.forEach(value => {
        tags.push({ 
            key: `state-${value}`, 
            label: 'State', 
            value: value.charAt(0).toUpperCase() + value.slice(1) 
        });
        });
        activeFilters?.type?.forEach((value: string) => {
        tags.push({
            key: `type-${value}`,
            label: 'Type',
            value: value.charAt(0).toUpperCase() + value.slice(1),
        })
        })

        return tags;
    }, [activeFilters]);

    const { 
        data: paths = [], 
        isLoading, 
        isError, 
        error 
    } = usePaths(initialPaths);

    // Check if we have any active search or filters
    const hasActiveSearchOrFilters = useMemo(() => {
      return params.query || 
             activeFilters.state.length > 0 || 
             activeFilters.type.length > 0 ||
             activeFilters.created_at ||
             activeFilters.updatedAt;
    }, [params.query, activeFilters]);

    // Check if we should show empty state vs no results
    const shouldShowEmptyState = useMemo(() => {
      return paths.length === 0 && !hasActiveSearchOrFilters;
    }, [paths.length, hasActiveSearchOrFilters]);

    // --- Table State ---
    const [rowSelection, setRowSelection] = useState({})

    // Fix hydration issue: Initialize with server-safe default state
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
        const defaultColumns = getDefaultColumns('paths');
        const allColumns = ['name', 'description', 'state', 'created_at', 'private'];
        
        const state: VisibilityState = {};
        for (const col of allColumns) {
        state[col] = defaultColumns.includes(col);
        }
        
        return state;
    });

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([])
  
    // Load saved column visibility (client-only)
    useEffect(() => {
      const savedColumns = getTableColumnsWithDefaults('paths');
      const allColumns = ['name', 'description', 'state', 'created_at', 'private'];
      
      const newState: VisibilityState = {};
      for (const col of allColumns) {
        newState[col] = savedColumns.includes(col);
      }
      
      setColumnVisibility(newState);
    }, []);

    // Persist column visibility to cookie on change
    useEffect(() => {
        const visibleCols = Object.entries(columnVisibility)
        .filter(([_, v]) => v)
        .map(([k]) => k);
        setTableColumns('paths', visibleCols);
    }, [columnVisibility]);


  const filteredPaths = useMemo(() => {
    let filtered = [...paths];

    // Apply search query
    if (params.query) {
      filtered = filtered.filter(path => 
        path.name?.toLowerCase().includes(params.query.toLowerCase()) ||
        path.recepientName?.toLowerCase().includes(params.query.toLowerCase()) ||
        path.recepientEmail?.toLowerCase().includes(params.query.toLowerCase()) 
      );
    }

    // Apply issue date filter
    if (activeFilters.created_at?.from) {
      filtered = filtered.filter(path => {
      if (!path.created_at) return false;
      const rDate = new Date(path.created_at);
      if (isNaN(rDate.getTime())) return false;
      
      if (activeFilters?.created_at?.to) {
      return isWithinInterval(rDate, { start: activeFilters?.created_at?.from!, end: activeFilters?.created_at?.to! });
      }
      return isSameDay(rDate, activeFilters?.created_at?.from!);
      });
    }
    // Apply updatedAt date filter
    if (activeFilters.updatedAt?.from) {
      filtered = filtered.filter(path => {
      if (!path.updatedAt) return false;
      const rDate = new Date(path.updatedAt);
      if (isNaN(rDate.getTime())) return false;
      
      if (activeFilters?.updatedAt?.to) {
      return isWithinInterval(rDate, { start: activeFilters?.updatedAt?.from!, end: activeFilters?.updatedAt?.to! });
      }
      return isSameDay(rDate, activeFilters?.updatedAt?.from!);
      });
    }


    // Apply state filter
    if (activeFilters.state.length > 0) {
      filtered = filtered.filter(path => 
        activeFilters.state.includes(path.state?.trim().toLowerCase() || '')
      );
    }
    
    // Apply creation method filter
    if (activeFilters.type.length > 0) {
      filtered = filtered.filter(path =>
        activeFilters.type.includes(path.type?.trim().toLowerCase() || '')
      );
    }
    return filtered;
  }, [paths, params.query, activeFilters]);

  const pathBeingEdited = useMemo(() => {
    return paths.find(i => i.id === params.pathId)
  }, [paths, params.pathId])

  const deletePathMutation = useMutation({
    mutationFn: async (pathId: string) => {
      return axios.delete(`/api/paths/${pathId}`);
    },
    onSuccess: () => {
      toast.success("Path deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['paths'] });
    },
  });

  const table = useReactTable({
    data: filteredPaths,
    columns: columns as any,
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
  });

  const selectedPaths = useMemo(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selected = selectedRows.map(row => row.original);
    return selected as Path[];
  }, [table, rowSelection]);


  const handleSearch = (value: string) => {
    setParams({ query: value || null });
  };

  const handleCreatedAtChange = (date: DateRange | undefined) => {
    setParams({
      created_atFrom: date?.from ? date.from : null,
      created_atTo: date?.to ? date.to : null,
    });
  };

  const handleUpdatedAtChange = (date: DateRange | undefined) => {
    setParams({
      updatedAtFrom: date?.from ? date.from : null,
      updatedAtTo: date?.to ? date.to : null,
    });
  };

  const handleFilterChange = (filterType: 'state' | 'type', value: string, checked: boolean) => {
    setParams((prev) => {
      let newArr = [...(prev[filterType] || [])];
      if (checked) {
        newArr.push(value);
      } else {
        newArr = newArr.filter(item => item !== value);
      }
      return { [filterType]: newArr.length ? newArr : null };
    });
  };


  const handleRemoveFilter = (key: string) => {
    if (key === 'created-at-range') {
      handleCreatedAtChange(undefined);
      return;
    }
    if (key === 'updated-at-range') {
      handleUpdatedAtChange(undefined);
      return;
    }
    const [filterType, value] = key.split('-') as ['state' | 'type', string];
    handleFilterChange(filterType, value, false);
  };

  const updateFilterTags = (filterType: 'state' | 'type' | 'created-at-date' | 'updated-at', value: string | DateRange | undefined, checked: boolean) => {
    setFilterTags(prev => {
      if (filterType === 'created-at-date') {
        const existingTagIndex = prev.findIndex(tag => tag.key === 'created-at-range');
        if (checked && value && typeof value !== 'string') {
          const date = value as DateRange;
          let dateLabel = format(date.from!, 'PPP');
          if (date.to) {
            dateLabel = `${format(date.from!, 'PPP')} - ${format(date.to, 'PPP')}`;
          }
          const newTag = { key: 'created-at-range', label: 'Created At', value: dateLabel, className: 'w-auto' };
          if (existingTagIndex > -1) {
            const newTags = [...prev];
            newTags[existingTagIndex] = newTag;
            return newTags;
          }
          return [...prev, newTag];
        }
        return prev.filter(tag => tag.key !== 'issue-date-range');
      }
      
      if (filterType === 'updated-at') {
        const existingTagIndex = prev.findIndex(tag => tag.key === 'updated-at-range');
        if (checked && value && typeof value !== 'string') {
          const date = value as DateRange;
          let dateLabel = format(date.from!, 'PPP');
          if (date.to) {
            dateLabel = `${format(date.from!, 'PPP')} - ${format(date.to, 'PPP')}`;
          }
          const newTag = { key: 'payment-date-range', label: 'Payment Date', value: dateLabel, className: 'w-auto' };
          if (existingTagIndex > -1) {
            const newTags = [...prev];
            newTags[existingTagIndex] = newTag;
            return newTags;
          }
          return [...prev, newTag];
        }
        return prev.filter(tag => tag.key !== 'payment-date-range');
      }
      
      const key = `${filterType}-${value}`;
      if (checked && typeof value === 'string') {
        let label = '';
        if (filterType === 'state') label = 'State';
        if (filterType === 'type') label = 'Type';
        
        let displayValue = value.charAt(0).toUpperCase() + value.slice(1);
        
        return [...prev, { key, label, value: displayValue }];
      } else {
        return prev.filter(tag => tag.key !== key);
      }
    });
  };

  const handleClearAllFilters = () => {
    setParams({
      state: null,
      type: null,
      created_atFrom: null,
      created_atTo: null,
      updatedAtFrom: null,
      updatedAtTo: null,
    });
  };

  const handlePathSelect = (pathId: string) => {
    setParams({ pathId });
  };

  const handleEditSuccess = () => {
    editCloseRef.current?.click();
    setParams({ pathId: null });
    queryClient.invalidateQueries({ queryKey: ['paths'] });
  };


  const handleCloseSheet = () => {
    setParams({ pathId: null });
  };

  const handleCreateCancel = () => {
    closeRef.current?.click();
  }

  const handleDeleteFromSheet = () => {
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (params.pathId) {
      deletePathMutation.mutate(params.pathId, {
        onSuccess: () => {
          setDeleteModalOpen(false);
          // Close the sheet by navigating back
          setParams({ pathId: null });
        },
        onError: (error: any) => {
          console.error("Delete path error:", error.response?.data);
          const errorMessage = error.response?.data?.error || "Failed to delete path";
          toast.error(errorMessage);
          // Don't close the modal on error, let user try again
        }
      });
    }
  }

  const handleSavingChange = (saving: boolean, action: 'draft' | 'receipt' = 'draft') => {
    if (action === 'draft') {
      setIsSavingDraft(saving);
    } else {
      setIsCreatingWall(saving);
    }
    setIsSaving(saving); // Keep the general state for backward compatibility
  };

  const filterContent = (
    <div className="p-2">
      <DropdownMenuLabel>Filter paths</DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Issue Date</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="p-0">
          <Calendar
            initialFocus
            mode="range"
            captionLayout="dropdown"
            defaultMonth={activeFilters.created_at?.from}
            selected={activeFilters.created_at}
            onSelect={handleCreatedAtChange}
            numberOfMonths={1}
            fromYear={2015}
            toYear={2045}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />
      
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Updated At</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="p-0">
          <Calendar
            initialFocus
            mode="range"
            captionLayout="dropdown"
            defaultMonth={activeFilters.updatedAt?.from}
            selected={activeFilters.updatedAt}
            onSelect={handleUpdatedAtChange}
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

      {/* Creation Method Filter */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Privacy Type</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuCheckboxItem
            checked={activeFilters.type.includes('private')}
            onCheckedChange={(checked: boolean) => handleFilterChange('type', 'private', checked)}
          >
            Private
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.type.includes('public')}
            onCheckedChange={(checked: boolean) => handleFilterChange('type', 'public', checked)}
          >
            Public
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </div>
  );

  if (isError) {
    return <div className="p-8">Error fetching walls: {(error as Error).message}</div>;
  }




    

  

  return (
    <div className="relative">
    <CreateSearchFilter
      placeholder="Search walls..." 
      onSearch={handleSearch}
      filterContent={filterContent}
      filterTags={filterTagsMemo}
      onRemoveFilter={handleRemoveFilter}
      onClearAllFilters={handleClearAllFilters}
      sheetTriggerText="Create Path"
      onCreateClick={() => router.push('/protected/paths/create')}
    />

    {/* <CardAnalytics /> */}

    <ConfirmModal
      isOpen={isDeleteModalOpen}
      onClose={() => !deletePathMutation.isPending && setDeleteModalOpen(false)}
      onConfirm={handleConfirmDelete}
      itemName={pathBeingEdited?.name || "This Path"}
      itemType="Path"
      isLoading={deletePathMutation.isPending}
    />

    <Sheet 
      open={!!params.pathId} 
              onOpenChange={open => { if (!open && !deletePathMutation.isPending) handleCloseSheet(); }}
    >
      <SheetContent
        side="right" 
        bounce="right" 
        withGap={true} 
        className="w-full flex flex-col p-0 sm:w-3/4 md:w-1/2 lg:w-[40%]"
      >
        <SheetHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <SheetTitle>Path Details</SheetTitle>
             
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-none border-destructive text-destructive hover:bg-destructive/10 mr-7 hover:text-destructive"
                onClick={handleDeleteFromSheet}
                disabled={deletePathMutation.isPending}
              >
                {deletePathMutation.isPending ? (
                  <Bubbles className="h-4 w-4 mr-2 animate-spin [animation-duration:0.5s]" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Path
              </Button>
             
     
          </div>
        </SheetHeader>
        <ScrollArea className="flex-grow">
          {pathBeingEdited ? (
            <PathDetailsSheet  path={pathBeingEdited} />
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Path not found
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>

    <div className="mt-6 space-y-4">
    <div className="flex items-center justify-between">
        <DataTableViewOptions table={table} />
      </div>
      {shouldShowEmptyState ? (
        // Empty state - no paths exist
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Scroll className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No paths yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Get started by creating your first path. You can organize workflows, 
            create step-by-step processes, and guide users through complex tasks.
          </p>
          <Button onClick={() => router.push('/protected/paths/create')}>
            Create your first path
          </Button>
        </div>
      ) : filteredPaths.length === 0 ? (
        // No results from search/filters
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Scroll className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            No results for '{params.query || 'your search'}'. Try searching for paths by name, description, or recipient.
          </p>
          <Button variant="outline" onClick={handleClearAllFilters}>
            Clear all filters
          </Button>
        </div>
      ) : (
        // Show path table
        <>
          <DataTable 
            table={table}
            onPathSelect={handlePathSelect}
            searchQuery={params.query}
          />

          <Pagination
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            pageSize={table.getState().pagination.pageSize}
            totalItems={table.getFilteredRowModel().rows.length}
            onPageChange={page => table.setPageIndex(page - 1)}
            onPageSizeChange={size => table.setPageSize(size)}
            itemName="paths"
          />
        </>
      )}
    </div>
  </div>
  )
}