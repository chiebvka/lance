
import Feedback from '@/validation/forms/feedback';
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export async function fetchFeedbacks(): Promise<Feedback[]> {
    const { data } = await axios.get<{ success: boolean; feedbacks: Feedback[] }>('/api/feedback')
    if (!data.success) throw new Error('Error fetching feedbacks')
    return data.feedbacks
}

export function useFeedbacks(initialData?: Feedback[]) {
    return useQuery<Feedback[]>({
      queryKey: ['feedbacks'],
      queryFn: fetchFeedbacks,
      initialData,
      // staleTime: 1000 * 60 * 5, // 5m
    })
  }