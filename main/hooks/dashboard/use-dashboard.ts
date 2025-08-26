import { useQuery } from '@tanstack/react-query';

// Types for dashboard data
export type MetricType = "invoices" | "receipts" | "feedbacks" | "projects";

export interface DashboardMetric {
  from: string;
  to: string;
  metric: MetricType;
  series: Array<{
    date: string;
    [key: string]: number | string;
  }>;
  totals: {
    [key: string]: number;
  };
  meta: {
    seriesKeys: string[];
    config: Record<string, { color: string }>;
  };
}

export interface RecentItems {
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    state: string;
    totalAmount: number;
    created_at: string;
    issueDate: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    created_at: string;
    endDate: string;
  }>;
  feedbacks: Array<{
    id: string;
    name: string;
    state: string;
    created_at: string;
    dueDate: string;
    filledOn: string;
  }>;
  receipts: Array<{
    id: string;
    receiptNumber: string;
    state: string;
    creationMethod: string;
    totalAmount: number;
    created_at: string;
    issueDate: string;
  }>;
}

export interface CalendarItem {
  id: string;
  type: 'invoice' | 'project' | 'feedback';
  title: string;
  due_date: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
}

// API fetch functions
async function fetchDashboardMetrics(from: string, to: string, metric: MetricType): Promise<DashboardMetric> {
  const params = new URLSearchParams({
    endpoint: 'metrics',
    from,
    to,
    metric
  });
  
  const response = await fetch(`/api/dashboard?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${metric} metrics`);
  }
  
  return response.json();
}

async function fetchDashboardRecent(): Promise<RecentItems> {
  const params = new URLSearchParams({
    endpoint: 'recent'
  });
  
  const response = await fetch(`/api/dashboard?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch recent items');
  }
  
  return response.json();
}

async function fetchDashboardCalendar(from: string, to: string): Promise<CalendarItem[]> {
  const params = new URLSearchParams({
    endpoint: 'calendar',
    from,
    to
  });
  
  const response = await fetch(`/api/dashboard?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch calendar items');
  }
  
  return response.json();
}

// React Query hooks
export const useDashboardMetrics = (from: string, to: string, metric: MetricType) => {
  return useQuery({
    queryKey: ['dashboard:metrics', { from, to, metric }],
    queryFn: () => fetchDashboardMetrics(from, to, metric),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
  });
};

export const useDashboardRecent = () => {
  return useQuery({
    queryKey: ['dashboard:recent'],
    queryFn: fetchDashboardRecent,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
};

export const useDashboardCalendar = (from: string, to: string) => {
  return useQuery({
    queryKey: ['dashboard:calendar', { from, to }],
    queryFn: () => fetchDashboardCalendar(from, to),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
  });
};

// Export fetch functions for server-side usage
export { fetchDashboardMetrics, fetchDashboardRecent, fetchDashboardCalendar };
