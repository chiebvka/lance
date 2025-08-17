

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

/* ─────────────────────────────
 * Bexforte Paths (aka Links) – content model stored in links.content
 * Only the fields you asked for:
 *  - title (display name of the site)
 *  - url (actual link: http(s)://, mailto:, tel:)
 *  - description (subtitle like “Visit our main website”)
 *  - color (CSS string)
 *  - vibrancy (0–100)
 *  - clickable (boolean)
 *  - type ("link" | "email" | "phone" | "website")  // link & website can be treated the same in UI
 *  - position (number for ordering; 10,20,30…)
 * No randomize, no extras.
 * ───────────────────────────── */

export type PathType = 'link' | 'website' | 'email' | 'phone'

export type PathEntry = {
  id: string            // uuid
  position: number      // 10,20,30… leave gaps; resequence occasionally
  title: string         // name of the site
  url: string           // actual URL/link (http, https, mailto, tel)
  description?: string | null
  color?: string | null // CSS color token (hsl(), hex, rgb...)
  vibrancy?: number | null // 0–100
  clickable?: boolean   // default true
  type: PathType        // behaviour handled by the frontend
}

export type PathsContent = {
  version: number
  entries: PathEntry[]
}

/* ─────────────────────────────
 * links table row (local shape mirroring database.types.ts)
 * If your DB has extra columns (slug, state, etc.), add them here as needed.
 * ───────────────────────────── */
export interface Path {
  id: string
  created_at: string
  createdBy: string | null
  organizationId: string | null
  organizationName: string | null
  organizationLogo: string | null
  organizationLogoUrl: string | null // From organization table
  organizationNameFromOrg: string | null // From organization table
  organizationEmailFromOrg: string | null // From organization table
  organizationEmail: string | null
  recepientName: string | null
  recepientEmail: string | null
  customerId: string | null
  name: string | null
  description: string | null
  updatedAt: string | null
  token: string | null
  state: string | null           // e.g. 'draft' | 'published'
  type: string | null            // e.g. 'public' | 'private'
  private: boolean | null

  content: PathsContent | null   // <= the content above
}

export interface CreatePathData {
  title: string
  url: string
  description?: string | null
  color?: string | null
  name?: string | null
  vibrancy?: number | null
  clickable?: boolean | null
  position?: number | null
  content?: PathsContent | null
  organizationId?: string | null
  customerId?: string | null
  action?: "save_draft" | "publish" | "send_path"
  state?: string | null
  type?: "private" | "public" | ""
  private?: boolean | null
}

/* ─────────────────────────────
 * Helpers
 * ───────────────────────────── */



/* ─────────────────────────────
 * Fetchers
 * ───────────────────────────── */

export async function fetchPaths(): Promise<Path[]> {
  const { data } = await axios.get<{ success: boolean; paths: Path[] }>('/api/paths')
  if (!data.success) throw new Error('Error fetching paths')
  return data.paths 
}

export function usePaths(initialData?: Path[]) {
  return useQuery({
    queryKey: ['paths'],
    queryFn: fetchPaths,
    initialData,
    staleTime: 5 * 60 * 1000,
  })
}


export function useCreatePath() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (pathData: CreatePathData) => {
            const { data } = await axios.post<{ success: boolean; path: Path }>('/api/paths/create', pathData)
            if (!data.success) throw new Error('Error creating path')
            return data.path
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paths'] })
        },
    })
}

export async function fetchPath(pathId: string): Promise<Path> {
  const { data } = await axios.get<{ success: boolean; path: Path }>(`/api/paths/${pathId}`)
  if (!data.success) throw new Error('Error fetching path')
  return data.path
}

export function usePath(pathId: string) {
  return useQuery({
    queryKey: ['path', pathId],
    queryFn: () => fetchPath(pathId),
    enabled: !!pathId,
  })
}


export function useUpdatePath() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ pathId, pathData }: { pathId: string; pathData: Partial<CreatePathData> }) => {
            const { data } = await axios.put<{ success: boolean; path: Path }>(`/api/paths/${pathId}`, pathData)
            if (!data.success) throw new Error('Error updating path')
            return data.path
        },
        onSuccess: (_, { pathId }) => {
            queryClient.invalidateQueries({ queryKey: ['paths'] })
            queryClient.invalidateQueries({ queryKey: ['path', pathId] })
        },
    })
}

export function useDeletePath() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (pathId: string) => {
            const { data } = await axios.delete<{ success: boolean }>(`/api/paths/${pathId}`)
            if (!data.success) throw new Error('Error deleting path')
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paths'] })
        },
    })
}

/* ─────────────────────────────
 * Queries
 * ───────────────────────────── */



/* ─────────────────────────────
 * Mutations – CRUD for the page itself
 * ───────────────────────────── */

// export type CreatePathPageData = {
//   content?: PathsContent | null
//   organizationId?: string | null
//   customerId?: string | null
//   state?: string | null
//   type?: string | null
//   private?: boolean | null
// }

// export type UpdatePathPageData = Partial<CreatePathPageData>

// export function useCreatePathPage() {
//   const qc = useQueryClient()
//   return useMutation({
//     mutationFn: async (payload: CreatePathPageData) => {
//       const safe = { ...payload, content: normalizeContent(payload.content) }
//       const { data } = await axios.post<{ success: boolean; page: PathPage }>('/api/paths/create', safe)
//       if (!data.success) throw new Error('Error creating paths page')
//       return { ...data.page, content: normalizeContent(data.page.content) }
//     },
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ['paths'] })
//     },
//   })
// }

// export function useUpdatePathPage() {
//   const qc = useQueryClient()
//   return useMutation({
//     mutationFn: async ({ pageId, payload }: { pageId: string; payload: UpdatePathPageData }) => {
//       const safe = { ...payload, content: payload.content ? normalizeContent(payload.content) : undefined }
//       const { data } = await axios.put<{ success: boolean; page: PathPage }>(`/api/paths/${pageId}`, safe)
//       if (!data.success) throw new Error('Error updating paths page')
//       return { ...data.page, content: normalizeContent(data.page.content) }
//     },
//     onSuccess: (_res, { pageId }) => {
//       qc.invalidateQueries({ queryKey: ['paths'] })
//       qc.invalidateQueries({ queryKey: ['path', pageId] })
//     },
//   })
// }

// export function useDeletePathPage() {
//   const qc = useQueryClient()
//   return useMutation({
//     mutationFn: async (pageId: string) => {
//       const { data } = await axios.delete<{ success: boolean }>(`/api/paths/${pageId}`)
//       if (!data.success) throw new Error('Error deleting paths page')
//       return data
//     },
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ['paths'] })
//     },
//   })
// }
