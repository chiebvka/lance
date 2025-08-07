import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export interface Invoice {
  id: string
  customerId: string | null
  projectId: string | null
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
  organizationId: string | null
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
  state?: "draft" | "unassigned" | "sent" | "completed" | "overdue" | "cancelled"
  emailToCustomer?: boolean
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
