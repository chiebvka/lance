import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Wall } from './use-walls'

interface PublicWallParams {
  wallId: string
  token?: string
}

interface PublicWallMetadata {
  name: string | null
  description: string | null
  organizationName: string | null
}

export async function fetchPublicWall({ wallId, token }: PublicWallParams): Promise<Wall> {
  const params = new URLSearchParams()
  if (token) {
    params.append('token', token)
  }
  
  const url = `/api/walls/public/${wallId}${params.toString() ? `?${params.toString()}` : ''}`
  const { data } = await axios.get<{ success: boolean; wall: Wall }>(url)
  
  if (!data.success) throw new Error('Error fetching public wall')
  return data.wall
}

export async function fetchPublicWallMetadata(wallId: string): Promise<PublicWallMetadata> {
  const { data } = await axios.get<{ success: boolean; metadata: PublicWallMetadata }>(`/api/walls/public/${wallId}/metadata`)
  
  if (!data.success) throw new Error('Error fetching public wall metadata')
  return data.metadata
}

export function usePublicWall(wallId: string, token?: string) {
  return useQuery<Wall>({
    queryKey: ['publicWall', wallId, token],
    queryFn: () => fetchPublicWall({ wallId, token }),
    enabled: !!wallId,
    staleTime: 5 * 60 * 1000, // 5 minutes caching
  })
}

export function usePublicWallMetadata(wallId: string) {
  return useQuery<PublicWallMetadata>({
    queryKey: ['publicWallMetadata', wallId],
    queryFn: () => fetchPublicWallMetadata(wallId),
    enabled: !!wallId,
    staleTime: 10 * 60 * 1000, // 10 minutes caching for metadata
  })
}
