import { Project } from '@/validation/forms/project';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

// Extended Project interface with relations for individual project fetching
export interface ProjectWithRelations extends Project {
  customer?: {
    id: string
    name: string
    email: string | null
  } | null
  deliverables?: Array<{
    id: string
    name: string
    description: string
    dueDate: string | null
    position: number
    isPublished: boolean
    status: "pending" | "in_progress" | "completed" | "cancelled" | "signed" | "overdue"
  }>
  paymentMilestones?: Array<{
    id: string
    name: string | null
    percentage: number | null
    amount: number | null
    dueDate: string | null
    description: string | null
    status: string | null
    type: "milestone" | "deliverable" | null
    hasPaymentTerms?: boolean
    deliverableId?: string | null
  }>
  organization?: {
    id: string
    name: string
    email: string
    logoUrl: string
  } | null
  // Additional fields that may be present in edit forms
  currencyEnabled?: boolean
  deliverablesEnabled?: boolean
  paymentStructure?: string
  serviceAgreement?: string
  agreementTemplate?: string
  hasAgreedToTerms?: boolean
  isPublished?: boolean
  signedStatus?: string
  documents?: string
  notes?: string
  customFields?: any
  startDate?: string | null
  effectiveDate?: string | null
  hasPaymentTerms?: boolean
}

// Project data interface for creation
export interface CreateProjectData {
  customerId?: string | null
  currency?: string
  currencyEnabled?: boolean
  projectType?: "personal" | "customer"
  budget?: number
  projectName?: string
  projectDescription?: string
  startDate?: string
  endDate?: string
  deliverables?: Array<{
    id: string
    name: string
    description: string
    dueDate: string
    position: number
    isPublished: boolean
    status: "pending" | "in_progress" | "completed" | "cancelled" | "signed" | "overdue"
  }>
  deliverablesEnabled?: boolean
  paymentStructure?: string
  paymentMilestones?: Array<{
    id?: string
    name: string | null
    percentage: number | null
    amount: number | null
    dueDate: string
    description?: string | null
    status?: string | null
    type?: "milestone" | "deliverable" | null
  }>
  hasServiceAgreement?: boolean
  serviceAgreement?: string
  agreementTemplate?: string
  hasAgreedToTerms?: boolean
  isPublished?: boolean
  state?: "draft" | "published"
  emailToCustomer?: boolean
}

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await axios.get<{ success: boolean; projects: Project[] }>('/api/projects')
  if (!data.success) throw new Error('Error fetching projects')
  return data.projects
}

export function useProjects(initialData?: Project[]) {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes caching to reduce refetches
  })
}

// Individual project fetching for edit forms and details
export async function fetchProject(projectId: string): Promise<ProjectWithRelations> {
  const { data } = await axios.get<{ success: boolean; project: ProjectWithRelations }>(`/api/projects/${projectId}`)
  if (!data.success) throw new Error('Error fetching project')
  return data.project
}

export function useProject(projectId: string) {
  return useQuery<ProjectWithRelations>({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes caching
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (projectData: CreateProjectData) => {
      const { data } = await axios.post<{ success: boolean; data: Project }>('/api/projects/create', projectData)
      if (!data.success) throw new Error('Error creating project')
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, projectData }: { projectId: string; projectData: any }) => {
      const { data } = await axios.put<{ success: boolean; data: ProjectWithRelations }>(`/api/projects/${projectId}`, projectData)
      if (!data.success) throw new Error('Error updating project')
      return data.data
    },
    onSuccess: (data, variables) => {
      // Update both the individual project and the projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] })
    },
  })
}

// New action-based project mutations similar to paths
export function usePublishProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, projectData }: { projectId: string; projectData: any }) => {
      const { data } = await axios.put<{ success: boolean; data: ProjectWithRelations }>(`/api/projects/${projectId}`, {
        ...projectData,
        action: 'publish'
      })
      if (!data.success) throw new Error('Error publishing project')
      return data.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] })
    },
  })
}

export function useUnpublishProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await axios.put<{ success: boolean; data: ProjectWithRelations }>(`/api/projects/${projectId}`, {
        action: 'unpublish'
      })
      if (!data.success) throw new Error('Error unpublishing project')
      return data.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', variables] })
    },
  })
}

export function useDeleteProject(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await axios.delete(`/api/projects/${projectId}`)
      if (!data.success) throw new Error('Error deleting project')
      return data
    },
    onSuccess: () => {
      toast.success('Project deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      // Call the onSuccess callback if provided (e.g., to close modal)
      if (onSuccess) onSuccess()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete project')
      // Call the onSuccess callback even on error to close modal
      if (onSuccess) onSuccess()
    },
  })
}

// Project action mutations for the details sheet
export function useAssignProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, customerId, emailToCustomer }: { projectId: string; customerId: string; emailToCustomer: boolean }) => {
      const { data } = await axios.put(`/api/projects/${projectId}`, { 
        action: 'assign_customer', 
        customerId, 
        emailToCustomer 
      })
      if (!data.success) throw new Error('Error assigning project')
      return data
    },
    onSuccess: (_, { projectId, emailToCustomer }) => {
      toast.success(emailToCustomer ? 'Project assigned to customer! Email sent.' : 'Project assigned to customer successfully!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to assign project')
    },
  })
}

export function useUnassignProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, makePersonal = false, makeDraft = false }: { projectId: string; makePersonal?: boolean; makeDraft?: boolean }) => {
      const { data } = await axios.put(`/api/projects/${projectId}`, { 
        action: 'unassign_customer',
        makePersonal,
        makeDraft
      })
      if (!data.success) throw new Error('Error unassigning project')
      return data
    },
    onSuccess: (_, { projectId }) => {
      toast.success('Project unassigned successfully!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to unassign project')
    },
  })
}

export function useCancelProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await axios.put(`/api/projects/${projectId}`, { action: 'cancel' })
      if (!data.success) throw new Error('Error cancelling project')
      return data
    },
    onSuccess: (_, projectId) => {
      toast.success('Project cancelled successfully!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to cancel project')
    },
  })
}

export function useMarkProjectCompleted() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, completedDate }: { projectId: string; completedDate: Date }) => {
      const { data } = await axios.put(`/api/projects/${projectId}`, { 
        action: 'mark_completed', 
        completedDate: completedDate.toISOString() 
      })
      if (!data.success) throw new Error('Error marking project as completed')
      return data
    },
    onSuccess: (_, { projectId }) => {
      toast.success('Project marked as completed!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to mark project as completed')
    },
  })
}