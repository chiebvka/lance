
import Feedback from '@/validation/forms/feedback';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export interface Feedbacks {
    id: string
    name: string | null
    questions?: any
    answers?: any
    state: "draft" | "sent" |"unassigned" | "completed" | "overdue" | "cancelled" | null
    filledOn?: string | null
    sentAt?: string | null
    token?: string | null
    projectId: string | null
    customerId: string | null
    organizationId: string | null
    createdBy: string | null
    created_at: string | null   
    updated_at: string | null
    organizationName: string | null
    organizationLogo: string | null
    organizationLogoUrl: string | null // From organization table
    organizationNameFromOrg: string | null // From organization table
    organizationEmailFromOrg: string | null // From organization table
    organizationEmail: string | null
    recepientName: string | null
    recepientEmail: string | null
    templateId: string | null
    dueDate: string | null
    // optional denormalized display fields
    projectNameFromProject?: string | null
    customerName?: string | null
    customerEmail?: string | null
}

export interface FeedbackTemplate {
    id: string
    name: string
    questions: any[]
    isDefault?: boolean
    questionCount?: number
    isOwner?: boolean
}

export interface FeedbackDraft {
    id: string
    name: string
    questions: any[]
    questionCount?: number
    recipientEmail?: string
    customerId?: string
    projectId?: string
    dueDate?: string
    customerName?: string
    projectName?: string
    createdAtFormatted?: string
    message?: string
}


export interface CreateFeedbackData {
    name: string | null
    questions?: any
    answers?: any
    state: "draft" | "sent" |"unassigned" | "completed" | "overdue" | "cancelled" | null
    filledOn?: string | null
    token?: string | null
    projectId?: string | null
    customerId?: string | null
    templateId?: string | null
    sentAt?: string | null
    dueDate?: string | null
    organizationName?: string | null
    organizationLogoUrl?: string | null
    organizationEmail?: string | null
    recepientName?: string | null
    recepientEmail?: string | null
    message?: string | null

    emailToCustomer?: boolean
    
    // Action-based properties for quick actions
    action?: 'mark_completed' | 'restart' | 'cancel' | 'unassign' | 'assign_customer' | 'update_customer' | 'set_unassigned' | 'send_feedback'
    setToDraft?: boolean
}

export async function fetchFeedbacks(): Promise<Feedbacks[]> {
    const { data } = await axios.get<{ success: boolean; feedbacks: Feedbacks[] }>('/api/feedback')
    if (!data.success) throw new Error('Error fetching feedbacks')
    return data.feedbacks
}

export function useFeedbacks(initialData?: Feedbacks[]) {
    return useQuery<Feedbacks[]>({
      queryKey: ['feedbacks'],
      queryFn: fetchFeedbacks,
      initialData,
      staleTime: 1000 * 60 * 5, // 5m
    })
  }

  export function useCreateFeedback() {
    const queryClient = useQueryClient()
    
    return useMutation({
      mutationFn: async (feedbackData: CreateFeedbackData) => {
        const { data } = await axios.post<{ success: boolean; data: Feedback }>('/api/feedback/create', feedbackData)
        if (!data.success) throw new Error('Error creating feedback')
        return data.data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
      },
    })
  }

  export async function fetchFeedback(feedbackId: string): Promise<Feedback> {
    const { data } = await axios.get<{ success: boolean; feedback: Feedback }>(`/api/feedback/${feedbackId}`)
    if (!data.success) throw new Error('Error fetching feedback')
    return data.feedback
  }

  export function useFeedback(feedbackId: string) {
    return useQuery<Feedback>({
      queryKey: ['feedback', feedbackId],
      queryFn: () => fetchFeedback(feedbackId),
      enabled: !!feedbackId,
    })
  }

  export function useUpdateFeedback() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async ({ feedbackId, feedbackData }: { feedbackId: string; feedbackData: Partial<CreateFeedbackData> }) => {
        const { data } = await axios.patch<{ success: boolean; data: Feedbacks }>(`/api/feedback/${feedbackId}`, feedbackData)
        if (!data.success) throw new Error('Error updating feedback')
        return data.data
      },
      onSuccess: (_, { feedbackId }) => {
        queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
        queryClient.invalidateQueries({ queryKey: ['feedback', feedbackId] })
      },
    })
  }

  export function useDeleteFeedback() {
    const queryClient = useQueryClient()
    
    return useMutation({
      mutationFn: async (feedbackId: string) => {
        const { data } = await axios.delete<{ success: boolean; data: Feedback }>(`/api/feedback/${feedbackId}`)
        if (!data.success) throw new Error('Error deleting feedback')
        return data.data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
      },
    })
  }

  // New hooks for templates and drafts with caching
  export async function fetchFeedbackTemplates(): Promise<FeedbackTemplate[]> {
    const { data } = await axios.get<{ success: boolean; templates: FeedbackTemplate[] }>('/api/feedback')
    if (!data.success) throw new Error('Error fetching feedback templates')
    return data.templates || []
  }

  export function useFeedbackTemplates(initialData?: FeedbackTemplate[]) {
    return useQuery<FeedbackTemplate[]>({
      queryKey: ['feedback-templates'],
      queryFn: fetchFeedbackTemplates,
      initialData,
      staleTime: 10 * 60 * 1000, // 10 minutes - templates don't change often
      gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    })
  }

  export async function fetchFeedbackDrafts(): Promise<FeedbackDraft[]> {
    const { data } = await axios.get<{ success: boolean; drafts: FeedbackDraft[] }>('/api/feedback')
    if (!data.success) throw new Error('Error fetching feedback drafts')
    return data.drafts || []
  }

  export function useFeedbackDrafts(initialData?: FeedbackDraft[]) {
    return useQuery<FeedbackDraft[]>({
      queryKey: ['feedback-drafts'],
      queryFn: fetchFeedbackDrafts,
      initialData,
      staleTime: 2 * 60 * 1000, // 2 minutes - drafts change more frequently
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    })
  }

  // Combined hook for all feedback builder data - loads in parallel
  export function useFeedbackBuilderData() {
    const templatesQuery = useFeedbackTemplates()
    const draftsQuery = useFeedbackDrafts()
    
    return {
      templates: templatesQuery.data || [],
      drafts: draftsQuery.data || [],
      isLoading: templatesQuery.isLoading || draftsQuery.isLoading,
      isError: templatesQuery.isError || draftsQuery.isError,
      error: templatesQuery.error || draftsQuery.error,
      // Individual query states for more granular control
      templatesLoading: templatesQuery.isLoading,
      draftsLoading: draftsQuery.isLoading,
      templatesError: templatesQuery.error,
      draftsError: draftsQuery.error,
    }
  }

