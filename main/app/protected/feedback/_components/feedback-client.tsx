"use client"
import React, { useMemo, useRef, useState, useEffect, Suspense }  from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import axios from 'axios'
import { format, parseISO, isWithinInterval, isSameDay } from "date-fns"
import { type DateRange } from "react-day-picker";
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
import CreateSearchFilter from "@/components/general/create-search-filter"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent,SheetClose, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bubbles, Trash2, Save, ChevronDown } from "lucide-react";
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import Pagination from '@/components/pagination';
import ConfirmModal from '@/components/modal/confirm-modal'
import { toast } from 'sonner'
import { z } from 'zod';
import { columns, Feedback } from './columns';
import { FilterTag } from '@/components/filtering/search-filter';
import { useFeedbacks } from '@/hooks/feedbacks/use-feedbacks';
import { getDefaultColumns, getTableColumnsWithDefaults, setTableColumns } from '@/cookie-persist/tableColumns';
import { DataTableViewOptions } from './data-table-view-options';
import ProjectClientSkeleton from '../../projects/_components/project-client-skeleton';
import { DataTable } from './data-table';
import CardAnalytics from './card-analytics';
import FeedbackSheet from './feedback-sheet';
import JSZip from 'jszip'; // We'll use this for zipping later
import { downloadFeedbackAsCSV } from '@/utils/exportCsv';
import { Progress } from "@/components/ui/progress"

type Props = {
  initialFeedbacks: Feedback[]
}

// ... (previous imports and code remain the same)

export default function FeedbackClient({ initialFeedbacks }: Props) {
  const queryClient = useQueryClient();
  const closeRef = useRef<HTMLButtonElement>(null);
  const editCloseRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterTags, setFilterTags] = useState<FilterTag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeFilters, setActiveFilters] = useState<{
    state: string[];
    date?: DateRange;
  }>({
    state: [],
    date: undefined,
  });

  const { 
    data: feedbacks = [], 
    isLoading, 
    isError, 
    error 
  } = useFeedbacks(initialFeedbacks);

  // --- Table State ---
  const [rowSelection, setRowSelection] = useState({})

  // Fix hydration issue: Use consistent column visibility for both server and client
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const allColumns = ['name', 'recepientName', 'recepientEmail', 'state', 'dueDate', 'filledOn'];
    const defaultVisibleColumns = ['name', 'recepientEmail', 'state', 'dueDate'];

    const state: VisibilityState = {};
    for (const col of allColumns) {
      state[col] = defaultVisibleColumns.includes(col);
    }
    
    return state;
  });

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Single comprehensive useEffect to handle all initialization
  useEffect(() => {
    setIsHydrated(true);

    const query = searchParams.get('query') || '';
    const feedbackId = searchParams.get('feedbackId');
    const stateFilters = searchParams.getAll('state');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    setSearchQuery(query);
    setSelectedFeedbackId(feedbackId);

    let dateRange: DateRange | undefined = undefined;
    if (dateFrom) {
      dateRange = { from: parseISO(dateFrom) };
      if (dateTo) {
        dateRange.to = parseISO(dateTo);
      }
    }

    setActiveFilters({
      state: stateFilters,
      date: dateRange,
    });

    const tags: FilterTag[] = [];

    if (dateRange?.from) {
      let label = format(dateRange.from, 'PPP');
      if (dateRange.to) {
        label = `${format(dateRange.from, 'PPP')} - ${format(dateRange.to, 'PPP')}`;
      }
      tags.push({ key: 'date-range', label: 'Date', value: label });
    }

    stateFilters.forEach(value => {
      tags.push({ 
        key: `state-${value}`, 
        label: 'State', 
        value: value.charAt(0).toUpperCase() + value.slice(1) 
      });
    });

    setFilterTags(tags);
  }, [searchParams]);

  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      const savedColumns = getTableColumnsWithDefaults('feedbacks');
      const allColumns = ['name', 'recepientName', 'recepientEmail', 'state', 'dueDate', 'filledOn'];
      
      const newState: VisibilityState = {};
      for (const col of allColumns) {
        newState[col] = savedColumns.includes(col);
      }
      
      setColumnVisibility(newState);
    }
  }, [isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      const visibleCols = Object.entries(columnVisibility)
        .filter(([_, v]) => v)
        .map(([k]) => k);
      setTableColumns('feedbacks', visibleCols);
    }
  }, [columnVisibility, isHydrated]);

  const filteredFeedbacks = useMemo(() => {
    let filtered = [...feedbacks];

    if (searchQuery) {
      filtered = filtered.filter(feedback => 
        feedback.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feedback.recepientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feedback.recepientEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilters.date?.from) {
      filtered = filtered.filter(feedback => {
        if (!feedback.created_at || !activeFilters.date?.from) return false;
        const feedbackDate = new Date(feedback.created_at);
        if (isNaN(feedbackDate.getTime())) return false;

        if (activeFilters.date.to) {
          return isWithinInterval(feedbackDate, { start: activeFilters.date.from, end: activeFilters.date.to });
        }
        return isSameDay(feedbackDate, activeFilters.date.from);
      });
    }

    if (activeFilters.state.length > 0) {
      filtered = filtered.filter(feedback => 
        activeFilters.state.includes(feedback.state?.trim().toLowerCase() || '')
      );
    }

    return filtered;
  }, [feedbacks, searchQuery, activeFilters]);

  const feedbackBeingEdited = useMemo(() => {
    return feedbacks.find(p => p.id === selectedFeedbackId)
  }, [feedbacks, selectedFeedbackId])

  const deleteFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      return axios.delete(`/api/feedback/${feedbackId}`);
    },
    onSuccess: () => {
      toast.success("Feedback deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });

      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.delete('feedbackId');
      const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
      router.replace(newUrl);
      setSelectedFeedbackId(null);

      router.refresh && router.refresh();
    },
    onError: (error: any) => {
      console.error("Delete feedback error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to delete feedback";
      toast.error(errorMessage);
    },
  });

  const table = useReactTable({
    data: filteredFeedbacks,
    columns: columns,
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
    
    if (search !== undefined) {
      if (search) {
        params.set('query', search);
      } else {
        params.delete('query');
      }
    }

    params.delete('state');
    params.delete('dateFrom');
    params.delete('dateTo');

    if (newFilters.date?.from) {
      params.append('dateFrom', newFilters.date.from.toISOString());
      if (newFilters.date.to) {
        params.append('dateTo', newFilters.date.to.toISOString());
      }
    }
    newFilters.state.forEach(value => params.append('state', value));

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

  const handleFilterChange = (filterType: 'state', value: string, checked: boolean) => {
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

  const handleDeleteFromSheet = () => {
    setDeleteModalOpen(true)
  }

  const handleCloseSheet = () => {
    router.push("/protected/feedback");
    setSelectedFeedbackId(null);
  };

  const editFooter = (
    <>
      <SheetClose asChild>
        <Button variant="ghost" onClick={handleCloseSheet}>Cancel</Button>
      </SheetClose>
      <Button variant="outlinebrimary" className="px-3 sm:px-4">
        <Save className="h-4 w-4 mr-2" />
        Update Feedback
      </Button>

      <div className="inline-flex rounded-md shadow-sm">
        <Button
          className="rounded-r-none px-3 sm:px-4"
        >
          Update Feedback
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="rounded-l-none border-l border-purple-700 px-3"
            >
              <span className="sr-only">Open options</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </div>
    </>
  );

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
        
        let displayValue = '';
        displayValue = value.charAt(0).toUpperCase() + value.slice(1);

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
    const [filterType, value] = key.split('-') as ['state', string];
    handleFilterChange(filterType, value, false);
  };

  const handleClearAllFilters = () => {
    setActiveFilters({ state: [], date: undefined });
    setFilterTags([]);
    updateURL({ state: [], date: undefined });
  };

  const handleFeedbackSelect = (feedbackId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('feedbackId', feedbackId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreateSuccess = () => {
    closeRef.current?.click();
    const params = new URLSearchParams(searchParams);
    params.delete('createFeedback');
    router.replace(`${pathname}?${params.toString()}`);
    queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
  };

  const handleEditSuccess = () => {
    editCloseRef.current?.click();
    setSelectedFeedbackId(null);
    const params = new URLSearchParams(searchParams);
    params.delete('feedbackId');
    router.replace(`${pathname}?${params.toString()}`);
    queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
  };

  const handleConfirmDelete = () => {
    if (selectedFeedbackId) {
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.delete('feedbackId');
      const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
      router.replace(newUrl);
      setSelectedFeedbackId(null);

      deleteFeedbackMutation.mutate(selectedFeedbackId);
    }
    setDeleteModalOpen(false);
  }

  const filterContent = (
    <div className="p-2">
      <DropdownMenuLabel>Filter feedbacks</DropdownMenuLabel>
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
            checked={activeFilters.state.includes('sent')}
            onCheckedChange={(checked: boolean) => handleFilterChange('state', 'sent', checked)}
          >
            Sent
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.state.includes('completed')}
            onCheckedChange={(checked: boolean) => handleFilterChange('state', 'completed', checked)}
          >
            Completed
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.state.includes('overdue')}
            onCheckedChange={(checked: boolean) => handleFilterChange('state', 'overdue', checked)}
          >
            Overdue
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />
    </div>
  );

  const selectedFeedbacks = useMemo(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selected = selectedRows.map(row => row.original);
    console.log('Row selection:', rowSelection);
    console.log('Selected feedbacks:', selected);
    return selected;
  }, [table, rowSelection]);

  const sanitizeFilename = (name: string): string => {
    return name
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  };

  const handleExport = async () => {
    const validFeedbacks = selectedFeedbacks.filter(feedback => {
      const hasValidId = feedback.id && feedback.id.trim() !== '';
      const hasValidName = feedback.name && feedback.name.trim() !== '';
      return hasValidId || hasValidName;
    });

    if (validFeedbacks.length === 0) {
      toast.error('No valid feedbacks selected for export');
      return;
    }

    if (validFeedbacks.length !== selectedFeedbacks.length) {
      toast.warning(`${selectedFeedbacks.length - validFeedbacks.length} invalid feedbacks were skipped`);
    }

    if (selectedFeedbacks.length > 1) {
      setIsExporting(true);

      const loadingToast = toast.loading(
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            <div className="font-medium text-base">Preparing your feedbacks for export...</div>
            <div className="text-sm text-muted-foreground">
              Processing {selectedFeedbacks.length} feedback forms
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-2 w-full" />
          </div>
        </div>,
        {
          duration: Infinity,
          className: "w-[380px] p-4",
        }
      );

      try {
        const zip = new JSZip();
        const processedFilenames = new Set();

        await new Promise(resolve => setTimeout(resolve, 800));

        for (let i = 0; i < selectedFeedbacks.length; i++) {
          const feedback = selectedFeedbacks[i];
          const progress = Math.round(((i + 1) / selectedFeedbacks.length) * 100);

          toast.loading(
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1">
                <div className="font-medium text-base">
                  Processing feedback {i + 1} of {selectedFeedbacks.length}...
                </div>
                <div className="text-sm text-muted-foreground">
                  Working on: {feedback.name || `Feedback ${feedback.id}`}
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 w-full" />
              </div>
            </div>,
            {
              id: loadingToast,
              duration: Infinity,
              className: "w-[380px] p-4",
            }
          );

          const mappedFeedback = {
            name: feedback.name || `Feedback ${feedback.id}`,
            projectName: '',
            recepientName: feedback.recepientName || '',
            recepientEmail: feedback.recepientEmail || '',
            state: feedback.state || '',
            created_at: feedback.created_at || '',
            dueDate: feedback.dueDate || '',
            filledOn: feedback.filledOn || '',
            questions: feedback.questions || [],
            answers: feedback.answers || [],
          };

          let baseName = feedback.name || `feedback-${feedback.id}`;
          let fileName = `${sanitizeFilename(baseName)}.csv`;

          let counter = 1;
          while (processedFilenames.has(fileName)) {
            fileName = `${sanitizeFilename(baseName)}_${counter}.csv`;
            counter++;
          }
          processedFilenames.add(fileName);

          const csvString = downloadFeedbackAsCSV(mappedFeedback, undefined, true);

          if (csvString && typeof csvString === 'string' && csvString.length > 0) {
            zip.file(fileName, csvString);
          }

          await new Promise(resolve => setTimeout(resolve, 400));
        }

        toast.loading(
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <div className="font-medium text-base">Finalizing your export...</div>
              <div className="text-sm text-muted-foreground">Creating zip file</div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>100%</span>
              </div>
              <Progress value={100} className="h-2 w-full" />
            </div>
          </div>,
          {
            id: loadingToast,
            duration: Infinity,
            className: "w-[380px] p-4",
          }
        );

        await new Promise(resolve => setTimeout(resolve, 800));

        const zipBlob = await zip.generateAsync({ type: 'blob' });

        toast.success(
          <div className="flex flex-col gap-3 py-1">
            <div className="flex flex-col gap-1">
              <div className="font-medium text-base">Export completed!</div>
              <div className="text-sm text-muted-foreground">
                {selectedFeedbacks.length} feedback forms ready for download
              </div>
            </div>
          </div>,
          {
            id: loadingToast,
            description: `File size: ${(zipBlob.size / 1024).toFixed(1)} KB`,
            action: {
              label: "Download",
              onClick: () => {
                const url = URL.createObjectURL(zipBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `feedbacks-export-${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.success("Download started!");
              },
            },
            duration: 15000,
            className: "w-[380px] p-4",
            actionButtonStyle: {
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }
          }
        );

      } catch (error) {
        console.error('Export error:', error);
        toast.error('Failed to export feedbacks', {
          id: loadingToast,
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          className: "w-[380px] p-4",
        });
      } finally {
        setIsExporting(false);
      }
    } else {
      if (selectedFeedbacks.length === 1) {
        const feedback = selectedFeedbacks[0];
        const mappedFeedback = {
          name: feedback.name || `Feedback ${feedback.id}`,
          projectName: '',
          recepientName: feedback.recepientName || '',
          recepientEmail: feedback.recepientEmail || '',
          state: feedback.state || '',
          created_at: feedback.created_at || '',
          dueDate: feedback.dueDate || '',
          filledOn: feedback.filledOn || '',
          questions: feedback.questions || [],
          answers: feedback.answers || [],
        };

        downloadFeedbackAsCSV(mappedFeedback, `${sanitizeFilename(feedback.name || `feedback-${feedback.id}`)}.csv`);
        toast.success("Feedback exported successfully!");
      }
    }
  };

  // Define ExportBar component
  const ExportBar = () => {
    console.log('ExportBar rendered with', selectedFeedbacks.length, 'selected feedbacks');
    
    const handleExportClick = () => {
      handleExport();
    };
    
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 border bg-foreground/10 shadow-lg flex items-center justify-between space-x-3 px-8 py-4 z-70 min-w-[300px]">
        <div>
          <span className="font-medium">{selectedFeedbacks.length} selected</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-none"
            size="sm"
            onClick={() => setRowSelection({})}
          >
            Deselect all
          </Button>
          <Button
            variant="default"
            size="sm"
            className="rounded-none"
            disabled={isExporting || selectedFeedbacks.length === 0}
            onClick={handleExportClick}
          >
            {isExporting ? "Preparing..." : "Export"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <CreateSearchFilter
        placeholder="Search feedbacks..." 
        onSearch={handleSearch}
        filterContent={filterContent}
        filterTags={filterTags}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        sheetTriggerText="Create Feedback"
        onCreateClick={() => router.push('/protected/feedback/create')}
      />

      <CardAnalytics />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={feedbackBeingEdited?.name || "This Feedback"}
        itemType="Feedback"
        isLoading={deleteFeedbackMutation.isPending}
      />

      <Sheet
        key={selectedFeedbackId}
        open={!!selectedFeedbackId}
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
              <SheetTitle>Edit Feedback</SheetTitle>
              {selectedFeedbackId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-none border-destructive text-destructive hover:bg-destructive/10 mr-7 hover:text-destructive"
                  onClick={handleDeleteFromSheet}
                  disabled={deleteFeedbackMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Feedback
                </Button>
              )}
            </div>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            <div className="p-4">
              {selectedFeedbackId && feedbackBeingEdited && (
                <FeedbackSheet feedback={feedbackBeingEdited} />
              )}
            </div>
          </ScrollArea>
          <SheetFooter className="p-4 border-t">
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <DataTableViewOptions table={table} />
        </div>
        <Suspense fallback={<ProjectClientSkeleton />}>
          <DataTable 
            table={table} 
            onFeedbackSelect={handleFeedbackSelect} 
            searchQuery={searchQuery}
          />
          <Pagination
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            pageSize={table.getState().pagination.pageSize}
            totalItems={table.getFilteredRowModel().rows.length}
            onPageChange={page => table.setPageIndex(page - 1)}
            onPageSizeChange={size => table.setPageSize(size)}
            itemName="feedbacks"
          />
        </Suspense>
      </div>
      
      {selectedFeedbacks.length > 0 && <ExportBar />}
    </div>
  )
}