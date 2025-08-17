import { Project } from '@/validation/forms/project';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

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
  organizationId?: {
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

export function useDeleteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await axios.delete(`/api/projects/${projectId}`)
      if (!data.success) throw new Error('Error deleting project')
      return data
    },
    onSuccess: (data, projectId) => {
      // Remove from cache and invalidate projects list
      queryClient.removeQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}