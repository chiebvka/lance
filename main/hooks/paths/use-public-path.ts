import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Path } from './use-paths'

interface PublicPathParams {
  pathId: string
  token?: string
}

interface PublicPathMetadata {
  name: string | null
  description: string | null
  organizationName: string | null
}

export async function fetchPublicPath({ pathId, token }: PublicPathParams): Promise<Path> {
  const params = new URLSearchParams()
  if (token) {
    params.append('token', token)
  }
  
  const url = `/api/paths/public/${pathId}${params.toString() ? `?${params.toString()}` : ''}`
  const { data } = await axios.get<{ success: boolean; path: Path }>(url)
  
  if (!data.success) throw new Error('Error fetching public path')
  return data.path
}

export async function fetchPublicPathMetadata(pathId: string): Promise<PublicPathMetadata> {
  const { data } = await axios.get<{ success: boolean; metadata: PublicPathMetadata }>(`/api/paths/public/${pathId}/metadata`)
  
  if (!data.success) throw new Error('Error fetching public path metadata')
  return data.metadata
}

export function usePublicPath(pathId: string, token?: string) {
  return useQuery<Path>({
    queryKey: ['publicPath', pathId, token],
    queryFn: () => fetchPublicPath({ pathId, token }),
    enabled: !!pathId,
    staleTime: 5 * 60 * 1000, // 5 minutes caching
  })
}

export function usePublicPathMetadata(pathId: string) {
  return useQuery<PublicPathMetadata>({
    queryKey: ['publicPathMetadata', pathId],
    queryFn: () => fetchPublicPathMetadata(pathId),
    enabled: !!pathId,
    staleTime: 10 * 60 * 1000, // 10 minutes caching for metadata
  })
}
