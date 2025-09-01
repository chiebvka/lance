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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Bubbles, Trash2, Save, ChevronDown, Scroll } from "lucide-react";
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
import { Feedbacks, useFeedbacks } from '@/hooks/feedbacks/use-feedbacks';
import { getDefaultColumns, getTableColumnsWithDefaults, setTableColumns } from '@/cookie-persist/tableColumns';
import { DataTableViewOptions } from './data-table-view-options';

import { DataTable } from './data-table';
import CardAnalytics from './card-analytics';

import JSZip from 'jszip'; // We'll use this for zipping later
import { downloadFeedbackAsCSV } from '@/utils/exportCsv';
import { Progress } from "@/components/ui/progress"
import ProjectClientSkeleton from '../../projects/_components/project-client-skeleton';
import { parseAsArrayOf, parseAsIsoDateTime, parseAsString, useQueryStates } from 'nuqs'; 
import FeedbackSheet from './feedback-sheet';

type Props = {
  initialFeedbacks: Feedbacks[]
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

  // const [activeFilters, setActiveFilters] = useState<{
  //   state: string[];
  //   date?: DateRange;
  // }>({
  //   state: [],
  //   date: undefined,
  // });



  // nuqs for URL params (replaces useSearchParams, big useEffect, updateURL)
  const [params, setParams] = useQueryStates({
    query: parseAsString.withDefault(''),
    feedbackId: parseAsString.withOptions({ clearOnDefault: true }), // null to remove
    state: parseAsArrayOf(parseAsString).withDefault([]),
    type: parseAsString.withDefault('details'),
    sentAtFrom: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    sentAtTo: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    filledOnFrom: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    filledOnTo: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    dueDateFrom: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    dueDateTo: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
  }, { history: 'push' }); // Push to URL on change

  // Derive activeFilters from params
  const activeFilters = useMemo(() => ({
    state: params.state,
    sentAt: params.sentAtFrom ? { from: params.sentAtFrom, to: params.sentAtTo ?? undefined } : undefined,
    filledOn: params.filledOnFrom ? { from: params.filledOnFrom, to: params.filledOnTo ?? undefined } : undefined,
    dueDate: params.dueDateFrom ? { from: params.dueDateFrom, to: params.dueDateTo ?? undefined } : undefined,
  }), [params]);

  // Build filterTags from activeFilters
  const filterTagsMemo = useMemo<FilterTag[]>(() => {
    const tags: FilterTag[] = [];

    if (activeFilters.sentAt?.from) {
      let label = format(activeFilters.sentAt.from, 'PPP');
      if (activeFilters.sentAt.to) {
        label = `${format(activeFilters.sentAt.from, 'PPP')} - ${format(activeFilters.sentAt.to, 'PPP')}`;
      }
      tags.push({ key: 'sent-at-date-range', label: 'Issue Date', value: label });
    }

    if (activeFilters.filledOn?.from) {
      let label = format(activeFilters.filledOn.from, 'PPP');
      if (activeFilters.filledOn.to) {
        label = `${format(activeFilters.filledOn.from, 'PPP')} - ${format(activeFilters.filledOn.to, 'PPP')}`;
      }
      tags.push({ key: 'filled-on-date-range', label: 'Filled On', value: label });
    }

    if (activeFilters.dueDate?.from) {
      let label = format(activeFilters.dueDate.from, 'PPP');
      if (activeFilters.dueDate.to) {
        label = `${format(activeFilters.dueDate.from, 'PPP')} - ${format(activeFilters.dueDate.to, 'PPP')}`;
      }
      tags.push({ key: 'due-date-range', label: 'Due Date', value: label });
    }

    activeFilters.state.forEach(value => {
      tags.push({ 
        key: `state-${value}`, 
        label: 'State', 
        value: value.charAt(0).toUpperCase() + value.slice(1) 
      });
    });

    return tags;
  }, [activeFilters]);

  const { 
    data: feedbacks = [], 
    isLoading, 
    isError, 
    error 
  } = useFeedbacks(initialFeedbacks);

  // Check if we have any active search or filters
  const hasActiveSearchOrFilters = useMemo(() => {
    return params.query || 
           activeFilters.state.length > 0 || 
           activeFilters.sentAt ||
           activeFilters.filledOn ||
           activeFilters.dueDate;
  }, [params.query, activeFilters]);

  // Check if we should show empty state vs no results
  const shouldShowEmptyState = useMemo(() => {
    return feedbacks.length === 0 && !hasActiveSearchOrFilters;
  }, [feedbacks.length, hasActiveSearchOrFilters]);

  // --- Table State ---
  const [rowSelection, setRowSelection] = useState({})

  // Fix hydration issue: Use consistent column visibility for both server and client
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const defaultVisibleColumns = ['name', 'recepientEmail', 'state', 'dueDate', 'filledOn'];
    const allColumns = ['name', 'recepientName', 'recepientEmail', 'state', 'dueDate', 'filledOn', 'sentAt'];

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
    const savedColumns = getTableColumnsWithDefaults('feedbacks');
    const allColumns = ['name', 'recepientName', 'recepientEmail', 'state', 'dueDate', 'filledOn', 'sentAt'];
    
    const newState: VisibilityState = {};
    for (const col of allColumns) {
      newState[col] = savedColumns.includes(col);
    }
    
    setColumnVisibility(newState);
  }, [searchParams]);

  useEffect(() => {
    if (isHydrated) {
    const visibleCols = Object.entries(columnVisibility)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    setTableColumns('feedbacks', visibleCols);
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

    if (params.query) {
      filtered = filtered.filter(feedback => 
        feedback.name?.toLowerCase().includes(params.query.toLowerCase()) ||
        feedback.recepientName?.toLowerCase().includes(params.query.toLowerCase()) ||
        feedback.recepientEmail?.toLowerCase().includes(params.query.toLowerCase())
      );
    }

    if (activeFilters.sentAt?.from) {
      filtered = filtered.filter(feedback => {
        if (!feedback?.sentAt || !activeFilters.sentAt?.from) return false;
        const feedbackDate = new Date(feedback.sentAt);
        if (isNaN(feedbackDate.getTime())) return false;

        if (activeFilters.sentAt.to) {
          return isWithinInterval(feedbackDate, { start: activeFilters.sentAt.from, end: activeFilters.sentAt.to });
        }
        return isSameDay(feedbackDate, activeFilters.sentAt.from);
      });
    }
  // Apply issue date filter
  if (activeFilters.filledOn?.from) {
    filtered = filtered.filter(feedback => {
    if (!feedback.filledOn) return false;
    const rDate = new Date(feedback.filledOn);
    if (isNaN(rDate.getTime())) return false;
    
    if (activeFilters?.filledOn?.to) {
    return isWithinInterval(rDate, { start: activeFilters?.filledOn?.from!, end: activeFilters?.filledOn?.to! });
    }
    return isSameDay(rDate, activeFilters?.filledOn?.from!);
    });
  }

  // Apply issue date filter
  if (activeFilters.dueDate?.from) {
    filtered = filtered.filter(feedback => {
    if (!feedback.dueDate) return false;
    const rDate = new Date(feedback.dueDate);
    if (isNaN(rDate.getTime())) return false;
    
    if (activeFilters?.dueDate?.to) {
    return isWithinInterval(rDate, { start: activeFilters?.dueDate?.from!, end: activeFilters?.dueDate?.to! });
    }
    return isSameDay(rDate, activeFilters?.dueDate?.from!);
    });
  }

    if (activeFilters.state.length > 0) {
      filtered = filtered.filter(feedback => 
        activeFilters.state.includes(feedback.state?.trim().toLowerCase() || '')
      );
    }

    return filtered;
  }, [feedbacks, params.query, activeFilters]);

  const feedbackBeingEdited = useMemo(() => {
    return feedbacks.find(p => p.id === params.feedbackId)
  }, [feedbacks, params.feedbackId])

  const deleteFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      return axios.delete(`/api/feedback/${feedbackId}`);
    },
    onSuccess: () => {
      toast.success("Feedback deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
  });

  const table = useReactTable({
    data: filteredFeedbacks,
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
  })

  const selectedFeedbacks = useMemo(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selected = selectedRows.map(row => row.original);
    return selected as Feedbacks[];
  }, [table, rowSelection]);


  const handleSearch = (value: string) => {
    setParams({ query: value || null });
  };


  const handleSentAtChange = (date: DateRange | undefined) => {
    setParams({
      sentAtFrom: date?.from ? date.from : null,
      sentAtTo: date?.to ? date.to : null,
    });
  }

  const handleFilledOnChange = (date: DateRange | undefined) => {
    setParams({
      filledOnFrom: date?.from ? date.from : null,
      filledOnTo: date?.to ? date.to : null,
    });
  }

  const handleDueDateChange = (date: DateRange | undefined) => {
    setParams({
      dueDateFrom: date?.from ? date.from : null,
      dueDateTo: date?.to ? date.to : null,
    });
  }





  const handleFilterChange = (filterType: 'state', value: string, checked: boolean) => {
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
    if (key === 'sent-at-date-range') {
      handleSentAtChange(undefined);
      return;
    }
    if (key === 'filled-on-date-range') {
      handleFilledOnChange(undefined);
      return;
    }
    if (key === 'due-date-range') {
      handleDueDateChange(undefined);
      return;
    }
    const [filterType, value] = key.split('-') as ['state', string];
    handleFilterChange(filterType, value, false);
  };

  const handleClearAllFilters = () => {
    setParams({
      state: null,
      sentAtFrom: null,
      sentAtTo: null,
      filledOnFrom: null,
      filledOnTo: null,
      dueDateFrom: null,
      dueDateTo: null,
    });
  };

  const handleDeleteFromSheet = () => {
    setDeleteModalOpen(true)
  }

  const handleCloseSheet = () => {
    router.push("/protected/feedback");
    setSelectedFeedbackId(null);
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
        
        let displayValue = '';
        displayValue = value.charAt(0).toUpperCase() + value.slice(1);

        return [...prev, { key, label, value: displayValue }];
      } else {
        return prev.filter(tag => tag.key !== key);
      }
    });
  };




  const handleFeedbackSelect = (feedbackId: string) => {
    setParams({ feedbackId, type: 'details' });
  };



  const handleConfirmDelete = () => {
    if (params.feedbackId) {
      deleteFeedbackMutation.mutate(params.feedbackId, {
        onSuccess: () => {
          setDeleteModalOpen(false);
          // Invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
          // Close the sheet by navigating back
          const currentParams = new URLSearchParams(searchParams.toString());
          currentParams.delete('feedbackId');
          currentParams.delete('type');
          const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
          router.replace(newUrl);
          setSelectedFeedbackId(null);
          router.refresh && router.refresh();
        },
        onError: (error: any) => {
          console.error("Delete feedback error:", error.response?.data);
          const errorMessage = error.response?.data?.error || "Failed to delete feedback";
          toast.error(errorMessage);
          // Don't close the modal on error, let user try again
        }
      });
    }
  }

  const filterContent = (
    <div className="p-2">
      <DropdownMenuLabel>Filter feedbacks</DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Issue Date</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="p-0">
          <Calendar
            initialFocus
            mode="range"
            captionLayout="dropdown"
            defaultMonth={activeFilters.sentAt?.from}
            selected={activeFilters.sentAt}
            onSelect={handleSentAtChange}
            numberOfMonths={1}
            fromYear={2015}
            toYear={2045}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Filled On</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="p-0">
          <Calendar
            initialFocus
            mode="range"
            captionLayout="dropdown"
            defaultMonth={activeFilters.filledOn?.from}
            selected={activeFilters.filledOn}
            onSelect={handleFilledOnChange}
            numberOfMonths={1}
            fromYear={2015}
            toYear={2045}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Due Date</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="p-0">
          <Calendar
            initialFocus
            mode="range"
            captionLayout="dropdown"
            defaultMonth={activeFilters.dueDate?.from}
            selected={activeFilters.dueDate}
            onSelect={handleDueDateChange}
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
          <DropdownMenuCheckboxItem
            checked={activeFilters.state.includes('cancelled')}
            onCheckedChange={(checked: boolean) => handleFilterChange('state', 'cancelled', checked)}
          >
            Cancelled
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />
    </div>
  );


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

      const loadingToast = toast.loading('Preparing export...');

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
                <div className="font-medium text-base">Exporting feedbacks</div>
                <div className="text-sm text-muted-foreground">Please wait while we prepare your files...</div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>,
            { id: loadingToast, duration: Infinity, className: 'w-[380px] p-4' }
          )


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
          
          // Debug logging to ensure data is being passed correctly
          // console.log('Mapped feedback for CSV export:', mappedFeedback);
          // console.log('Questions type:', typeof mappedFeedback.questions);
          // console.log('Answers type:', typeof mappedFeedback.answers);

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
              <div className="font-medium text-base">Exporting feedbacks</div>
              <div className="text-sm text-muted-foreground">Please wait while we prepare your files...</div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>,
          { id: loadingToast, duration: Infinity, className: 'w-[380px] p-4' }
        )

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
        
        // Debug logging to ensure data is being passed correctly
        // console.log('Single feedback mapped for CSV export:', mappedFeedback);
        // console.log('Questions type:', typeof mappedFeedback.questions);
        // console.log('Answers type:', typeof mappedFeedback.answers);

        downloadFeedbackAsCSV(mappedFeedback, `${sanitizeFilename(feedback.name || `feedback-${feedback.id}`)}.csv`);
        toast.success("Feedback exported successfully!");
      }
    }
  };

  // Define ExportBar component
  const ExportBar = () => {
    // console.log('ExportBar rendered with', selectedFeedbacks.length, 'selected feedbacks');
    
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
        filterTags={filterTagsMemo}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        sheetTriggerText="Create Feedback"
        onCreateClick={() => router.push('/protected/feedback/create')}
      />

      <CardAnalytics />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => !deleteFeedbackMutation.isPending && setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={feedbackBeingEdited?.name || "This Feedback"}
        itemType="Feedback"
        isLoading={deleteFeedbackMutation.isPending}
      />

      <Sheet
        key={params.feedbackId}
        open={!!params.feedbackId}
        onOpenChange={open => { if (!open && !deleteFeedbackMutation.isPending) handleCloseSheet(); }}
      >
        <SheetContent 
          side="right" 
          bounce="right" 
          withGap={true} 
          className={`w-full flex flex-col p-0 ${
            params.type === 'details' 
              ? 'sm:w-3/4 md:w-1/2 lg:w-[40%]' 
              : 'sm:w-3/4 md:w-1/2 lg:w-[55%]'
          }`}
        >
          <SheetHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle>
                {params.type === 'details' ? 'Feedback Details' : 'Edit Feedback'}
              </SheetTitle>
              {params.type === 'edit' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-none border-destructive text-destructive hover:bg-destructive/10 mr-7 hover:text-destructive"
                  onClick={handleDeleteFromSheet}
                  disabled={deleteFeedbackMutation.isPending}
                >
                  {deleteFeedbackMutation.isPending ? (
                    <Bubbles className="h-4 w-4 mr-2 animate-spin [animation-duration:0.5s]" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Feedback
                </Button>
              )}
                {params.feedbackId && params.type === 'details' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-none border-destructive text-destructive hover:bg-destructive/10 mr-7 hover:text-destructive"
                    onClick={handleDeleteFromSheet}
                    disabled={deleteFeedbackMutation.isPending}
                  >
                    {deleteFeedbackMutation.isPending ? (
                      <Bubbles className="h-4 w-4 mr-2 animate-spin [animation-duration:0.5s]" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Feedback
                  </Button>
                )}
            </div>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            <div >
              {params.feedbackId && feedbackBeingEdited && (
                params.type === 'details' ? (
                  <FeedbackSheet feedback={feedbackBeingEdited} />
                ) : (
                  <></>
                )
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
        {isHydrated ? (
          <>
            {shouldShowEmptyState ? (
              // Empty state - no feedbacks exist
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Scroll className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No feedback forms yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Get started by creating your first feedback form. You can collect customer insights, 
                  gather project feedback, and improve your services based on responses.
                </p>
                <Button onClick={() => router.push('/protected/feedback/create')}>
                  Create your first feedback form
                </Button>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              // No results from search/filters
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Scroll className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  No results for '{params.query || 'your search'}'. Try searching for feedback forms by name, recipient, or status.
                </p>
                <Button variant="outline" onClick={handleClearAllFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              // Show feedback table
              <>
                <ScrollArea className='w-full'>
                  <div className="min-w-[1100px]">
                    <DataTable 
                      table={table} 
                      onFeedbackSelect={handleFeedbackSelect} 
                      searchQuery={searchQuery}
                    />
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
                <Pagination
                  currentPage={table.getState().pagination.pageIndex + 1}
                  totalPages={table.getPageCount()}
                  pageSize={table.getState().pagination.pageSize}
                  totalItems={table.getFilteredRowModel().rows.length}
                  onPageChange={page => table.setPageIndex(page - 1)}
                  onPageSizeChange={size => table.setPageSize(size)}
                  itemName="feedbacks"
                />
              </>
            )}
          </>
        ) : (
          <ProjectClientSkeleton />
        )}
        {/* <Suspense fallback={<ProjectClientSkeleton />}>
          <DataTable 
            table={table} 
            onFeedbackSelect={handleFeedbackSelect} 
            searchQuery={searchQuery}
          />
    
        </Suspense> */}
      </div>
      
      {selectedFeedbacks.length > 0 && <ExportBar />}
    </div>
  )
}