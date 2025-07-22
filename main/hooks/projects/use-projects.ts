import { Project } from '@/validation/forms/project';
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'


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