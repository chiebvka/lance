"use client"

import React, { useMemo, useRef, useState, useEffect, Suspense } from 'react'
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
import CreateSearchFilter, { DropdownOption } from "@/components/general/create-search-filter"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent,SheetClose, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { ScrollArea } from '@/components/ui/scroll-area'
import { columns, Invoice } from "./columns"
import InvoiceForm from './invoice-form';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DataTableViewOptions } from './data-table-view-options'
import { Calendar } from '@/components/ui/calendar'

import { getTableColumns, setTableColumns, getTableColumnsWithDefaults, getDefaultColumns } from '@/cookie-persist/tableColumns';
import ConfirmModal from '@/components/modal/confirm-modal'
import { toast } from 'sonner'
import { z } from 'zod'

import { useInvoices } from '@/hooks/invoices/use-invoices'
import Pagination from '@/components/pagination'
import { createClient } from '@/utils/supabase/client'
import { currencies, type Currency } from '@/data/currency'
import { InvoiceFormRef } from './invoice-form'
import { DataTable } from './data-table'
import ProjectClientSkeleton from '../../projects/_components/project-client-skeleton'
import CardAnalytics from './card-analytics'
import InvoiceDetailsSheet from './invoice-details-sheet'
import EditInvoice, { EditInvoiceRef } from './edit-invoice'
import { generateInvoicePDFBlob, type InvoicePDFData } from '@/utils/invoice-pdf'
import JSZip from 'jszip'

interface Props {
  initialInvoices: Invoice[]
}

export default function InvoiceClient({ initialInvoices }: Props) {
  const queryClient = useQueryClient();
  const closeRef = useRef<HTMLButtonElement>(null);
  const editCloseRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [filterTags, setFilterTags] = useState<FilterTag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Layout options state
  const [layoutOptions, setLayoutOptions] = useState({
    hasTax: true,
    hasVat: true,
    hasDiscount: true,
  });

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies.find(c => c.code === 'CAD')!)
  
  // Create a ref to the form component to call its methods
  const formRef = useRef<InvoiceFormRef>(null);
  // Create a ref to the edit component to call its methods
  const editFormRef = useRef<EditInvoiceRef>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeFilters, setActiveFilters] = useState<{
    state: string[];
    issueDate?: DateRange;
    dueDate?: DateRange;
  }>({
    state: [],
    issueDate: undefined,
    dueDate: undefined,
  });

  const { 
    data: invoices = [], 
    isLoading, 
    isError, 
    error 
  } = useInvoices(initialInvoices);

  // --- Table State ---
  const [rowSelection, setRowSelection] = useState({})
  
  // Fix hydration issue: Initialize with server-safe default state
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    // Use default columns for SSR to prevent hydration mismatch
    const defaultColumns = getDefaultColumns('invoices');
    const allColumns = ['invoiceNumber', 'recepientName', 'totalAmount', 'state', 'issueDate', 'dueDate', 'taxRate', 'vatRate'];
    
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
    const invoiceId = searchParams.get('invoiceId');
    const sheetType = searchParams.get('type') || 'details'; // Default to details
    const stateFilters = searchParams.getAll('state');
    const issueDateFrom = searchParams.get('issueDateFrom');
    const issueDateTo = searchParams.get('issueDateTo');
    const dueDateFrom = searchParams.get('dueDateFrom');
    const dueDateTo = searchParams.get('dueDateTo');

    // Update state from URL
    setSearchQuery(query);
    setSelectedInvoiceId(invoiceId);

    // Build date ranges
    let issueDateRange: DateRange | undefined = undefined;
    if (issueDateFrom) {
      issueDateRange = { from: parseISO(issueDateFrom) };
      if (issueDateTo) {
        issueDateRange.to = parseISO(issueDateTo);
      }
    }

    let dueDateRange: DateRange | undefined = undefined;
    if (dueDateFrom) {
      dueDateRange = { from: parseISO(dueDateFrom) };
      if (dueDateTo) {
        dueDateRange.to = parseISO(dueDateTo);
      }
    }

    // Update active filters
    setActiveFilters({
      state: stateFilters,
      issueDate: issueDateRange,
      dueDate: dueDateRange,
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

    if (dueDateRange?.from) {
      let label = format(dueDateRange.from, 'PPP');
      if (dueDateRange.to) {
        label = `${format(dueDateRange.from, 'PPP')} - ${format(dueDateRange.to, 'PPP')}`;
      }
      tags.push({ key: 'due-date-range', label: 'Due Date', value: label });
    }

    stateFilters.forEach(value => {
      tags.push({ 
        key: `state-${value}`, 
        label: 'State', 
        value: value.charAt(0).toUpperCase() + value.slice(1) 
      });
    });

    setFilterTags(tags);

    // Load saved column visibility after hydration
    if (typeof window !== 'undefined') {
      const savedColumns = getTableColumnsWithDefaults('invoices');
      const allColumns = ['invoiceNumber', 'recepientName', 'totalAmount', 'state', 'issueDate', 'dueDate', 'taxRate', 'vatRate'];
      
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
      setTableColumns('invoices', visibleCols);
    }
  }, [columnVisibility, isHydrated]);

  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Apply search query - search in invoice number, customer name
    if (searchQuery) {
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.recepientName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply issue date filter
    if (activeFilters.issueDate?.from) {
      filtered = filtered.filter(invoice => {
        if (!invoice.issueDate || !activeFilters.issueDate?.from) return false;
        const invoiceDate = new Date(invoice.issueDate);
        if (isNaN(invoiceDate.getTime())) return false; // Invalid date

        if (activeFilters.issueDate.to) {
          // Range selected
          return isWithinInterval(invoiceDate, { start: activeFilters.issueDate.from, end: activeFilters.issueDate.to });
        }
        // Single date selected
        return isSameDay(invoiceDate, activeFilters.issueDate.from);
      });
    }

    // Apply due date filter
    if (activeFilters.dueDate?.from) {
      filtered = filtered.filter(invoice => {
        if (!invoice.dueDate || !activeFilters.dueDate?.from) return false;
        const invoiceDate = new Date(invoice.dueDate);
        if (isNaN(invoiceDate.getTime())) return false; // Invalid date

        if (activeFilters.dueDate.to) {
          // Range selected
          return isWithinInterval(invoiceDate, { start: activeFilters.dueDate.from, end: activeFilters.dueDate.to });
        }
        // Single date selected
        return isSameDay(invoiceDate, activeFilters.dueDate.from);
      });
    }

    // Apply state filter
    if (activeFilters.state.length > 0) {
      filtered = filtered.filter(invoice => 
        activeFilters.state.includes(invoice.state?.trim().toLowerCase() || '')
      );
    }

    return filtered;
  }, [invoices, searchQuery, activeFilters]);

  const invoiceBeingEdited = useMemo(() => {
    return invoices.find(i => i.id === selectedInvoiceId)
  }, [invoices, selectedInvoiceId])

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return axios.delete(`/api/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      toast.success("Invoice deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.delete('invoiceId');
      const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
      router.replace(newUrl);
    },
    onError: (error: any) => {
      console.error("Delete invoice error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to delete invoice";
      toast.error(errorMessage);
    },
  });

  const table = useReactTable({
    data: filteredInvoices,
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

  const selectedInvoices = useMemo(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selected = selectedRows.map(row => row.original);
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
    const validInvoices = selectedInvoices.filter(invoice => {
      const hasValidId = invoice.id && invoice.id.trim() !== '';
      const hasValidNumber = invoice.invoiceNumber && invoice.invoiceNumber.trim() !== '';
      return hasValidId || hasValidNumber;
    });

    if (validInvoices.length === 0) {
      toast.error('No valid invoices selected for export');
      return;
    }

    if (validInvoices.length !== selectedInvoices.length) {
      toast.warning(`${selectedInvoices.length - validInvoices.length} invalid invoices were skipped`);
    }

    setIsExporting(true);
    const loadingToast = toast.loading('Preparing export...');

    try {
      if (selectedInvoices.length === 1) {
        // Single invoice download
        const invoice = selectedInvoices[0];
        console.log('Single invoice for PDF:', invoice);
        console.log('Invoice details:', invoice.invoiceDetails);
        
        const invoiceData: InvoicePDFData = {
          ...invoice,
        };
        
        const filename = invoice.invoiceNumber 
          ? `${invoice.invoiceNumber}.pdf`
          : `invoice-${invoice.id}.pdf`;
        
        await generateInvoicePDFBlob(invoiceData).then(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
        
        toast.success("Invoice PDF downloaded successfully!", { id: loadingToast });
      } else {
        // Multiple invoices - create zip
        const zip = new JSZip();
        const processedFilenames = new Set();

        await new Promise(resolve => setTimeout(resolve, 800));

        for (let i = 0; i < selectedInvoices.length; i++) {
          const invoice = selectedInvoices[i];
          const progress = Math.round(((i + 1) / selectedInvoices.length) * 100);

          toast.loading(
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1">
                <div className="font-medium text-base">
                  Processing invoice {i + 1} of {selectedInvoices.length}...
                </div>
                <div className="text-sm text-muted-foreground">
                  Working on: {invoice.invoiceNumber || `Invoice ${invoice.id}`}
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

          console.log('Bulk invoice for PDF:', invoice);
          console.log('Invoice details:', invoice.invoiceDetails);
          
          const invoiceData: InvoicePDFData = {
            ...invoice,
          };

          let baseName = invoice.invoiceNumber || `invoice-${invoice.id}`;
          let fileName = `${sanitizeFilename(baseName)}.pdf`;

          let counter = 1;
          while (processedFilenames.has(fileName)) {
            fileName = `${sanitizeFilename(baseName)}_${counter}.pdf`;
            counter++;
          }
          processedFilenames.add(fileName);

          const pdfBlob = await generateInvoicePDFBlob(invoiceData);
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
                {selectedInvoices.length} invoice PDFs ready for download
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
                link.download = `invoices-export-${new Date().toISOString().split('T')[0]}.zip`;
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
      toast.error('Failed to export invoices', {
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
    params.delete('dueDateFrom');
    params.delete('dueDateTo');

    // Add new filter params
    if (newFilters.issueDate?.from) {
      params.append('issueDateFrom', newFilters.issueDate.from.toISOString());
      if (newFilters.issueDate.to) {
        params.append('issueDateTo', newFilters.issueDate.to.toISOString());
      }
    }
    if (newFilters.dueDate?.from) {
      params.append('dueDateFrom', newFilters.dueDate.from.toISOString());
      if (newFilters.dueDate.to) {
        params.append('dueDateTo', newFilters.dueDate.to.toISOString());
      }
    }
    newFilters.state.forEach(value => params.append('state', value));

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

  const handleDueDateChange = (date: DateRange | undefined) => {
    const newFilters = { ...activeFilters, dueDate: date };
    setActiveFilters(newFilters);
    updateURL(newFilters);
    updateFilterTags('due-date', date, !!date);
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

  const updateFilterTags = (filterType: 'state' | 'issue-date' | 'due-date', value: string | DateRange | undefined, checked: boolean) => {
    setFilterTags(prev => {
      if (filterType === 'issue-date') {
        const existingTagIndex = prev.findIndex(tag => tag.key === 'issue-date-range');
        if (checked && value && typeof value !== 'string') {
          const date = value as DateRange;
          let dateLabel = format(date.from!, "PPP");
          if (date.to) {
            dateLabel = `${format(date.from!, "PPP")} - ${format(date.to, "PPP")}`;
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
      
      if (filterType === 'due-date') {
        const existingTagIndex = prev.findIndex(tag => tag.key === 'due-date-range');
        if (checked && value && typeof value !== 'string') {
          const date = value as DateRange;
          let dateLabel = format(date.from!, "PPP");
          if (date.to) {
            dateLabel = `${format(date.from!, "PPP")} - ${format(date.to, "PPP")}`;
          }
          const newTag = { key: 'due-date-range', label: 'Due Date', value: dateLabel, className: 'w-auto' };
          if (existingTagIndex > -1) {
            const newTags = [...prev];
            newTags[existingTagIndex] = newTag;
            return newTags;
          }
          return [...prev, newTag];
        }
        return prev.filter(tag => tag.key !== 'due-date-range');
      }
      
      const key = `${filterType}-${value}`;
      if (checked && typeof value === 'string') {
        let label = '';
        if (filterType === 'state') label = 'State';
        
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
    if (key === 'due-date-range') {
      handleDueDateChange(undefined);
      return;
    }
    const [filterType, value] = key.split('-') as ['state', string];
    handleFilterChange(filterType, value, false);
  };

  const handleClearAllFilters = () => {
    setActiveFilters({ state: [], issueDate: undefined, dueDate: undefined });
    setFilterTags([]);
    updateURL({ state: [], issueDate: undefined, dueDate: undefined });
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('invoiceId', invoiceId);
    params.set('type', 'details'); // Default to details view
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreateSuccess = () => {
    closeRef.current?.click();
    // Remove createInvoice param
    const params = new URLSearchParams(searchParams);
    params.delete('createInvoice');
    router.replace(`${pathname}?${params.toString()}`);
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  };

  const handleEditSuccess = () => {
    editCloseRef.current?.click();
    setSelectedInvoiceId(null);
    // Remove invoiceId and type params
    const params = new URLSearchParams(searchParams);
    params.delete('invoiceId');
    params.delete('type');
    router.replace(`${pathname}?${params.toString()}`);
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  };

  const handleSaveDraftClick = () => {
    if (formRef.current) {
      formRef.current.handleSubmit(false);
    }
  };

  const handleCreateInvoiceClick = (emailToCustomer = false) => {
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

  const handleEditInvoiceClick = (emailToCustomer = false) => {
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

  const handlePublishInvoice = (emailToCustomer = false) => {
    // This will be handled by the form component
  };

  const handleSaveDraft = () => {
    // This will be handled by the form component
  };

  const handleCloseSheet = () => {
    router.push("/protected/invoices");
    setSelectedInvoiceId(null);
  };

  const handleCreateCancel = () => {
    closeRef.current?.click();
    const params = new URLSearchParams(searchParams);
    params.delete('createInvoice');
    router.replace(`${pathname}?${params.toString()}`);
  }

  const handleDeleteFromSheet = () => {
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedInvoiceId) {
      deleteInvoiceMutation.mutate(selectedInvoiceId)
    }
    setDeleteModalOpen(false)
  }

  const handleCustomerChange = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const handleSavingChange = (saving: boolean, action: 'draft' | 'invoice' = 'draft') => {
    if (action === 'draft') {
      setIsSavingDraft(saving);
    } else {
      setIsCreatingInvoice(saving);
    }
    setIsSaving(saving); // Keep the general state for backward compatibility
  };

  // Use the invoices hook
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

  // Define dropdown options for invoice layout
  const invoiceDropdownOptions: DropdownOption[] = [
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
        disabled={isSavingDraft || isCreatingInvoice}
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
          onClick={() => handleCreateInvoiceClick(false)}
          disabled={isSavingDraft || isCreatingInvoice}
          className="rounded-r-none px-3 sm:px-4"
        >
          {isCreatingInvoice ? (
              <>
                <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                Creating...
              </>
            ) : "Create Invoice"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={isSavingDraft || isCreatingInvoice}
              className="rounded-l-none border-l border-purple-700 px-3"
            >
              <span className="sr-only">Open options</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleCreateInvoiceClick(false)}>Create Invoice</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCreateInvoiceClick(true)}
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
          onClick={() => handleEditInvoiceClick(false)}
          disabled={isSavingDraft || isCreatingInvoice}
          className="rounded-r-none px-3 sm:px-4"
        >
          {isCreatingInvoice ? (
              <>
                <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                Updating...
              </>
            ) : "Update Invoice"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={isSavingDraft || isCreatingInvoice}
              className="rounded-l-none border-l border-purple-700 px-3"
            >
              <span className="sr-only">Open options</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditInvoiceClick(false)}>Update Invoice</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleEditInvoiceClick(true)}
              disabled={!invoiceBeingEdited?.customerId}
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
      <DropdownMenuLabel>Filter invoices</DropdownMenuLabel>
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
    </div>
  );

  // Define ExportBar component
  const ExportBar = () => {
    console.log('ExportBar rendered with', selectedInvoices.length, 'selected invoices');
    
    const handleExportClick = () => {
      handleExport();
    };
    
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 border bg-foreground/10 shadow-lg flex items-center justify-between space-x-3 px-8 py-4 z-70 min-w-[300px]">
        <div>
          <span className="font-medium">{selectedInvoices.length} selected</span>
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
            disabled={isExporting || selectedInvoices.length === 0}
            onClick={handleExportClick}
          >
            {isExporting ? "Preparing..." : "Export"}
          </Button>
        </div>
      </div>
    );
  };

  if (isError) {
    return <div className="p-8">Error fetching invoices: {(error as Error).message}</div>;
  }

  // Get the sheet type from URL
  const sheetType = searchParams.get('type') || 'details';

  // Update layout options when editing an invoice to reflect database values
  useEffect(() => {
    if (invoiceBeingEdited && sheetType === 'edit') {
      setLayoutOptions({
        hasTax: invoiceBeingEdited.hasTax ?? true,
        hasVat: invoiceBeingEdited.hasVat ?? true,
        hasDiscount: invoiceBeingEdited.hasDiscount ?? true,
      });
    }
  }, [invoiceBeingEdited, sheetType]);

  return (
    <>
      <CreateSearchFilter 
        placeholder="Search invoices..." 
        onSearch={handleSearch}
        filterContent={filterContent}
        filterTags={filterTags}
        layoutOptions={layoutOptions}
        onLayoutOptionChange={handleLayoutOptionChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        sheetTriggerText="Create Invoice"
        sheetTitle="New Invoice"
        sheetContent={
          <InvoiceForm 
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
        sheetHeaderDropdownOptions={invoiceDropdownOptions}
        onDropdownOptionChange={handleLayoutOptionChange}
      />

      <CardAnalytics />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={invoiceBeingEdited?.invoiceNumber || "this invoice"}
        itemType="Invoice"
        isLoading={deleteInvoiceMutation.isPending}
      />

      {/* Invoice Sheets */}
      <Sheet open={!!selectedInvoiceId} onOpenChange={open => { if (!open) handleCloseSheet(); }}>
        <SheetContent 
          side="right" 
          bounce="right" 
          withGap={true} 
          className={`w-full flex flex-col p-0 ${
            sheetType === 'details' 
              ? 'sm:w-3/4 md:w-1/2 lg:w-[40%]' // Same width as feedback sheet
              : 'sm:w-3/4 md:w-1/2 lg:w-[55%]' // Same width as invoice form
          } ${sheetType === 'edit' ? '[&>button[aria-label="Close"]]:hidden' : ''}`}
        >
          <SheetHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle>
                {sheetType === 'details' ? 'Invoice Details' : 'Edit Invoice'}
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

                {selectedInvoiceId && sheetType === 'details' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-none border-destructive text-destructive hover:bg-destructive/10 mr-7 hover:text-destructive"
                    onClick={handleDeleteFromSheet}
                    disabled={deleteInvoiceMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Invoice
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            {selectedInvoiceId && invoiceBeingEdited && (
              sheetType === 'details' ? (
                <InvoiceDetailsSheet invoice={invoiceBeingEdited} />
              ) : (
                <EditInvoice 
                  ref={editFormRef}
                  invoiceId={invoiceBeingEdited.id}
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
            onInvoiceSelect={handleInvoiceSelect} 
            searchQuery={searchQuery}
          />
          <Pagination
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            pageSize={table.getState().pagination.pageSize}
            totalItems={table.getFilteredRowModel().rows.length}
            onPageChange={page => table.setPageIndex(page - 1)}
            onPageSizeChange={size => table.setPageSize(size)}
            itemName="invoices"
          />
        </Suspense>
      </div>

      {/* Export Bar */}
      {selectedInvoices.length > 0 && <ExportBar />}
    </>
  )
}