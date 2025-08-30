import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

export interface Invoice {
  id: string
  organizationId: {
      id: string
      name: string
      email: string
      logoUrl: string
  } | null
  customerId: {
      id: string
      name: string
  } | null
  projectId: {
      id: string
      name: string
  } | null
  // Organization data from organization table (most up-to-date)
  organizationLogoUrl: string | null
  organizationNameFromOrg: string | null
  organizationEmailFromOrg: string | null
  // Fallback organization data from invoice table (saved when invoice was created)
  organizationName: string | null
  organizationLogo: string | null
  organizationEmail: string | null
  recepientName: string | null
  recepientEmail: string | null
  issueDate: string | null
  dueDate: string | null
  currency: string | null
  hasVat: boolean | null
  hasTax: boolean | null
  hasDiscount: boolean | null
  vatRate: number | null
  taxRate: number | null
  discount: number | null
  notes: string | null
  paymentInfo: string | null
  paymentDetails: string | null
  invoiceDetails: any | null
  subTotalAmount: number | null
  totalAmount: number | null
  state: string | null
  sentViaEmail: boolean | null
  emailSentAt: string | null
  createdBy: string | null
  created_at: string | null
  updatedAt: string | null
  invoiceNumber: string | null
  status: string | null
  paidOn: string | null
  paymentLink: string | null
  paymentType: string | null
  projectName: string | null
  allowReminders: boolean | null
  fts: any | null
  customerName?: string
  issueDateFormatted?: string
  dueDateFormatted?: string
  paidOnFormatted?: string
  totalAmountFormatted?: string
}

export interface CreateInvoiceData {
  customerId?: string | null
  projectId?: string | null
  organizationName?: string | null
  organizationLogoUrl?: string | null
  organizationEmail?: string | null
  recepientName?: string | null
  recepientEmail?: string | null
  issueDate?: Date | null
  dueDate?: Date | null
  currency?: string
  hasVat?: boolean
  hasTax?: boolean
  hasDiscount?: boolean
  vatRate?: number
  taxRate?: number
  discount?: number
  notes?: string | null
  paymentInfo?: string | null
  paymentDetails?: string | null
  invoiceDetails: Array<{
    position?: number
    description?: string | null
    quantity?: number
    unitPrice?: number
    total?: number
  }>
  state?: "draft" | "unassigned" | "sent" | "settled" | "overdue" | "cancelled"
  emailToCustomer?: boolean
  paidOn?: string | null
  customerName?: string
  issueDateFormatted?: string
  dueDateFormatted?: string
  paidOnFormatted?: string
  totalAmountFormatted?: string
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const { data } = await axios.get<{ success: boolean; invoices: Invoice[] }>('/api/invoices')
  if (!data.success) throw new Error('Error fetching invoices')
  return data.invoices
}

export function useInvoices(initialData?: Invoice[]) {
  return useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
    initialData,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (invoiceData: CreateInvoiceData) => {
      const { data } = await axios.post<{ success: boolean; data: Invoice }>('/api/invoices/create', invoiceData)
      if (!data.success) throw new Error('Error creating invoice')
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export async function fetchInvoice(invoiceId: string): Promise<Invoice> {
  const { data } = await axios.get<{ success: boolean; invoice: Invoice }>(`/api/invoices/${invoiceId}`)
  if (!data.success) throw new Error('Error fetching invoice')
  return data.invoice
}

export function useInvoice(invoiceId: string) {
  return useQuery<Invoice>({
    queryKey: ['invoice', invoiceId],
    queryFn: () => fetchInvoice(invoiceId),
    enabled: !!invoiceId,
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ invoiceId, invoiceData }: { invoiceId: string; invoiceData: Partial<CreateInvoiceData> }) => {
      const { data } = await axios.put<{ success: boolean; invoice: Invoice }>(`/api/invoices/${invoiceId}`, invoiceData)
      if (!data.success) throw new Error('Error updating invoice')
      return data.invoice
    },
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
    },
  })
}

export function useDeleteInvoice(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await axios.delete<{ success: boolean }>(`/api/invoices/${invoiceId}`)
      if (!data.success) throw new Error('Error deleting invoice')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      if (onSuccess) onSuccess()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete invoice')
      if (onSuccess) onSuccess()
    },
  })
}
