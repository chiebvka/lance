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
import { columns } from "./columns"
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

import { Invoice, useInvoices } from '@/hooks/invoices/use-invoices'
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
import JSZip from 'jszip';
import { parseAsArrayOf, parseAsIsoDateTime, parseAsString, useQueryStates } from 'nuqs'; 

interface Props {
  initialInvoices: Invoice[]
  userEmail: string | null
}

export default function InvoiceClient({ initialInvoices, userEmail }: Props) {
  const queryClient = useQueryClient();
  const closeRef = useRef<HTMLButtonElement>(null);
  const editCloseRef = useRef<HTMLButtonElement>(null);
  const [filterTags, setFilterTags] = useState<FilterTag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    currencies.find(c => c.code === 'CAD')!
  )
  
  // Create a ref to the form component to call its methods
  const formRef = useRef<InvoiceFormRef>(null);
  // Create a ref to the edit component to call its methods
  const editFormRef = useRef<EditInvoiceRef>(null);

  // nuqs for URL params (replaces useSearchParams, big useEffect, updateURL)
  const [params, setParams] = useQueryStates({
    query: parseAsString.withDefault(''),
    invoiceId: parseAsString.withOptions({ clearOnDefault: true }), // null to remove
    type: parseAsString.withDefault('details'),
    state: parseAsArrayOf(parseAsString).withDefault([]),
    issueDateFrom: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    issueDateTo: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    paidOnFrom: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    paidOnTo: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    dueDateFrom: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    dueDateTo: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
  }, { history: 'push' }); // Push to URL on change

  const activeFilters = useMemo(() => ({
    state: params.state,
    issueDate: params.issueDateFrom ? { from: params.issueDateFrom, to: params.issueDateTo ?? undefined } : undefined,
    paidOn: params.paidOnFrom ? { from: params.paidOnFrom, to: params.paidOnTo ?? undefined } : undefined,
    dueDate: params.dueDateFrom ? { from: params.dueDateFrom, to: params.dueDateTo ?? undefined } : undefined,
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

    if (activeFilters.paidOn?.from) {
      let label = format(activeFilters.paidOn.from, 'PPP');
      if (activeFilters.paidOn.to) {
        label = `${format(activeFilters.paidOn.from, 'PPP')} - ${format(activeFilters.paidOn.to, 'PPP')}`;
      }
      tags.push({ key: 'payment-date-range', label: 'Payment Date', value: label });
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
    const allColumns = ['invoiceNumber', 'recepientName', 'totalAmount', 'state', 'issueDate', 'dueDate', 'paidOn', 'taxRate', 'vatRate'];
    
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
    const savedColumns = getTableColumnsWithDefaults('invoices');
    const allColumns = ['invoiceNumber', 'recepientName', 'totalAmount', 'state', 'issueDate', 'dueDate', 'paidOn', 'taxRate', 'vatRate'];
    
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
    setTableColumns('invoices', visibleCols);
  }, [columnVisibility]);

  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Apply search query
    if (params.query) {
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber?.toLowerCase().includes(params.query.toLowerCase()) ||
        invoice.recepientName?.toLowerCase().includes(params.query.toLowerCase())
      );
    }

    // Apply issue date filter
    if (activeFilters.issueDate?.from) {
      filtered = filtered.filter(invoice => {
      if (!invoice.issueDate) return false;
      const rDate = new Date(invoice.issueDate);
      if (isNaN(rDate.getTime())) return false;
     
      if (activeFilters?.issueDate?.to) {
      return isWithinInterval(rDate, { start: activeFilters?.issueDate?.from!, end: activeFilters?.issueDate?.to! });
      }
      return isSameDay(rDate, activeFilters?.issueDate?.from!);
      });
      }

    // Apply payment date filter
    if (activeFilters.paidOn?.from) {
      filtered = filtered.filter(invoice => {
        if (!invoice.paidOn) return false;
        const pDate = new Date(invoice.paidOn);
        if (isNaN(pDate.getTime())) return false;

        if (activeFilters?.paidOn?.to) {
          return isWithinInterval(pDate, { start: activeFilters?.paidOn?.from!, end: activeFilters?.paidOn?.to! });
        }
        return isSameDay(pDate, activeFilters?.paidOn?.from!);
      });
    }
    // Apply due date filter
    if (activeFilters.dueDate?.from) {
      filtered = filtered.filter(invoice => {
        if (!invoice.dueDate) return false;
        const pDate = new Date(invoice.dueDate);
        if (isNaN(pDate.getTime())) return false;

        if (activeFilters?.dueDate?.to) {
          return isWithinInterval(pDate, { start: activeFilters?.dueDate?.from!, end: activeFilters?.dueDate?.to! });
        }
        return isSameDay(pDate, activeFilters?.dueDate?.from!);
      });
    }
    // Apply state filter
    if (activeFilters.state.length > 0) {
      filtered = filtered.filter(invoice => 
        activeFilters.state.includes(invoice.state?.trim().toLowerCase() || '')
      );
    }
    
  
    return filtered;
  }, [invoices, params.query, activeFilters]);

  const invoiceBeingEdited = useMemo(() => {
    return invoices.find(i => i.id === params.invoiceId)
  }, [invoices, params.invoiceId])

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return axios.delete(`/api/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      toast.success("Invoice deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setParams({ invoiceId: null });
    },
    onError: (error: any) => {
      console.error("Delete invoice error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to delete invoice";
      toast.error(errorMessage);
    },
  });

  const table = useReactTable({
    data: filteredInvoices,
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


  const selectedInvoices = useMemo(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selected = selectedRows.map(row => row.original);
    return selected as Invoice[];
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



  const handleSearch = (value: string) => {
    setParams({ query: value || null });
  };

  const handleIssueDateChange = (date: DateRange | undefined) => {
    setParams({
      issueDateFrom: date?.from ? date.from : null,
      issueDateTo: date?.to ? date.to : null,
    });
  }

  const handlePaymentDateChange = (date: DateRange | undefined) => {
    setParams({
      paidOnFrom: date?.from ? date.from : null,
      paidOnTo: date?.to ? date.to : null,
    });
  }

  const handleDueDateChange = (date: DateRange | undefined) => {
    setParams({
      dueDateFrom: date?.from ? date.from : null,
      dueDateTo: date?.to ? date.to : null,
    });
  }

  const handleFilterChange = (filterType: 'state'  , value: string, checked: boolean) => {
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
    if (key === 'payment-date-range') {
      handlePaymentDateChange(undefined);
      return;
    }
    if (key === 'due-date-range') {
      handleDueDateChange(undefined);
      return;
    }
    const [filterType, value] = key.split('-') as ['state', string];
    handleFilterChange(filterType, value, false);
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


  const handleClearAllFilters = () => {
    setParams({
      state: null,
      issueDateFrom: null,
      issueDateTo: null,
      paidOnFrom: null,
      paidOnTo: null,
      dueDateFrom: null,
      dueDateTo: null,
    });
  };



  const handleInvoiceSelect = (invoiceId: string) => {
    setParams({ invoiceId, type: 'details' });
  };

  const handleCreateSuccess = () => {
    closeRef.current?.click();
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  };

  const handleEditSuccess = () => {
    editCloseRef.current?.click();
    setParams({ invoiceId: null });
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
    setParams({ invoiceId: null });
  };

  const handleCreateCancel = () => {
    closeRef.current?.click();
  }

  const handleDeleteFromSheet = () => {
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (params.invoiceId) {
      deleteInvoiceMutation.mutate(params.invoiceId)
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
        <DropdownMenuSubTrigger>Payment Date</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="p-0">
          <Calendar
            initialFocus
            mode="range"
            captionLayout="dropdown"
            defaultMonth={activeFilters.paidOn?.from}
            selected={activeFilters.paidOn}
            onSelect={handlePaymentDateChange}
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

      <DropdownMenuSeparator />

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

  // Update layout options when editing an invoice to reflect database values
    
  useEffect(() => {
    if (invoiceBeingEdited && params.type === 'edit') {
      setLayoutOptions({
        hasTax: invoiceBeingEdited.hasTax ?? true,
        hasVat: invoiceBeingEdited.hasVat ?? true,
        hasDiscount: invoiceBeingEdited.hasDiscount ?? true,
      });
    }
  }, [invoiceBeingEdited, params.type]);

  return (
    <>
      <CreateSearchFilter 
        placeholder="Search invoices..." 
        onSearch={handleSearch}
        filterContent={filterContent}
        filterTags={filterTagsMemo}
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
      <Sheet open={!!params.invoiceId} onOpenChange={open => { if (!open) handleCloseSheet(); }}>
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
                {params.type === 'details' ? 'Invoice Details' : 'Edit Invoice'}
              </SheetTitle>
              <div className="flex items-center fixed right-20 gap-2">
                {params.type === 'edit' && (
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

              </div>
                {params.invoiceId && params.type === 'details' && (
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
          </SheetHeader>
          <ScrollArea className="flex-grow">
            {params.invoiceId && invoiceBeingEdited && (
              params.type === 'details' ? (
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
          {params.type === 'edit' && (
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