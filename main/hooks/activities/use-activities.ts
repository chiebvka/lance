import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CustomerActivityWithDetails } from '@/utils/activity-helpers';

export async function fetchRecentCustomerActivities(limit: number = 50, useDateFilter: boolean = true): Promise<CustomerActivityWithDetails[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    useDateFilter: useDateFilter.toString()
  });
  const { data } = await axios.get<{ success: boolean; activities: CustomerActivityWithDetails[] }>(`/api/activities?${params}`);
  if (!data.success) throw new Error('Error fetching activities');
  return data.activities;
}

export function useRecentCustomerActivities(limit: number = 50, useDateFilter: boolean = true, initialData?: CustomerActivityWithDetails[]) {
  return useQuery<CustomerActivityWithDetails[]>({
    queryKey: ['recent-activities', limit, useDateFilter],
    queryFn: () => fetchRecentCustomerActivities(limit, useDateFilter),
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
