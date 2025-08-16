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
import { Bubbles, Trash2, Save, ChevronDown, LayoutTemplate, HardDriveDownload } from "lucide-react"
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
} from "@/components/ui/dropdown-menu";
import { DataTableViewOptions } from './data-table-view-options'

import { Calendar } from '@/components/ui/calendar'
import { getTableColumns, setTableColumns, getTableColumnsWithDefaults, getDefaultColumns } from '@/cookie-persist/tableColumns';
import ConfirmModal from '@/components/modal/confirm-modal';
import Pagination from '@/components/pagination';
import { parseAsArrayOf, parseAsIsoDateTime, parseAsString, useQueryStates } from 'nuqs'; 
import { useWalls, Wall } from '@/hooks/walls/use-walls';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import WallDetailsSheet from './wall-details-sheet';
import { DataTable } from './data-table';
import ProjectClientSkeleton from '../../projects/_components/project-client-skeleton';

interface Props {
  initialWalls: Wall[]
  userEmail: string | null
}

export default function WallClient({ initialWalls, userEmail }: Props) {

  const queryClient = useQueryClient();
  const router = useRouter();
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
    wallId: parseAsString.withOptions({ clearOnDefault: true }), // null to remove
    state: parseAsArrayOf(parseAsString).withDefault([]),
    type: parseAsArrayOf(parseAsString).withDefault([]),

    issueDateFrom: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    issueDateTo: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    updatedAtFrom: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    updatedAtTo: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
  }, { history: 'push' }); // Push to URL on change

  // Derive activeFilters from params
  const activeFilters = useMemo(() => ({
    state: params.state,
    type: params.type,
    issueDate: params.issueDateFrom ? { from: params.issueDateFrom, to: params.issueDateTo ?? undefined } : undefined,
    updatedAt: params.updatedAtFrom ? { from: params.updatedAtFrom, to: params.updatedAtTo ?? undefined } : undefined,
  }), [params]);


      // Build filterTags from activeFilters
  const filterTagsMemo = useMemo<FilterTag[]>(() => {
    const tags: FilterTag[] = [];

      if (activeFilters.issueDate?.from) {
        let label = format(activeFilters.issueDate.from, 'PPP');
        if (activeFilters.issueDate.to) {
          label = `${format(activeFilters.issueDate.from, 'PPP')} - ${format(activeFilters.issueDate.to, 'PPP')}`;
        }
        tags.push({ key: 'issue-date-range', label: 'Issue Date', value: label });
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
    data: walls = [], 
    isLoading, 
    isError, 
    error 
  } = useWalls(initialWalls);

  // --- Table State ---
  const [rowSelection, setRowSelection] = useState({})

  // Fix hydration issue: Initialize with server-safe default state
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const defaultColumns = getDefaultColumns('walls');
    const allColumns = ['name', 'description', 'state', 'issueDate', 'private'];
    
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
    const savedColumns = getTableColumnsWithDefaults('walls');
    const allColumns = ['name', 'description', 'state', 'issueDate', 'private'];
    
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
    setTableColumns('walls', visibleCols);
  }, [columnVisibility]);

  const filteredWalls = useMemo(() => {
    let filtered = [...walls];

    // Apply search query
    if (params.query) {
      filtered = filtered.filter(wall => 
        wall.name?.toLowerCase().includes(params.query.toLowerCase()) ||
        wall.recepientName?.toLowerCase().includes(params.query.toLowerCase()) ||
        wall.recepientEmail?.toLowerCase().includes(params.query.toLowerCase()) 
      );
    }

    // Apply issue date filter
    if (activeFilters.issueDate?.from) {
      filtered = filtered.filter(wall => {
      if (!wall.issueDate) return false;
      const rDate = new Date(wall.issueDate);
      if (isNaN(rDate.getTime())) return false;
      
      if (activeFilters?.issueDate?.to) {
      return isWithinInterval(rDate, { start: activeFilters?.issueDate?.from!, end: activeFilters?.issueDate?.to! });
      }
      return isSameDay(rDate, activeFilters?.issueDate?.from!);
      });
    }
    // Apply updatedAt date filter
    if (activeFilters.updatedAt?.from) {
      filtered = filtered.filter(wall => {
      if (!wall.updatedAt) return false;
      const rDate = new Date(wall.updatedAt);
      if (isNaN(rDate.getTime())) return false;
      
      if (activeFilters?.updatedAt?.to) {
      return isWithinInterval(rDate, { start: activeFilters?.updatedAt?.from!, end: activeFilters?.updatedAt?.to! });
      }
      return isSameDay(rDate, activeFilters?.updatedAt?.from!);
      });
    }


    // Apply state filter
    if (activeFilters.state.length > 0) {
      filtered = filtered.filter(wall => 
        activeFilters.state.includes(wall.state?.trim().toLowerCase() || '')
      );
    }
    
    // Apply creation method filter
    if (activeFilters.type.length > 0) {
      filtered = filtered.filter(wall =>
        activeFilters.type.includes(wall.type?.trim().toLowerCase() || '')
      );
    }
    return filtered;
  }, [walls, params.query, activeFilters]);

  const wallBeingEdited = useMemo(() => {
    return walls.find(i => i.id === params.wallId)
  }, [walls, params.wallId])

  const deleteWallMutation = useMutation({
    mutationFn: async (wallId: string) => {
      return axios.delete(`/api/walls/${wallId}`);
    },
    onSuccess: () => {
      toast.success("Wall deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['walls'] });
      setParams({ wallId: null });
    },
    onError: (error: any) => {
      console.error("Delete wall error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to delete wall";
      toast.error(errorMessage);
    },
  });

  const table = useReactTable({
    data: filteredWalls,
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

  const selectedWalls = useMemo(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selected = selectedRows.map(row => row.original);
    return selected as Wall[];
  }, [table, rowSelection]);

  const handleSearch = (value: string) => {
    setParams({ query: value || null });
  };

  const handleIssueDateChange = (date: DateRange | undefined) => {
    setParams({
      issueDateFrom: date?.from ? date.from : null,
      issueDateTo: date?.to ? date.to : null,
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
    if (key === 'issue-date-range') {
      handleIssueDateChange(undefined);
      return;
    }
    if (key === 'updated-at-range') {
      handleUpdatedAtChange(undefined);
      return;
    }
    const [filterType, value] = key.split('-') as ['state' | 'type', string];
    handleFilterChange(filterType, value, false);
  };


  const updateFilterTags = (filterType: 'state' | 'type' | 'issue-date' | 'updated-at', value: string | DateRange | undefined, checked: boolean) => {
    setFilterTags(prev => {
      if (filterType === 'issue-date') {
        const existingTagIndex = prev.findIndex(tag => tag.key === 'issue-date-range');
        if (checked && value && typeof value !== 'string') {
          const date = value as DateRange;
          let dateLabel = format(date.from!, 'PPP');
          if (date.to) {
            dateLabel = `${format(date.from!, 'PPP')} - ${format(date.to, 'PPP')}`;
          }
          const newTag = { key: 'issue-date-range', label: 'Issue Date', value: dateLabel, className: 'w-auto' };
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
      issueDateFrom: null,
      issueDateTo: null,
      updatedAtFrom: null,
      updatedAtTo: null,
    });
  };

  const handleWallSelect = (wallId: string) => {
    setParams({ wallId });
  };

  const handleCreateSuccess = () => {
    closeRef.current?.click();
    queryClient.invalidateQueries({ queryKey: ['walls'] });
  };

  const handleEditSuccess = () => {
    editCloseRef.current?.click();
    setParams({ wallId: null });
    queryClient.invalidateQueries({ queryKey: ['walls'] });
  };


  const handleCloseSheet = () => {
    setParams({ wallId: null });
  };

  const handleCreateCancel = () => {
    closeRef.current?.click();
  }


  const handleDeleteFromSheet = () => {
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (params.wallId) {
      deleteWallMutation.mutate(params.wallId)
    }
    setDeleteModalOpen(false)
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
      <DropdownMenuLabel>Filter receipts</DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Issue Date</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="p-0">
          <Calendar
            initialFocus
            mode="range"
            captionLayout="dropdown"
            defaultMonth={activeFilters.issueDate?.from}
            selected={activeFilters.issueDate}
            onSelect={handleIssueDateChange}
            numberOfMonths={1}
            fromYear={2015}
            toYear={2045}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />
      
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Payment Date</DropdownMenuSubTrigger>
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
        sheetTriggerText="Create Wall"
        onCreateClick={() => router.push('/protected/walls/create')}
      />

      {/* <CardAnalytics /> */}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={wallBeingEdited?.name || "This Wall"}
        itemType="Wall"
        isLoading={deleteWallMutation.isPending}
      />

      <Sheet 
        open={!!params.wallId} 
        onOpenChange={open => { if (!open) handleCloseSheet(); }}
      >
        <SheetContent
          side="right" 
          bounce="right" 
          withGap={true} 
          className="w-full flex flex-col p-0 sm:w-3/4 md:w-1/2 lg:w-[40%]"
        >
          <SheetHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle>Wall Details</SheetTitle>
              <div className="flex items-center fixed right-20 gap-2">              
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-none border-destructive text-destructive hover:bg-destructive/10 mr-7 hover:text-destructive"
                  onClick={handleDeleteFromSheet}
                  disabled={deleteWallMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Wall
                </Button>
               
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            {wallBeingEdited ? (
              <WallDetailsSheet wall={wallBeingEdited} />
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Wall not found
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
          <DataTableViewOptions table={table} />
        </div>
        <Suspense fallback={<ProjectClientSkeleton />}>
          <DataTable 
            table={table}
            onWallSelect={handleWallSelect}
            searchQuery={params.query}
          />

          <Pagination
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            pageSize={table.getState().pagination.pageSize}
            totalItems={table.getFilteredRowModel().rows.length}
            onPageChange={page => table.setPageIndex(page - 1)}
            onPageSizeChange={size => table.setPageSize(size)}
            itemName="walls"
          />
        </Suspense>
      </div>
    </div>
  )
}