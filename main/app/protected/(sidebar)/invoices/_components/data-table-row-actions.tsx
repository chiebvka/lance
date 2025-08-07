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
import { MoreHorizontal, Loader2, CheckCircle, Clock, HardDriveDownload } from "lucide-react"
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

  const handleDelete = () => {
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    deleteInvoiceMutation.mutate(invoice.id)
    setIsDeleteModalOpen(false)
  }

  // Duplicate project mutation
  const duplicateInvoiceMutation = useMutation({
    mutationFn: async (originalInvoice: Invoice) => {
      // First, get the full project details
      const { data: fullInvoiceResponse } = await axios.get(`/api/invoices/${originalInvoice.id}`)
      const fullInvoice = fullInvoiceResponse.invoice
      
      // Create a copy with modified name and reset certain fields
      const duplicatedProject = {
        // Basic project info
        name: `${fullInvoice.name} (Copy)`,
        description: fullInvoice.description || "",
        type: fullInvoice.type || "customer",
        customerId: fullInvoice.customerId || null,
        currency: fullInvoice.currency || "USD",
        currencyEnabled: fullInvoice.currencyEnabled || false,
        budget: fullInvoice.budget || 0,
        startDate: fullInvoice.startDate || null,
        endDate: fullInvoice.endDate || null,
        effectiveDate: fullInvoice.effectiveDate || null,
        notes: fullInvoice.notes || "",
        
        // Deliverables
        deliverablesEnabled: fullInvoice.deliverablesEnabled || false,
        deliverables: (fullInvoice.deliverables || []).map((d: any) => ({
          // DO NOT include id - let Supabase auto-generate it
          name: d.name || "",
          description: d.description || null,
          dueDate: d.dueDate || null,
          status: d.status || "pending",
          position: d.position || 1,
          isPublished: d.isPublished || false,
          // DO NOT include: id, projectId, createdBy, lastSaved
        })),
        
        // Payment structure
        paymentStructure: fullInvoice.paymentStructure || "noPayment",
        paymentMilestones: (fullInvoice.paymentMilestones || []).map((m: any) => ({
          // DO NOT include id - let Supabase auto-generate it
          name: m.name || null,
          description: m.description || null,
          amount: m.amount || null,
          percentage: m.percentage || null,
          dueDate: m.dueDate || null,
          status: m.status || null,
          type: m.type || "milestone",
          hasPaymentTerms: m.hasPaymentTerms || false,
          // DO NOT include: id, projectId, deliverableId, createdBy
        })),
        hasPaymentTerms: fullInvoice.hasPaymentTerms || false,
        
        // Service agreement
        hasServiceAgreement: fullInvoice.hasServiceAgreement || false,
        serviceAgreement: fullInvoice.serviceAgreement || "",
        agreementTemplate: fullInvoice.agreementTemplate || "standard",
        hasAgreedToTerms: false, // Reset for new project
        
        // Status and state - reset for new project
        isPublished: false,
        status: "pending",
        signedStatus: "not_signed",
        state: "draft",
        
        // Other fields
        documents: fullInvoice.documents || "",
        customFields: fullInvoice.customFields || { name: "", value: "" },
        emailToCustomer: false,
      }
      
      console.log("Sending duplicate project data:", duplicatedProject)
      return axios.post('/api/projects/create', duplicatedProject)
    },
    onSuccess: () => {
      toast.success("Project duplicated successfully!")
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (error: any) => {
      console.error("Duplicate project error:", error.response?.data)
      const errorMessage = error.response?.data?.error || "Failed to duplicate project"
      toast.error(errorMessage)
    },
  })

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, newStatus }: { invoiceId: string, newStatus: string }) => {
      // Get the current project first to ensure we have all required fields
      const { data: currentInvoiceResponse } = await axios.get(`/api/invoices/${invoiceId}`)
      const currentInvoice = currentInvoiceResponse.invoice
      
      // Send a minimal update with only the status change
      const updateData = {
        id: invoiceId,
        status: newStatus,
        // Include required fields to pass validation
        name: currentInvoice.name,
        description: currentInvoice.description,
        type: currentInvoice.type,
        customerId: currentInvoice.customerId,
        currency: currentInvoice.currency || "USD",
        currencyEnabled: currentInvoice.currencyEnabled || false,
        budget: currentInvoice.budget || 0,
        deliverablesEnabled: currentInvoice.deliverablesEnabled || false,
        deliverables: currentInvoice.deliverables || [],
        paymentStructure: currentInvoice.paymentStructure || "noPayment",
        paymentMilestones: currentInvoice.paymentMilestones || [],
        hasPaymentTerms: currentInvoice.hasPaymentTerms || false,
        hasServiceAgreement: currentInvoice.hasServiceAgreement || false,
        serviceAgreement: currentInvoice.serviceAgreement || "",
        agreementTemplate: currentInvoice.agreementTemplate || "standard",
        hasAgreedToTerms: currentInvoice.hasAgreedToTerms || false,
        isPublished: currentInvoice.isPublished || false,
        signedStatus: currentInvoice.signedStatus || "not_signed",
        state: currentInvoice.state || "draft",
        documents: currentInvoice.documents || "",
        customFields: currentInvoice.customFields || { name: "", value: "" },
        emailToCustomer: false,
      }
      
      return axios.put(`/api/invoices/${invoiceId}`, updateData)
    },
    onSuccess: (_, variables) => {
      const statusText = variables.newStatus === 'completed' ? 'completed' : 'in progress'
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
    const newStatus = invoice.status === 'completed' ? 'pending' : 'completed'
    updateStatusMutation.mutate(
      { invoiceId: invoice.id, newStatus },
      {
        onSettled: () => setIsUpdating(false)
      }
    )
  }

  const getStatusToggleText = () => {
    if (invoice.status === 'completed') {
      return 'Mark as In Progress'
    }
    return 'Mark as Completed'
  }

  const getStatusToggleIcon = () => {
    if (isUpdating) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    if (invoice.status === 'completed') {
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
                  created_at: invoice.created_at,
                  paidOn: invoice.paidOn,
                  dueDate: invoice.dueDate,
                  issueDate: invoice.issueDate,
                  state: invoice.state,
                  status: invoice.status,
                  totalAmount: invoice.totalAmount,
                  currency: invoice.currency,
                  taxRate: invoice.taxRate,
                  vatRate: invoice.vatRate,
                  notes: invoice.notes,
                  organizationName: 'Your Company',
                  organizationAddress: '123 Business Street\nCity, State 12345',
                  organizationEmail: 'contact@company.com',
                  organizationPhone: '+1 (555) 123-4567',
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
            <HardDriveDownload className="h-4 w-4 mr-2" />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDuplicate}
            disabled={duplicateInvoiceMutation.isPending}
          >
            {duplicateInvoiceMutation.isPending ? 'Duplicating...' : 'Duplicate Invoice'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleStatusToggle}
            disabled={updateStatusMutation.isPending}
          >
            {getStatusToggleText()}
          </DropdownMenuItem>
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
