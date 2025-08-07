import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface Customer {
  id: string
  name: string
  email: string | null
  website?: string | null
  taxId?: string | null
  contactPerson?: string | null
  notes?: string | null
  phone?: string | null
  address?: string | null
  addressLine1?: string | null
  unitNumber?: string | null
  city?: string | null
  state?: string | null
  fullAddress?: string | null
  postalCode?: string | null
  country?: string | null
  createdBy: string
  organizationId: string
  created_at: string
  updatedAt?: string | null
  // Additional fields from API
  invoiceCount?: number
  projectCount?: number
  receiptCount?: number
  feedbackCount?: number
  lastActivity?: string
  rating?: number
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data } = await axios.get<{ success: boolean; customers: Customer[] }>('/api/customers')
  if (!data.success) throw new Error('Error fetching customers')
  return data.customers
}

export function useCustomers(initialData?: Customer[]) {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    initialData,
  })
} 