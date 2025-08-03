import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface Organization {
  id: string
  name: string | null
  email: string | null
  logoUrl: string | null
  country: string | null
  taxId: string | null
  baseCurrency: string | null
  createdBy: string | null
  created_at: string
  updated_at: string | null
  invoiceNotifications: boolean | null
  projectNotifications: boolean | null
  feedbackNotifications: boolean | null
}

export async function fetchOrganization(): Promise<Organization> {
  const { data } = await axios.get<{ success: boolean; organization: Organization }>('/api/organization')
  if (!data.success) throw new Error('Error fetching organization')
  return data.organization
}

export function useOrganization(initialData?: Organization) {
  return useQuery<Organization>({
    queryKey: ['organization'],
    queryFn: fetchOrganization,
    initialData,
    // staleTime: 1000 * 60 * 5, // 5m
  })
} 