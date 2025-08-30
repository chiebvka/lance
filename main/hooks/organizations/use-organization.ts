import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

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

export interface OrganizationCounts {
  customerCount: number
  projectCount: number
  invoiceCount: number
  receiptCount: number
  feedbackCount: number
  wallCount: number
  pathCount: number
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

type UpdateOrganizationInput = Partial<Pick<Organization,
  'logoUrl' | 'name' | 'email' | 'country' | 'baseCurrency' |
  'invoiceNotifications' | 'projectNotifications' | 'feedbackNotifications'
>>

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: UpdateOrganizationInput) => {
      const current = queryClient.getQueryData<Organization>(['organization'])
      if (!current?.id) throw new Error('No organization in cache to update')
      const { data } = await axios.patch(`/api/organization/${current.id}`, updates)
      return data
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['organization'] })
      const previousOrganization = queryClient.getQueryData<Organization>(['organization'])

      queryClient.setQueryData<Organization | undefined>(['organization'], (old) => {
        if (!old) return old
        return { ...old, ...updates, updated_at: new Date().toISOString() }
      })

      return { previousOrganization }
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousOrganization) {
        queryClient.setQueryData(['organization'], context.previousOrganization)
      }
      const message = error?.response?.data?.error
        || error?.message
        || 'Failed to update organization'
      toast.error('Update failed', { description: message })
    },
    onSuccess: () => {
      toast.success('Settings updated successfully!', {
        description: 'Your changes have been saved.'
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    }
  })
}

export function useUploadOrganizationLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const org = queryClient.getQueryData<Organization>(['organization'])
      if (!org?.id) throw new Error('No organization in cache to upload logo for')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'organizations/logos')
      const uploadResponse = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { url } = uploadResponse.data

      await axios.patch(`/api/organization/${org.id}`, { logoUrl: url })
      return { url }
    },
    onMutate: async (file) => {
      await queryClient.cancelQueries({ queryKey: ['organization'] })
      const previousOrganization = queryClient.getQueryData<Organization>(['organization'])
      const tempUrl = URL.createObjectURL(file)
      queryClient.setQueryData<Organization | undefined>(['organization'], (old) => {
        if (!old) return old
        return { ...old, logoUrl: tempUrl }
      })
      return { previousOrganization, tempUrl }
    },
    onError: (error: any, _file, context) => {
      if (context?.previousOrganization) {
        queryClient.setQueryData(['organization'], context.previousOrganization)
      }
      if (context?.tempUrl) URL.revokeObjectURL(context.tempUrl)
      const message = error?.response?.data?.error
        || error?.message
        || 'Failed to upload logo'
      toast.error('Upload failed', { description: message })
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Organization | undefined>(['organization'], (old) => {
        if (!old) return old
        return { ...old, logoUrl: data.url }
      })
      toast.success('Logo uploaded successfully!', {
        description: 'Your company logo has been updated.'
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    }
  })
}

export function useDeleteOrganizationLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const org = queryClient.getQueryData<Organization>(['organization'])
      if (!org?.id) throw new Error('No organization in cache to delete logo for')
      await axios.patch(`/api/organization/${org.id}`, { logoUrl: null })
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['organization'] })
      const previousOrganization = queryClient.getQueryData<Organization>(['organization'])
      queryClient.setQueryData<Organization | undefined>(['organization'], (old) => {
        if (!old) return old
        return { ...old, logoUrl: null }
      })
      return { previousOrganization }
    },
    onError: (error: any, _v, context) => {
      if (context?.previousOrganization) {
        queryClient.setQueryData(['organization'], context.previousOrganization)
      }
      const message = error?.response?.data?.error
        || error?.message
        || 'Failed to delete logo'
      toast.error('Delete failed', { description: message })
    },
    onSuccess: () => {
      toast.success('Logo deleted successfully!', {
        description: 'Your company logo has been removed.'
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    }
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const org = queryClient.getQueryData<Organization>(['organization'])
      if (!org?.id) throw new Error('No organization in cache to delete')
      const { data } = await axios.delete(`/api/organization/${org.id}`)
      return data
    },
  })
}

export async function fetchOrganizationCounts(organizationId: string): Promise<OrganizationCounts> {
  const { data } = await axios.get<{ success: boolean; counts: OrganizationCounts }>(`/api/organization/${organizationId}/counts`)
  if (!data.success) throw new Error('Error fetching organization counts')
  return data.counts
}

export function useOrganizationCounts(organizationId: string) {
  return useQuery<OrganizationCounts>({
    queryKey: ['organization', organizationId, 'counts'],
    queryFn: () => fetchOrganizationCounts(organizationId),
    enabled: !!organizationId,
  })
}

export function prefetchOrganization(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.prefetchQuery({ queryKey: ['organization'], queryFn: fetchOrganization })
}