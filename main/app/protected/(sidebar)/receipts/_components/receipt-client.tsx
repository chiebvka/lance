"use client"

import React, { useMemo, useRef, useState, useEffect, Suspense } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
} from "@tanstack/react-table";
import CreateSearchFilter, { DropdownOption } from "@/components/general/create-search-filter"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent,SheetClose, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { ScrollArea } from '@/components/ui/scroll-area';
import { columns, Receipt } from "./columns"
import ReceiptForm from './receipt-form'
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
import ConfirmModal from '@/components/modal/confirm-modal'
import { toast } from 'sonner'
import { z } from 'zod';
import { useReceipts } from '@/hooks/receipts/use-receipts';
import Pagination from '@/components/pagination'
import { createClient } from '@/utils/supabase/client'
import { currencies, type Currency } from '@/data/currency'
import { ReceiptFormRef } from './receipt-form'
import { DataTable } from './data-table'
import ProjectClientSkeleton from '../../projects/_components/project-client-skeleton'
// import CardAnalytics from './card-analytics'
import ReceiptDetailsSheet from './receipt-details-sheet'
import EditReceipt, { EditReceiptRef } from './edit-receipt'
import { generateReceiptPDFBlob, type ReceiptPDFData } from '@/utils/receipt-pdf'
import JSZip from 'jszip'


interface Props  {
  initialReceipts: Receipt[]
}

export default function ReceiptClient({ initialReceipts }: Props) {
  const queryClient = useQueryClient();
  const closeRef = useRef<HTMLButtonElement>(null);
  const editCloseRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [filterTags, setFilterTags] = useState<FilterTag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isCreatingReceipt, setIsCreatingReceipt] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Layout options state
  const [layoutOptions, setLayoutOptions] = useState({
    hasTax: true,
    hasVat: true,
    hasDiscount: true,
  });

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    currencies.find(c => c.code === 'CAD')!
  )

  // Create a ref to the form component to call its methods
  const formRef = useRef<ReceiptFormRef>(null);
  // Create a ref to the edit component to call its methods
  const editFormRef = useRef<EditReceiptRef>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeFilters, setActiveFilters] = useState<{
    state: string[];
    creationMethod: string[];
    issueDate?: DateRange;
    paymentDate?: DateRange;
  }>({
    state: [],
    creationMethod: [],
    issueDate: undefined,
    paymentDate: undefined,
  });

  const { 
    data: receipts = [], 
    isLoading, 
    isError, 
    error 
  } = useReceipts();

  // --- Table State ---
  const [rowSelection, setRowSelection] = useState({})
  
  // Fix hydration issue: Initialize with server-safe default state
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    // Use default columns for SSR to prevent hydration mismatch
    const defaultColumns = getDefaultColumns('receipts');
    const allColumns = ['receiptNumber', 'creationMethod', 'totalAmount', 'state', 'issueDate', 'paymentConfirmedAt', 'taxRate', 'vatRate'];
    
    const state: VisibilityState = {};
    for (const col of allColumns) {
      state[col] = defaultColumns.includes(col);
    }
    
    return state;
  });

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Single comprehensive useEffect to handle all initialization
  useEffect(() => {
    // Mark as hydrated
    setIsHydrated(true);

    // Extract URL parameters
    const query = searchParams.get('query') || '';
    const receiptId = searchParams.get('receiptId');
    const sheetType = searchParams.get('type') || 'details'; // Default to details
    const stateFilters = searchParams.getAll('state');
    const creationFilters = searchParams.getAll('creationMethod');
    const issueDateFrom = searchParams.get('issueDateFrom');
    const issueDateTo = searchParams.get('issueDateTo');
    const paymentDateFrom = searchParams.get('paymentDateFrom');
    const paymentDateTo = searchParams.get('paymentDateTo');

    // Update state from URL
    setSearchQuery(query);
    setSelectedReceiptId(receiptId);

    // Build date ranges
    let issueDateRange: DateRange | undefined = undefined;
    if (issueDateFrom) {
      issueDateRange = { from: parseISO(issueDateFrom) };
      if (issueDateTo) {
        issueDateRange.to = parseISO(issueDateTo);
      }
    }

    let paymentDateRange: DateRange | undefined = undefined;
    if (paymentDateFrom) {
      paymentDateRange = { from: parseISO(paymentDateFrom) };
      if (paymentDateTo) {
        paymentDateRange.to = parseISO(paymentDateTo);
      }
    }

    // Update active filters
    setActiveFilters({
      state: stateFilters,
      creationMethod: creationFilters,
      issueDate: issueDateRange,
      paymentDate: paymentDateRange,
    });

    // Build filter tags array
    const tags: FilterTag[] = [];

    if (issueDateRange?.from) {
      let label = format(issueDateRange.from, 'PPP');
      if (issueDateRange.to) {
        label = `${format(issueDateRange.from, 'PPP')} - ${format(issueDateRange.to, 'PPP')}`;
      }
      tags.push({ key: 'issue-date-range', label: 'Issue Date', value: label });
    }

    if (paymentDateRange?.from) {
      let label = format(paymentDateRange.from, 'PPP');
      if (paymentDateRange.to) {
        label = `${format(paymentDateRange.from, 'PPP')} - ${format(paymentDateRange.to, 'PPP')}`;
      }
      tags.push({ key: 'payment-date-range', label: 'Payment Date', value: label });
    }

    stateFilters.forEach(value => {
      tags.push({ 
        key: `state-${value}`, 
        label: 'State', 
        value: value.charAt(0).toUpperCase() + value.slice(1) 
      });
    });

    creationFilters.forEach(value => {
      tags.push({
        key: `creationMethod-${value}`,
        label: 'Creation',
        value: value.charAt(0).toUpperCase() + value.slice(1),
      })
    })

    setFilterTags(tags);

    // Load saved column visibility after hydration
    if (typeof window !== 'undefined') {
      const savedColumns = getTableColumnsWithDefaults('receipts');
      const allColumns = ['receiptNumber', 'creationMethod', 'totalAmount', 'state', 'issueDate', 'paymentConfirmedAt', 'taxRate', 'vatRate'];
      
      const newState: VisibilityState = {};
      for (const col of allColumns) {
        newState[col] = savedColumns.includes(col);
      }
      
      setColumnVisibility(newState);
    }
  }, [searchParams]);

  // Persist column visibility to cookie on change (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      const visibleCols = Object.entries(columnVisibility)
        .filter(([_, v]) => v)
        .map(([k]) => k);
      setTableColumns('receipts', visibleCols);
    }
  }, [columnVisibility, isHydrated]);

  const filteredReceipts = useMemo(() => {
    let filtered = [...receipts];

    // Apply search query - search in receipt number, customer name
    if (searchQuery) {
      filtered = filtered.filter(receipt => 
        receipt.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.recepientName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply issue date filter
    if (activeFilters.issueDate?.from) {
      filtered = filtered.filter(receipt => {
        if (!receipt.issueDate || !activeFilters.issueDate?.from) return false;
        const rDate = new Date(receipt.issueDate);
        if (isNaN(rDate.getTime())) return false; // Invalid date

        if (activeFilters.issueDate.to) {
          // Range selected
          return isWithinInterval(rDate, { start: activeFilters.issueDate.from, end: activeFilters.issueDate.to });
        }
        // Single date selected
        return isSameDay(rDate, activeFilters.issueDate.from);
      });
    }

    // Apply payment date filter
    if (activeFilters.paymentDate?.from) {
      filtered = filtered.filter(receipt => {
        if (!receipt.paymentConfirmedAt || !activeFilters.paymentDate?.from) return false;
        const pDate = new Date(receipt.paymentConfirmedAt);
        if (isNaN(pDate.getTime())) return false; // Invalid date

        if (activeFilters.paymentDate.to) {
          // Range selected
          return isWithinInterval(pDate, { start: activeFilters.paymentDate.from, end: activeFilters.paymentDate.to });
        }
        // Single date selected
        return isSameDay(pDate, activeFilters.paymentDate.from);
      });
    }

    // Apply state filter
    if (activeFilters.state.length > 0) {
      filtered = filtered.filter(receipt => 
        activeFilters.state.includes(receipt.state?.trim().toLowerCase() || '')
      );
    }

    // Apply creation method filter
    if (activeFilters.creationMethod.length > 0) {
      filtered = filtered.filter(receipt =>
        activeFilters.creationMethod.includes(receipt.creationMethod?.trim().toLowerCase() || '')
      );
    }

    return filtered;
  }, [receipts, searchQuery, activeFilters]);

  const receiptBeingEdited = useMemo(() => {
    return receipts.find(i => i.id === selectedReceiptId)
  }, [receipts, selectedReceiptId])

  const deleteReceiptMutation = useMutation({
    mutationFn: async (receiptId: string) => {
      return axios.delete(`/api/receipts/${receiptId}`);
    },
    onSuccess: () => {
      toast.success("Receipt deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.delete('receiptId');
      const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
      router.replace(newUrl);
    },
    onError: (error: any) => {
      console.error("Delete receipt error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to delete receipt";
      toast.error(errorMessage);
    },
  });

  const table = useReactTable({
    data: filteredReceipts,
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
  });

  const selectedReceipts = useMemo(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selected = selectedRows.map(row => row.original);
    return selected as Receipt[];
  }, [table, rowSelection]);

  const sanitizeFilename = (name: string): string => {
    return name
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  };

  const handleExport = async () => {
    const validReceipts = selectedReceipts.filter(receipt => {
      const hasValidId = receipt.id && receipt.id.trim() !== '';
      const hasValidNumber = receipt.receiptNumber && receipt.receiptNumber.trim() !== '';
      return hasValidId || hasValidNumber;
    });

    if (validReceipts.length === 0) {
      toast.error('No valid receipts selected for export');
      return;
    }

    if (validReceipts.length !== selectedReceipts.length) {
      toast.warning(`${selectedReceipts.length - validReceipts.length} invalid receipts were skipped`);
    }

    setIsExporting(true);
    const loadingToast = toast.loading('Preparing export...');

    try {
      if (selectedReceipts.length === 1) {
        // Single receipt download
        const receipt = selectedReceipts[0] as unknown as ReceiptPDFData;
        
        const filename = (receipt as any).receiptNumber 
          ? `${(receipt as any).receiptNumber}.pdf`
          : `receipt-${(receipt as any).id}.pdf`;
        
        await generateReceiptPDFBlob(receipt).then(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
        
        toast.success("Receipt PDF downloaded successfully!", { id: loadingToast });
      } else {
        // Multiple receipts - create zip
        const zip = new JSZip();
        const processedFilenames = new Set();

        await new Promise(resolve => setTimeout(resolve, 800));

        for (let i = 0; i < selectedReceipts.length; i++) {
          const receipt = selectedReceipts[i] as unknown as ReceiptPDFData;
          const progress = Math.round(((i + 1) / selectedReceipts.length) * 100);

          toast.loading(
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1">
                <div className="font-medium text-base">
                  Processing receipt {i + 1} of {selectedReceipts.length}...
                </div>
                <div className="text-sm text-muted-foreground">
                  Working on: {(receipt as any).receiptNumber || `Receipt ${(receipt as any).id}`}
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>,
            {
              id: loadingToast,
              duration: Infinity,
              className: "w-[380px] p-4",
            }
          );

          const receiptData: ReceiptPDFData = {
            ...(receipt as any),
          };

          let baseName = (receipt as any).receiptNumber || `receipt-${(receipt as any).id}`;
          let fileName = `${sanitizeFilename(baseName)}.pdf`;

          let counter = 1;
          while (processedFilenames.has(fileName)) {
            fileName = `${sanitizeFilename(baseName)}_${counter}.pdf`;
            counter++;
          }
          processedFilenames.add(fileName);

          const pdfBlob = await generateReceiptPDFBlob(receiptData);
          zip.file(fileName, pdfBlob);

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
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: '100%' }}
                ></div>
              </div>
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
                {selectedReceipts.length} receipt PDFs ready for download
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
                link.download = `receipts-export-${new Date().toISOString().split('T')[0]}.zip`;
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
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export receipts', {
        id: loadingToast,
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        className: "w-[380px] p-4",
      });
        } finally {
      setIsExporting(false);
    }
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
    params.delete('state');
    params.delete('issueDateFrom');
    params.delete('issueDateTo');
    params.delete('paymentDateFrom');
    params.delete('paymentDateTo');
    params.delete('creationMethod');

    // Add new filter params
    if (newFilters.issueDate?.from) {
      params.append('issueDateFrom', newFilters.issueDate.from.toISOString());
      if (newFilters.issueDate.to) {
        params.append('issueDateTo', newFilters.issueDate.to.toISOString());
      }
    }
    if (newFilters.paymentDate?.from) {
      params.append('paymentDateFrom', newFilters.paymentDate.from.toISOString());
      if (newFilters.paymentDate.to) {
        params.append('paymentDateTo', newFilters.paymentDate.to.toISOString());
      }
    }
    newFilters.state.forEach(value => params.append('state', value));
    newFilters.creationMethod.forEach(value => params.append('creationMethod', value));

    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    updateURL(activeFilters, value);
  };

  const handleIssueDateChange = (date: DateRange | undefined) => {
    const newFilters = { ...activeFilters, issueDate: date };
    setActiveFilters(newFilters);
    updateURL(newFilters);
    updateFilterTags('issue-date', date, !!date);
  }

  const handlePaymentDateChange = (date: DateRange | undefined) => {
    const newFilters = { ...activeFilters, paymentDate: date };
    setActiveFilters(newFilters);
    updateURL(newFilters);
    updateFilterTags('payment-date', date, !!date);
  }

  const handleFilterChange = (filterType: 'state' | 'creationMethod', value: string, checked: boolean) => {
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

  const updateFilterTags = (filterType: 'state' | 'creationMethod' | 'issue-date' | 'payment-date', value: string | DateRange | undefined, checked: boolean) => {
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
      
      if (filterType === 'payment-date') {
        const existingTagIndex = prev.findIndex(tag => tag.key === 'payment-date-range');
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
        if (filterType === 'creationMethod') label = 'Creation';
        
        let displayValue = value.charAt(0).toUpperCase() + value.slice(1);
        
        return [...prev, { key, label, value: displayValue }];
      } else {
        return prev.filter(tag => tag.key !== key);
      }
    });
  };

  const handleRemoveFilter = (key: string) => {
    if (key === 'issue-date-range') {
      handleIssueDateChange(undefined);
      return;
    }
    if (key === 'payment-date-range') {
      handlePaymentDateChange(undefined);
      return;
    }
    const [filterType, value] = key.split('-') as ['state', string];
    handleFilterChange(filterType, value, false);
  };

  const handleClearAllFilters = () => {
    setActiveFilters({ state: [], creationMethod: [], issueDate: undefined, paymentDate: undefined });
    setFilterTags([]);
    updateURL({ state: [], creationMethod: [], issueDate: undefined, paymentDate: undefined });
  };

  const handleReceiptSelect = (receiptId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('receiptId', receiptId);
    params.set('type', 'details'); // Default to details view
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreateSuccess = () => {
    closeRef.current?.click();
    // Remove createReceipt param
    const params = new URLSearchParams(searchParams);
    params.delete('createReceipt');
    router.replace(`${pathname}?${params.toString()}`);
    queryClient.invalidateQueries({ queryKey: ['receipts'] });
  };

  const handleEditSuccess = () => {
    editCloseRef.current?.click();
    setSelectedReceiptId(null);
    // Remove receiptId and type params
    const params = new URLSearchParams(searchParams);
    params.delete('receiptId');
    params.delete('type');
    router.replace(`${pathname}?${params.toString()}`);
    queryClient.invalidateQueries({ queryKey: ['receipts'] });
  };

  const handleSaveDraftClick = () => {
    if (formRef.current) {
      formRef.current.handleSubmit(false);
    }
  };

  const handleCreateReceiptClick = (emailToCustomer = false) => {
    if (formRef.current) {
      formRef.current.handleSubmit(emailToCustomer);
    }
  };

  // Edit-specific handlers
  const handleEditSaveDraftClick = () => {
    if (editFormRef.current) {
      editFormRef.current.handleSubmit(false);
    }
  };

  const handleEditReceiptClick = (emailToCustomer = false) => {
    if (editFormRef.current) {
      editFormRef.current.handleSubmit(emailToCustomer);
    }
  };

  const handleLayoutOptionChange = (key: string, value: boolean) => {
    // Handle submenu items (hasTax_yes, hasTax_no, etc.)
    if (key.includes('_')) {
      const [option, state] = key.split('_')
      if (state === 'yes') {
        setLayoutOptions(prev => ({ ...prev, [option]: true }))
      } else if (state === 'no') {
        setLayoutOptions(prev => ({ ...prev, [option]: false }))
      }
    } else {
      // Handle direct checkbox items
      setLayoutOptions(prev => ({ ...prev, [key]: value }))
    }
  };

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode)
    if (currency) {
      setSelectedCurrency(currency)
    }
  };

  const handleCloseSheet = () => {
    router.push("/protected/receipts");
    setSelectedReceiptId(null);
  };

  const handleCreateCancel = () => {
    closeRef.current?.click();
    const params = new URLSearchParams(searchParams);
    params.delete('createReceipt');
    router.replace(`${pathname}?${params.toString()}`);
  }

  const handleDeleteFromSheet = () => {
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedReceiptId) {
      deleteReceiptMutation.mutate(selectedReceiptId)
    }
    setDeleteModalOpen(false)
  }

  const handleCustomerChange = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const handleSavingChange = (saving: boolean, action: 'draft' | 'receipt' = 'draft') => {
    if (action === 'draft') {
      setIsSavingDraft(saving);
    } else {
      setIsCreatingReceipt(saving);
    }
    setIsSaving(saving); // Keep the general state for backward compatibility
  };

  // Use the receipts hook
  const { data: userEmail } = useQuery({
    queryKey: ['userEmail'],
    queryFn: async () => {
      const supabase = createClient()
      
      try {
        // First try to get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) return null

        // Try to get user profile email first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('profile_id', user.id)
          .single()

        if (profile?.email) {
          return profile.email
        }

        // If no profile email, try to get organization email from profiles table
        const { data: orgProfile, error: orgProfileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('profile_id', user.id)
          .single()

        if (orgProfile?.email) {
          return orgProfile.email
        }

        return null
      } catch (error) {
        console.error('Error fetching user email:', error)
        return null
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Define dropdown options for receipt layout
  const receiptDropdownOptions: DropdownOption[] = [
    {
      key: 'hasTax',
      label: 'Add sales tax',
      type: 'submenu',
      checked: layoutOptions.hasTax,
      subItems: [
        {
          key: 'hasTax_yes',
          label: 'Yes',
          type: 'checkbox',
          checked: layoutOptions.hasTax
        },
        {
          key: 'hasTax_no',
          label: 'No',
          type: 'checkbox',
          checked: !layoutOptions.hasTax
        }
      ]
    },
    {
      key: 'hasVat',
      label: 'Add VAT',
      type: 'submenu',
      checked: layoutOptions.hasVat,
      subItems: [
        {
          key: 'hasVat_yes',
          label: 'Yes',
          type: 'checkbox',
          checked: layoutOptions.hasVat
        },
        {
          key: 'hasVat_no',
          label: 'No',
          type: 'checkbox',
          checked: !layoutOptions.hasVat
        }
      ]
    },
    {
      key: 'hasDiscount',
      label: 'Add discount',
      type: 'submenu',
      checked: layoutOptions.hasDiscount,
      subItems: [
        {
          key: 'hasDiscount_yes',
          label: 'Yes',
          type: 'checkbox',
          checked: layoutOptions.hasDiscount
        },
        {
          key: 'hasDiscount_no',
          label: 'No',
          type: 'checkbox',
          checked: !layoutOptions.hasDiscount
        }
      ]
    }
  ]

  const footer = (
    <>
      <SheetClose asChild>
        <Button variant="ghost" ref={closeRef}>Cancel</Button>
      </SheetClose>
      <Button 
        variant="outlinebrimary" 
        className="px-3 sm:px-4"
        onClick={handleSaveDraftClick}
        disabled={isSavingDraft || isCreatingReceipt}
      >
        <Save className="h-4 w-4 mr-2" />
        {isSavingDraft ?  (
              <>
                <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                Saving...
              </>
            ) : "Save Draft"}
      </Button>

      <div className="inline-flex rounded-md shadow-sm">
        <Button
          onClick={() => handleCreateReceiptClick(false)}
          disabled={isSavingDraft || isCreatingReceipt}
          className="rounded-r-none px-3 sm:px-4"
        >
          {isCreatingReceipt ? (
              <>
                <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                Creating...
              </>
            ) : "Create Receipt"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={isSavingDraft || isCreatingReceipt}
              className="rounded-l-none border-l border-purple-700 px-3"
            >
              <span className="sr-only">Open options</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleCreateReceiptClick(false)}>Create Receipt</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCreateReceiptClick(true)}
              disabled={!selectedCustomer}
            >
              Create & Email to Customer
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
      <Button variant="outlinebrimary" onClick={handleEditSaveDraftClick} disabled={isSaving} className="px-3 sm:px-4">
        <Save className="h-4 w-4 mr-2" />
        {isSaving ?  (
              <>
                <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                Saving...
              </>
            ) : "Save Changes"}
      </Button>

      <div className="inline-flex rounded-md shadow-sm">
        <Button
          onClick={() => handleEditReceiptClick(false)}
          disabled={isSavingDraft || isCreatingReceipt}
          className="rounded-r-none px-3 sm:px-4"
        >
          {isCreatingReceipt ? (
              <>
                <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                Updating...
              </>
            ) : "Update Receipt"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={isSavingDraft || isCreatingReceipt}
              className="rounded-l-none border-l border-purple-700 px-3"
            >
              <span className="sr-only">Open options</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditReceiptClick(false)}>Update Receipt</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleEditReceiptClick(true)}
              disabled={!receiptBeingEdited?.customerId}
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
            defaultMonth={activeFilters.paymentDate?.from}
            selected={activeFilters.paymentDate}
            onSelect={handlePaymentDateChange}
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
            checked={activeFilters.state.includes('sent')}
            onCheckedChange={(checked: boolean) => handleFilterChange('state', 'sent', checked)}
          >
            Sent
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.state.includes('settled')}
            onCheckedChange={(checked: boolean) => handleFilterChange('state', 'settled', checked)}
          >
            Settled
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.state.includes('overdue')}
            onCheckedChange={(checked: boolean) => handleFilterChange('state', 'overdue', checked)}
          >
            Overdue
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.state.includes('unassigned')}
            onCheckedChange={(checked: boolean) => handleFilterChange('state', 'unassigned', checked)}
          >
            Unassigned
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

      {/* Creation Method Filter */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Creation Method</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuCheckboxItem
            checked={activeFilters.creationMethod.includes('manual')}
            onCheckedChange={(checked: boolean) => handleFilterChange('creationMethod', 'manual', checked)}
          >
            Manual
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.creationMethod.includes('auto')}
            onCheckedChange={(checked: boolean) => handleFilterChange('creationMethod', 'auto', checked)}
          >
            Auto
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.creationMethod.includes('invoice')}
            onCheckedChange={(checked: boolean) => handleFilterChange('creationMethod', 'invoice', checked)}
          >
            Invoice
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </div>
  );

  // Define ExportBar component
  const ExportBar = () => {
    const handleExportClick = () => {
      handleExport();
    };
    
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 border bg-foreground/10 shadow-lg flex items-center justify-between space-x-3 px-8 py-4 z-70 min-w-[300px]">
        <div>
          <span className="font-medium">{selectedReceipts.length} selected</span>
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
            disabled={isExporting || selectedReceipts.length === 0}
            onClick={handleExportClick}
          >
            {isExporting ? "Preparing..." : "Export"}
          </Button>
        </div>
      </div>
    );
  };

  if (isError) {
    return <div className="p-8">Error fetching receipts: {(error as Error).message}</div>;
  }

  // Get the sheet type from URL
  const sheetType = searchParams.get('type') || 'details';

    // Update layout options when editing an invoice to reflect database values
    useEffect(() => {
      if (receiptBeingEdited && sheetType === 'edit') {
        setLayoutOptions({
          hasTax: receiptBeingEdited.hasTax ?? true,
          hasVat: receiptBeingEdited.hasVat ?? true,
          hasDiscount: receiptBeingEdited.hasDiscount ?? true,
        });
      }
    }, [receiptBeingEdited, sheetType]);

  return (
    <>
      <CreateSearchFilter 
        placeholder="Search receipts..." 
        onSearch={handleSearch}
        filterContent={filterContent}
        filterTags={filterTags}
        layoutOptions={layoutOptions}
        onLayoutOptionChange={handleLayoutOptionChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        sheetTriggerText="Create Receipt"
        sheetTitle="New Receipt"
        sheetContent={
          <ReceiptForm 
            userEmail={userEmail} 
            layoutOptions={layoutOptions}
            onLayoutOptionChange={handleLayoutOptionChange}
            selectedCurrency={selectedCurrency}
            onCurrencyChange={handleCurrencyChange}
            onSuccess={handleCreateSuccess}
            onLoadingChange={handleSavingChange}
            onCancel={handleCreateCancel}
            onCustomerChange={handleCustomerChange}
            onSavingChange={handleSavingChange}
            ref={formRef}
          />
        }
        sheetContentClassName='w-full sm:w-3/4 md:w-1/2 lg:w-[55%]'
        footer={footer}
        closeRef={closeRef}
        sheetHeaderIcon={<LayoutTemplate className="h-4 w-4" />}
        sheetHeaderDropdownOptions={receiptDropdownOptions}
        onDropdownOptionChange={handleLayoutOptionChange}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={receiptBeingEdited?.receiptNumber || "this receipt"}
        itemType="Receipt"
        isLoading={deleteReceiptMutation.isPending}
      />

      {/* Receipt Sheets */}
      <Sheet open={!!selectedReceiptId} onOpenChange={open => { if (!open) handleCloseSheet(); }}>
        <SheetContent 
          side="right" 
          bounce="right" 
          withGap={true} 
          className={`w-full flex flex-col p-0 ${
            sheetType === 'details' 
              ? 'sm:w-3/4 md:w-1/2 lg:w-[40%]' 
              : 'sm:w-3/4 md:w-1/2 lg:w-[55%]'
          }`}
        >
          <SheetHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle>
                {sheetType === 'details' ? 'Receipt Details' : 'Edit Receipt'}
              </SheetTitle>
              <div className="flex items-center fixed right-20 gap-2">
                {sheetType === 'edit' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none">
                        <LayoutTemplate className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56"  onCloseAutoFocus={(e) => e.preventDefault()}>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Add sales tax</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuCheckboxItem
                            checked={layoutOptions.hasTax}
                            onCheckedChange={(checked: boolean) => {
                              setLayoutOptions(prev => ({ ...prev, hasTax: !!checked }));
                              editFormRef.current?.setLayoutOption?.('hasTax', !!checked);
                            }}
                          >
                            Yes
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={!layoutOptions.hasTax}
                            onCheckedChange={(checked: boolean) => {
                              setLayoutOptions(prev => ({ ...prev, hasTax: !checked }));
                              editFormRef.current?.setLayoutOption?.('hasTax', !checked);
                            }}
                          >
                            No
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Add VAT</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuCheckboxItem
                            checked={layoutOptions.hasVat}
                            onCheckedChange={(checked: boolean) => {
                              setLayoutOptions(prev => ({ ...prev, hasVat: !!checked }));
                              editFormRef.current?.setLayoutOption?.('hasVat', !!checked);
                            }}
                          >
                            Yes
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={!layoutOptions.hasVat}
                            onCheckedChange={(checked: boolean) => {
                              setLayoutOptions(prev => ({ ...prev, hasVat: !checked }));
                              editFormRef.current?.setLayoutOption?.('hasVat', !checked);
                            }}
                          >
                            No
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Add discount</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuCheckboxItem
                            checked={layoutOptions.hasDiscount}
                            onCheckedChange={(checked: boolean) => {
                              setLayoutOptions(prev => ({ ...prev, hasDiscount: !!checked }));
                              editFormRef.current?.setLayoutOption?.('hasDiscount', !!checked);
                            }}
                          >
                            Yes
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={!layoutOptions.hasDiscount}
                            onCheckedChange={(checked: boolean) => {
                              setLayoutOptions(prev => ({ ...prev, hasDiscount: !checked }));
                              editFormRef.current?.setLayoutOption?.('hasDiscount', !checked);
                            }}
                          >
                            No
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {selectedReceiptId && sheetType === 'details' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-none border-destructive text-destructive hover:bg-destructive/10 mr-7 hover:text-destructive"
                    onClick={handleDeleteFromSheet}
                    disabled={deleteReceiptMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Receipt
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            {selectedReceiptId && receiptBeingEdited && (
              sheetType === 'details' ? (
                <ReceiptDetailsSheet receipt={receiptBeingEdited} />
              ) : (
                <EditReceipt 
                  ref={editFormRef}
                  receiptId={receiptBeingEdited.id}
                  userEmail={userEmail}
                  onSuccess={handleEditSuccess}
                  onCancel={handleCloseSheet}
                />
              )
            )}
          </ScrollArea>
          {sheetType === 'edit' && (
            <SheetFooter className="p-4 border-t">
              {editFooter}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <DataTableViewOptions table={table} />
        </div>
        <Suspense fallback={<ProjectClientSkeleton />}>
          <DataTable 
            table={table} 
            onInvoiceSelect={handleReceiptSelect} 
            searchQuery={searchQuery}
          />
        </Suspense>
      </div>

      {/* Export Bar */}
      {selectedReceipts.length > 0 && <ExportBar />}
    </>
  )
}