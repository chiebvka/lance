import { Project } from '@/validation/forms/project';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

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
    // staleTime: 1000 * 60 * 5, // 5m
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