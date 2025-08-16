import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export interface Receipt {
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
    organizationName: string | null
    organizationLogo: string | null
    organizationLogoUrl: string | null // From organization table
    organizationNameFromOrg: string | null // From organization table
    organizationEmailFromOrg: string | null // From organization table
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
    creationMethod: string | null
    paymentInfo: string | null
    paymentDetails: string | null
    receiptDetails: any | null
    subTotalAmount: number | null
    totalAmount: number | null
    state: string | null
    sentViaEmail: boolean | null
    emailSentAt: string | null
    createdBy: string | null
    created_at: string | null
    updatedAt: string | null
    paymentConfirmedAt: string | null
    receiptNumber: string | null
    paymentLink: string | null
    paymentType: string | null
    projectName: string | null
    allowReminders: boolean | null
    fts: any | null
    // Additional formatted fields for display
    customerName?: string
    issueDateFormatted?: string
    dueDateFormatted?: string
    totalAmountFormatted?: string
  }

  export interface CreateReceiptData {
    customerId?: string | null
    projectId?: string | null
    organizationName?: string | null
    organizationLogoUrl?: string | null
    organizationEmail?: string | null
    recepientName?: string | null
    recepientEmail?: string | null
    issueDate?: Date | null
    paymentConfirmedAt?: Date | null
    currency?: string
    hasVat?: boolean
    hasTax?: boolean
    hasDiscount?: boolean
    vatRate?: number
    taxRate?: number
    discount?: number
    notes?: string | null
    paymentDetails?: string | null
    receiptDetails: Array<{
      position?: number
      description?: string | null
      quantity?: number
      unitPrice?: number
      total?: number
    }>
    creationMethod?: "auto" | "manual" | "invoice"
    state?: "draft" | "unassigned" | "sent" | "settled" | "overdue" | "cancelled"
    emailToCustomer?: boolean
}

export async function fetchReceipts(): Promise<Receipt[]> {
  const { data } = await axios.get<{ success: boolean; receipts: Receipt[] }>('/api/receipts')
  if (!data.success) throw new Error('Error fetching receipts')
  return data.receipts
}

export function useReceipts(initialData?: Receipt[]) {
  return useQuery<Receipt[]>({
    queryKey: ['receipts'],
    queryFn: fetchReceipts,
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes caching to reduce refetches
  })
}

export function useCreateReceipt() {
    const queryClient = useQueryClient()
    
    return useMutation({
      mutationFn: async (receiptData: CreateReceiptData) => {
        const { data } = await axios.post<{ success: boolean; data: Receipt }>('/api/receipts/create', receiptData)
        if (!data.success) throw new Error('Error creating receipt')
        return data.data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['receipts'] })
      },
    })
}


export async function fetchReceipt(receiptId: string): Promise<Receipt> {
    const { data } = await axios.get<{ success: boolean; receipt: Receipt }>(`/api/receipts/${receiptId}`)
    if (!data.success) throw new Error('Error fetching receipt')
    return data.receipt
}

export function useReceipt(receiptId: string) {
    return useQuery<Receipt>({
      queryKey: ['receipt', receiptId],
      queryFn: () => fetchReceipt(receiptId),
      enabled: !!receiptId,
    })
}

export function useUpdateReceipt() {
    const queryClient = useQueryClient()
    
    return useMutation({
      mutationFn: async ({ receiptId, receiptData }: { receiptId: string; receiptData: Partial<CreateReceiptData> }) => {
        const { data } = await axios.put<{ success: boolean; receipt: Receipt }>(`/api/receipts/${receiptId}`, receiptData)
        if (!data.success) throw new Error('Error updating receipt')
        return data.receipt
      },
      onSuccess: (_, { receiptId }) => {
        queryClient.invalidateQueries({ queryKey: ['receipts'] })
        queryClient.invalidateQueries({ queryKey: ['receipt', receiptId] })
      },
    })
}

export function useDeleteReceipt() {
    const queryClient = useQueryClient()
    
    return useMutation({
      mutationFn: async (receiptId: string) => {
        const { data } = await axios.delete<{ success: boolean }>(`/api/receipts/${receiptId}`)
        if (!data.success) throw new Error('Error deleting receipt')
        return data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['receipts'] })
      },
    })
}






