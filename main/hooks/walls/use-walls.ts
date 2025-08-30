import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

export type WallContent = {
    version: number
    blocks: Block[]
}
  
type BlockBase = {
    id: string          
    position: number     
    visible?: boolean
}
  
export type HeadingBlock = BlockBase & {
    type: 'heading'
    props: { text: string; level?: 1|2|3|4|5|6 }
}

export type TextBlock = BlockBase & {
    type: 'text'
    props: { markdown?: string; rich?: unknown }   // choose one in UI
}

export type LinkBlock = BlockBase & {
    type: 'link'
    props: { title: string; url: string; description?: string; target?: '_self'|'_blank'; rel?: string; icon?: string }
}

export type ImageBlock = BlockBase & {
    type: 'image'
    props: { fileId: string; alt?: string; caption?: string; width?: number; height?: number }
}

export type VideoBlock = BlockBase & {
    type: 'video'
    props: { provider: 'youtube'|'vimeo'|'file'|'url'; url?: string; fileId?: string; title?: string; autoplay?: boolean; controls?: boolean; loop?: boolean }
}

export type FileBlock = BlockBase & {
    type: 'file'
    props: { fileId: string; label?: string; size?: number; mime?: string }
}
  
export type Block = HeadingBlock | TextBlock | LinkBlock | ImageBlock | VideoBlock | FileBlock

export interface Wall {
    id: string
    name: string | null
    description: string | null
    state: string | null             // e.g. 'draft' | 'published'
    slug: string | null              // null when draft
    token: string | null
    type: string | null
    issueDate: string | null
    updatedAt: string | null
    created_at: string
    notes: string | null
    organizationId: string | null
    customerId: string | null
    projectId: string | null
    organizationName: string | null
    organizationLogo: string | null
    organizationLogoUrl: string | null // From organization table
    organizationNameFromOrg: string | null // From organization table
    organizationEmailFromOrg: string | null // From organization table
    organizationEmail: string | null
    projectNameFromProject: string | null
    recepientName: string | null
    recepientEmail: string | null
    private: boolean | null

    // the rich page content:
    content: WallContent | null      // see below
}

export interface CreateWallData {
    name: string
    description?: string | null
    notes?: string | null
    content?: WallContent
    customerId?: string | null
    projectId?: string | null
    recipientEmail?: string | null
    recepientName?: string | null
    protect?: boolean
    action?: "save_draft" | "publish" | "send_wall"
    type?: "private" | "public" | ""
}

export async function fetchWalls(): Promise<Wall[]> {
    const { data } = await axios.get<{ success: boolean; walls: Wall[] }>('/api/walls')
    if (!data.success) throw new Error('Error fetching walls')
    return data.walls
}

export function useWalls(initialData?: Wall[]) {
    return useQuery<Wall[]>({
        queryKey: ['walls'],
        queryFn: fetchWalls,
        initialData,
        staleTime: 5 * 60 * 1000, // 5 minutes caching to reduce refetches
    })
}

export function useCreateWall() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async (wallData: CreateWallData) => {
            const { data } = await axios.post<{ success: boolean; wall: Wall }>('/api/walls/create', wallData)
            if (!data.success) throw new Error('Error creating wall')
            return data.wall
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['walls'] })
        },
    })
}

export async function fetchWall(wallId: string): Promise<Wall> {
    const { data } = await axios.get<{ success: boolean; wall: Wall }>(`/api/walls/${wallId}`)
    if (!data.success) throw new Error('Error fetching wall')
    return data.wall
}

export function useWall(wallId: string) {
    return useQuery<Wall>({
        queryKey: ['wall', wallId],
        queryFn: () => fetchWall(wallId),
        enabled: !!wallId,
    })
}

export function useUpdateWall() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async ({ wallId, wallData }: { wallId: string; wallData: Partial<CreateWallData> }) => {
            const { data } = await axios.put<{ success: boolean; wall: Wall }>(`/api/walls/${wallId}`, wallData)
            if (!data.success) throw new Error('Error updating wall')
            return data.wall
        },
        onSuccess: (_, { wallId }) => {
            queryClient.invalidateQueries({ queryKey: ['walls'] })
            queryClient.invalidateQueries({ queryKey: ['wall', wallId] })
        },
    })
}

export function useDeleteWall(onSuccess?: () => void) {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async (wallId: string) => {
            const { data } = await axios.delete(`/api/walls/${wallId}`)
            if (!data.success) throw new Error('Error deleting wall')
            return data
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['walls'] })
            if (onSuccess) onSuccess()
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'Failed to delete wall')
            if (onSuccess) onSuccess()
        },
    })
}

// Wall action mutations for the details sheet
export function usePublishWall() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ wallId, isPrivate, customerId, emailToCustomer }: { 
      wallId: string; 
      isPrivate: boolean; 
      customerId?: string | null; 
      emailToCustomer?: boolean 
    }) => {
      const { data } = await axios.put(`/api/walls/${wallId}`, { 
        action: 'publish',
        protect: isPrivate,
        customerId: customerId || null,
        emailToCustomer: emailToCustomer || false
      })
      if (!data.success) throw new Error('Error publishing wall')
      return data
    },
    onSuccess: (_, { wallId }) => {
      toast.success('Wall published successfully!')
      queryClient.invalidateQueries({ queryKey: ['walls'] })
      queryClient.invalidateQueries({ queryKey: ['wall', wallId] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to publish wall')
    },
  })
}

export function useUnpublishWall() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (wallId: string) => {
      const { data } = await axios.put(`/api/walls/${wallId}`, { 
        action: 'save_draft',
        protect: false,
        customerId: null
      })
      if (!data.success) throw new Error('Error unpublishing wall')
      return data
    },
    onSuccess: (_, wallId) => {
      toast.success('Wall unpublished successfully!')
      queryClient.invalidateQueries({ queryKey: ['walls'] })
      queryClient.invalidateQueries({ queryKey: ['wall', wallId] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to unpublish wall')
    },
  })
}

export function useChangeWallPrivacy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ wallId, isPrivate, customerId, emailToCustomer }: { 
      wallId: string; 
      isPrivate: boolean; 
      customerId?: string | null; 
      emailToCustomer?: boolean 
    }) => {
      const { data } = await axios.put(`/api/walls/${wallId}`, { 
        action: 'save_draft',
        protect: isPrivate,
        customerId: customerId || null,
        emailToCustomer: emailToCustomer || false
      })
      if (!data.success) throw new Error('Error changing wall privacy')
      return data
    },
    onSuccess: (_, { wallId }) => {
      toast.success('Wall privacy updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['walls'] })
      queryClient.invalidateQueries({ queryKey: ['wall', wallId] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to change wall privacy')
    },
  })
}

export function useAssignWallToCustomer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ wallId, customerId, emailToCustomer }: { 
      wallId: string; 
      customerId: string; 
      emailToCustomer: boolean 
    }) => {
      const { data } = await axios.put(`/api/walls/${wallId}`, { 
        action: 'send_wall',
        protect: true,
        customerId,
        emailToCustomer
      })
      if (!data.success) throw new Error('Error assigning wall to customer')
      return data
    },
    onSuccess: (_, { emailToCustomer }) => {
      toast.success(emailToCustomer ? 'Wall assigned and email sent!' : 'Wall assigned to customer successfully!')
      queryClient.invalidateQueries({ queryKey: ['walls'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to assign wall to customer')
    },
  })
}



