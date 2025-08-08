"use client"

import { Row } from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Invoice } from "./columns"
import { MoreHorizontal, Loader2, CheckCircle, Clock, HardDriveDownload, Receipt } from "lucide-react"
import ConfirmModal from "@/components/modal/confirm-modal"
import { downloadInvoiceAsPDF, type InvoicePDFData } from '@/utils/invoice-pdf'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const invoice = row.original as Invoice
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleEdit = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("invoiceId", invoice.id)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Delete project mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return axios.delete(`/api/invoices/${invoiceId}`)
    },
    onSuccess: () => {
      toast.success("Invoice deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      
      // Clear URL parameters to prevent opening edit sheet for deleted project
      const currentParams = new URLSearchParams(searchParams.toString())
      if (currentParams.has('invoiceId')) {
        currentParams.delete('invoiceId')
        const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname
        router.replace(newUrl)
      }
    },
    onError: (error: any) => {
      console.error("Delete invoice error:", error.response?.data)
      const errorMessage = error.response?.data?.error || "Failed to delete invoice"
      toast.error(errorMessage)
    },
  })

  // Receipt creation mutation
  const createReceiptMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return axios.post(`/api/invoices/${invoiceId}/receipt`);
    },
    onSuccess: (response) => {
      toast.success("Receipt created successfully!");
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
    onError: (error: any) => {
      console.error("Create receipt error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to create receipt";
      toast.error(errorMessage);
    },
  });

  const handleDelete = () => {
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    deleteInvoiceMutation.mutate(invoice.id)
    setIsDeleteModalOpen(false)
  }

  const handleCreateReceipt = () => {
    createReceiptMutation.mutate(invoice.id)
  }

  // Duplicate invoice mutation
  const duplicateInvoiceMutation = useMutation({
    mutationFn: async (originalInvoice: Invoice) => {
      // First, get the full invoice details
      const { data: fullInvoiceResponse } = await axios.get(`/api/invoices/${originalInvoice.id}`)
      const fullInvoice = fullInvoiceResponse.invoice
      
      // Create a copy with modified invoice number and reset certain fields
      const duplicatedInvoice = {
        // Basic invoice info
        customerId: fullInvoice.customerId || null,
        projectId: fullInvoice.projectId || null,
        organizationName: fullInvoice.organizationName || null,
        organizationLogoUrl: fullInvoice.organizationLogo || null,
        organizationEmail: fullInvoice.organizationEmail || null,
        recepientName: fullInvoice.recepientName || null,
        recepientEmail: fullInvoice.recepientEmail || null,
        issueDate: new Date(), // Set to current date for duplicate
        dueDate: fullInvoice.dueDate ? new Date(new Date().getTime() + (3 * 24 * 60 * 60 * 1000)) : null, // 3 days from now
        currency: fullInvoice.currency || "CAD",
        hasVat: fullInvoice.hasVat || false,
        hasTax: fullInvoice.hasTax || false,
        hasDiscount: fullInvoice.hasDiscount || false,
        vatRate: fullInvoice.vatRate || 0,
        taxRate: fullInvoice.taxRate || 0,
        discount: fullInvoice.discount || 0,
        notes: fullInvoice.notes || "",
        paymentInfo: fullInvoice.paymentInfo || null,
        paymentDetails: fullInvoice.paymentDetails || null,
        invoiceDetails: fullInvoice.invoiceDetails || [],
        
        // Reset state and status for new invoice
        state: "draft",
        sentViaEmail: false,
        emailSentAt: null,
        emailToCustomer: false,
      }
      
      console.log("Sending duplicate invoice data:", duplicatedInvoice)
      return axios.post('/api/invoices/create', duplicatedInvoice)
    },
    onSuccess: () => {
      toast.success("Invoice duplicated successfully!")
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error: any) => {
      console.error("Duplicate invoice error:", error.response?.data)
      const errorMessage = error.response?.data?.error || "Failed to duplicate invoice"
      toast.error(errorMessage)
    },
  })

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, newStatus }: { invoiceId: string, newStatus: string }) => {
      // Get the current invoice first to ensure we have all required fields
      const { data: currentInvoiceResponse } = await axios.get(`/api/invoices/${invoiceId}`)
      const currentInvoice = currentInvoiceResponse.invoice
      
      // Send a minimal update with only the state change
      const updateData = {
        ...currentInvoice,
        state: newStatus,
        emailToCustomer: false,
      }
      
      return axios.put(`/api/invoices/${invoiceId}`, updateData)
    },
    onSuccess: (_, variables) => {
      const statusText = variables.newStatus === 'settled' ? 'settled' : 'in progress'
      toast.success(`Invoice marked as ${statusText}!`)
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error: any) => {
      console.error("Status update error:", error.response?.data)
      const errorMessage = error.response?.data?.error || "Failed to update invoice status"
      toast.error(errorMessage)
    },
  })

  const handleDuplicate = () => {
    duplicateInvoiceMutation.mutate(invoice)
  }

  const handleStatusToggle = () => {
    setIsUpdating(true)
    const newStatus = invoice.state === 'settled' ? 'draft' : 'settled'
    updateStatusMutation.mutate(
      { invoiceId: invoice.id, newStatus },
      {
        onSettled: () => setIsUpdating(false)
      }
    )
  }

  const getStatusToggleText = () => {
    if (invoice.state === 'settled') {
      return 'Mark as Draft'
    }
    return 'Mark as Settled'
  }

  const getStatusToggleIcon = () => {
    if (isUpdating) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    if (invoice.state === 'settled') {
      return <Clock className="h-4 w-4" />
    }
    return <CheckCircle className="h-4 w-4" />
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={handleEdit}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={async () => {
              try {
                const invoiceData: InvoicePDFData = {
                  id: invoice.id,
                  invoiceNumber: invoice.invoiceNumber,
                  recepientEmail: invoice.recepientEmail,
                  recepientName: invoice.recepientName,
                  created_at: null,
                  paidOn: null,
                  dueDate: invoice.dueDate,
                  issueDate: invoice.issueDate,
                  state: invoice.state,
                  status: invoice.status,
                  totalAmount: invoice.totalAmount,
                  subTotalAmount: invoice.subTotalAmount,
                  currency: invoice.currency,
                  taxRate: invoice.taxRate,
                  invoiceDetails: invoice.invoiceDetails?.map((detail: { description: any; quantity: any; unitPrice: any; total: any }, index: number) => ({
                    position: index + 1,
                    description: detail.description,
                    quantity: detail.quantity,
                    unitPrice: detail.unitPrice,
                    total: detail.total
                  })),
                  vatRate: invoice.vatRate,
                  discount: invoice.discount,
                  hasDiscount: invoice.hasDiscount,
                  hasTax: invoice.hasTax,
                  hasVat: invoice.hasVat,
                  notes: invoice.notes,
                  organizationName: invoice.organizationName,
                  organizationEmail: invoice.organizationEmail,
                };
                
                const filename = invoice.invoiceNumber 
                  ? `${invoice.invoiceNumber}.pdf`
                  : `invoice-${invoice.id}.pdf`;
                
                await downloadInvoiceAsPDF(invoiceData, filename);
                toast.success("Invoice PDF downloaded successfully!");
              } catch (error) {
                console.error('Error downloading invoice PDF:', error);
                toast.error("Failed to download invoice PDF");
              }
            }}
          >
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDuplicate}
            disabled={duplicateInvoiceMutation.isPending}
          >
            {duplicateInvoiceMutation.isPending ? 'Duplicating...' : 'Duplicate Invoice'}
          </DropdownMenuItem>
          
          {/* Create Receipt - Only for settled and unassigned invoices */}
          {(invoice.state?.toLowerCase() === 'settled' || invoice.state?.toLowerCase() === 'unassigned') && (
            <DropdownMenuItem 
              onClick={handleCreateReceipt}
              disabled={createReceiptMutation.isPending}
            >

              {createReceiptMutation.isPending ? 'Creating Receipt...' : 'Create Receipt'}
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          {/* <DropdownMenuItem 
            onClick={handleStatusToggle}
            disabled={updateStatusMutation.isPending}
          >
            {getStatusToggleText()}
          </DropdownMenuItem> */}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDelete} 
            className="text-red-600"
            disabled={deleteInvoiceMutation.isPending}
          >
            {deleteInvoiceMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                Delete
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={invoice.invoiceNumber || "Untitled Invoice"}
        itemType="Invoice"
        isLoading={deleteInvoiceMutation.isPending}
      />


    </>
  )
}
