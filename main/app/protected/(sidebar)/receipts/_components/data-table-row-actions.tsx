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


import { MoreHorizontal, Loader2, CheckCircle, Clock, HardDriveDownload, Bubbles } from "lucide-react"
import ConfirmModal from "@/components/modal/confirm-modal"
import { downloadInvoiceAsPDF, type InvoicePDFData } from '@/utils/invoice-pdf'

import { downloadReceiptAsPDF, type ReceiptPDFData } from "@/utils/receipt-pdf"
import { Receipt } from "./columns"


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
  const receipt = row.original as Receipt
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleEdit = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("receiptId", receipt.id)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Delete project mutation
  const deleteReceiptMutation = useMutation({
    mutationFn: async (receiptId: string) => {
      return axios.delete(`/api/receipts/${receiptId}`)
    },
    onSuccess: () => {
      toast.success("Receipt deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      
      // Clear URL parameters to prevent opening edit sheet for deleted project
      const currentParams = new URLSearchParams(searchParams.toString())
      if (currentParams.has('receiptId')) {
        currentParams.delete('receiptId')
        const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname
        router.replace(newUrl)
      }
    },
    onError: (error: any) => {
      console.error("Delete receipt error:", error.response?.data)
      const errorMessage = error.response?.data?.error || "Failed to delete receipt"
      toast.error(errorMessage)
    },
  })



  const handleDelete = () => {
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    deleteReceiptMutation.mutate(receipt.id)
    setIsDeleteModalOpen(false)
  }



  // Duplicate invoice mutation
  const duplicateReceiptMutation = useMutation({
    mutationFn: async (originalReceipt: Receipt) => {
        // Show loading toast with bubbles icon
      const loadingToastId = toast.loading(
        <div className="flex items-center gap-3">
          <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s]" />
          <span>Duplicating Receipt...</span>
        </div>,
        { duration: Infinity }
      );

      try {
        // First, get the full invoice details
        const { data: fullReceiptResponse } = await axios.get(`/api/receipts/${originalReceipt.id}`)
        const fullReceipt = fullReceiptResponse.receipt
        
        // Create a copy with modified invoice number and reset certain fields
        const duplicatedReceipt = {
          // Basic invoice info
          customerId: fullReceipt.customerId || null,
          projectId: fullReceipt.projectId || null,
          organizationName: fullReceipt.organizationName || null,
          organizationLogoUrl: fullReceipt.organizationLogo || null,
          organizationEmail: fullReceipt.organizationEmail || null,
          recepientName: fullReceipt.recepientName || null,
          recepientEmail: fullReceipt.recepientEmail || null,
          issueDate: new Date(), // Set to current date for duplicate
          paymentConfirmedAt: new Date(),
          dueDate: fullReceipt.dueDate ? new Date(new Date().getTime() + (3 * 24 * 60 * 60 * 1000)) : null, // 3 days from now
          currency: fullReceipt.currency || "CAD",
          hasVat: fullReceipt.hasVat || false,
          hasTax: fullReceipt.hasTax || false,
          hasDiscount: fullReceipt.hasDiscount || false,
          vatRate: fullReceipt.vatRate || 0,
          taxRate: fullReceipt.taxRate || 0,
          discount: fullReceipt.discount || 0,
          notes: fullReceipt.notes || "",
          paymentInfo: fullReceipt.paymentInfo || null,
          paymentDetails: fullReceipt.paymentDetails || null,
          receiptDetails: fullReceipt.receiptDetails || [],
          
          // Reset state and status for new invoice
          state: "draft",
          sentViaEmail: false,
          emailSentAt: null,
          emailToCustomer: false,
        }
        
        console.log("Sending duplicate receipt data:", duplicatedReceipt)
        const result = await axios.post('/api/receipts/create', duplicatedReceipt)
        toast.dismiss(loadingToastId);
        return result
        
      } catch (error) {
         // Dismiss loading toast on error
         toast.dismiss(loadingToastId);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Receipt duplicated successfully!")
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
    onError: (error: any) => {
      console.error("Duplicate receipt error:", error.response?.data)
      const errorMessage = error.response?.data?.error || "Failed to duplicate invoice"
      toast.error(errorMessage)
    },
  })

  // Status update mutation
  const updateStateMutation = useMutation({
    mutationFn: async ({ receiptId, newState }: { receiptId: string, newState: string }) => {
      // Get the current invoice first to ensure we have all required fields
      const { data: currentReceiptResponse } = await axios.get(`/api/receipts/${receiptId}`)
      const currentReceipt = currentReceiptResponse.receipt
      
      // Send a minimal update with only the state change
      const updateData = {
        ...currentReceipt,
        state: newState,
        emailToCustomer: false,
      }
      
      return axios.put(`/api/receipts/${receiptId}`, updateData)
    },
    onSuccess: (_, variables) => {
      const stateText = variables.newState === 'settled' ? 'settled' : 'in progress'
      toast.success(`Receipt marked as ${stateText}!`)
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
    onError: (error: any) => {
      console.error("Status update error:", error.response?.data)
      const errorMessage = error.response?.data?.error || "Failed to update receipt status"
      toast.error(errorMessage)
    },
  })

  const handleDuplicate = () => {
    duplicateReceiptMutation.mutate(receipt)
  }

  const handleStatusToggle = () => {
    setIsUpdating(true)
    const newState = receipt.state === 'settled' ? 'draft' : 'settled'
    updateStateMutation.mutate(
      { receiptId: receipt.id, newState },
      {
        onSettled: () => setIsUpdating(false)
      }
    )
  }

  const getStatusToggleText = () => {
    if (receipt.state === 'settled') {
      return 'Mark as Draft'
    }
    return 'Mark as Settled'
  }

  const getStatusToggleIcon = () => {
    if (isUpdating) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    if (receipt.state === 'settled') {
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
                const receiptData: ReceiptPDFData = {
                  id: receipt.id,
                  receiptNumber: receipt.receiptNumber,
                  recepientEmail: receipt.recepientEmail,
                  recepientName: receipt.recepientName,
                  created_at: null,
                  paymentConfirmedAt: receipt.paymentConfirmedAt,
                  issueDate: receipt.issueDate,
                  state: receipt.state,
                  totalAmount: receipt.totalAmount,
                  subTotalAmount: receipt.subTotalAmount,
                  currency: receipt.currency,
                  taxRate: receipt.taxRate,
                  receiptDetails: receipt.receiptDetails?.map((detail: { description: any; quantity: any; unitPrice: any; total: any }, index: number) => ({
                    position: index + 1,
                    description: detail.description,
                    quantity: detail.quantity,
                    unitPrice: detail.unitPrice,
                    total: detail.total
                  })),
                  vatRate: receipt.vatRate,
                  discount: receipt.discount,
                  hasDiscount: receipt.hasDiscount,
                  hasTax: receipt.hasTax,
                  hasVat: receipt.hasVat,
                  notes: receipt.notes,
                  organizationName: receipt.organizationName,
                  organizationEmail: receipt.organizationEmail,
                };
                
                const filename = receipt.receiptNumber 
                  ? `${receipt.receiptNumber}.pdf`
                  : `receipt-${receipt.id}.pdf`;
                
                await downloadReceiptAsPDF(receiptData, filename);
                toast.success("Receipt PDF downloaded successfully!");
              } catch (error) {
                console.error('Error downloading receipt PDF:', error);
                toast.error("Failed to download invoice PDF");
              }
            }}
          >
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDuplicate}
            disabled={duplicateReceiptMutation.isPending}
          >
            {duplicateReceiptMutation.isPending ? 'Duplicating...' : 'Duplicate Receipt'}
          </DropdownMenuItem>
          

          
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
            disabled={deleteReceiptMutation.isPending}
          >
            {deleteReceiptMutation.isPending ? (
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
        itemName={receipt.receiptNumber || "Untitled Receipt"}
        itemType="Receipt"
        isLoading={deleteReceiptMutation.isPending}
      />


    </>
  )
}
