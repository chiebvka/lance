# Dashboard Implementation Strategy

## Overview
Build a performant dashboard that loads instantly every time using Next.js, Supabase, and React Query. The goal is to show real-time data for invoices, projects, feedbacks, and receipts with interactive charts and mini tables.

## Core Strategy: Hybrid Approach

### 1. **Server-Side Prefetching + Client-Side Caching**
- **Server Component**: Prefetch initial data on page load
- **Client Component**: Use React Query for subsequent interactions
- **Result**: First load is instant, subsequent interactions are cached

### 2. **Aggregated Data Endpoints (Not RPC Functions)**
- Create dedicated `/api/dashboard/*` endpoints
- Use SQL aggregation queries instead of RPC functions
- Return pre-computed metrics and time series data

## Data Fetching Architecture

### **Phase 1: Server-Side Prefetching**
```typescript
// In protected/(sidebar)/page.tsx
export default async function DashboardPage() {
  // Prefetch last 30 days of data
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const to = new Date().toISOString()
  
  // Parallel prefetch
  const [metrics, recent, calendar] = await Promise.all([
    fetchDashboardMetrics(from, to),
    fetchDashboardRecent(),
    fetchDashboardCalendar(from, to)
  ])
  
  return (
    <HydrationBoundary state={dehydratedState}>
      <DashboardClient />
    </HydrationBoundary>
  )
}
```

### **Phase 2: Client-Side React Query Hooks**
```typescript
// hooks/dashboard/use-dashboard.ts
export const useDashboardMetrics = (from: string, to: string) => {
  return useQuery({
    queryKey: ['dashboard:metrics', { from, to }],
    queryFn: () => fetchDashboardMetrics(from, to),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
    initialData: prefetchedData // From server
  })
}
```

## API Endpoint Structure

### **1. `/api/dashboard/metrics`**
```typescript
// Returns aggregated time series data
GET /api/dashboard/metrics?from=2025-01-01&to=2025-01-31&metric=invoices

Response:
{
  from: "2025-01-01",
  to: "2025-01-31", 
  bucket: "day",
  metric: "invoices",
  series: [
    {
      date: "2025-01-01",
      sent: 5,
      settled: 3, 
      overdue: 1,
      draft: 2
    }
  ],
  totals: {
    sent: 150,
    settled: 89,
    overdue: 12,
    draft: 45
  }
}
```

### **2. `/api/dashboard/recent`**
```typescript
// Returns latest 5 items from each table
GET /api/dashboard/recent?limit=5

Response:
{
  invoices: [...],
  projects: [...], 
  feedbacks: [...],
  receipts: [...]
}
```

### **3. `/api/dashboard/calendar`**
```typescript
// Returns upcoming due dates
GET /api/dashboard/calendar?from=2025-01-01&to=2025-01-31

Response:
[
  {
    id: "inv_123",
    type: "invoice",
    title: "Website Design",
    dueDate: "2025-01-15",
    status: "sent"
  }
]
```

## SQL Query Strategy

### **Why Not RPC Functions?**
- RPC functions are harder to debug and maintain
- Direct SQL gives better control over performance
- Easier to add indexes and optimize
- More flexible for different query patterns

### **Optimized SQL Queries**

#### **Invoices Metrics Query**
```sql
SELECT 
  date_trunc('day', COALESCE(issueDate, created_at)) as date,
  COUNT(CASE WHEN state = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN state = 'settled' THEN 1 END) as settled,
  COUNT(CASE WHEN state = 'overdue' THEN 1 END) as overdue,
  COUNT(CASE WHEN state = 'draft' THEN 1 END) as draft,
  SUM(CASE WHEN state = 'sent' THEN totalAmount ELSE 0 END) as sent_amount,
  SUM(CASE WHEN state = 'settled' THEN totalAmount ELSE 0 END) as settled_amount,
  SUM(CASE WHEN state = 'overdue' THEN totalAmount ELSE 0 END) as overdue_amount
FROM invoices 
WHERE organizationId = $1 
  AND COALESCE(issueDate, created_at) BETWEEN $2 AND $3
GROUP BY date_trunc('day', COALESCE(issueDate, created_at))
ORDER BY date;
```

#### **Projects Metrics Query**
```sql
SELECT 
  date_trunc('day', created_at) as date,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'inProgress' THEN 1 END) as inProgress,
  COUNT(CASE WHEN status = 'signed' THEN 1 END) as signed,
  COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
FROM projects 
WHERE organizationId = $1 
  AND created_at BETWEEN $2 AND $3
GROUP BY date_trunc('day', created_at))
ORDER BY date;
```

## Performance Optimizations

### **1. Database Indexes**
```sql
-- Invoices
CREATE INDEX CONCURRENTLY idx_invoices_dashboard 
ON invoices(organizationId, issueDate, created_at, state, totalAmount);

-- Projects  
CREATE INDEX CONCURRENTLY idx_projects_dashboard
ON projects(organizationId, created_at, status, endDate);

-- Feedbacks
CREATE INDEX CONCURRENTLY idx_feedbacks_dashboard  
ON feedbacks(organizationId, created_at, state, dueDate, filledOn);

-- Receipts
CREATE INDEX CONCURRENTLY idx_receipts_dashboard
ON receipts(organizationId, created_at, state, creationMethod, totalAmount);
```

### **2. Query Optimization**
- Use `date_trunc('day', ...)` for consistent time bucketing
- COALESCE for fallback date fields
- Server-side aggregation (don't send raw data)
- Limit time ranges (max 12 months per request)

### **3. Caching Strategy**
- **Server**: Prefetch initial data on page load
- **Client**: React Query with 5-minute stale time
- **Database**: Consider materialized views for complex aggregations

## Implementation Phases

### **Phase 1: Foundation (Week 1)**
1. Create dashboard API endpoints structure
2. Implement basic SQL queries for invoices
3. Create React Query hooks
4. Build basic chart component

### **Phase 2: Core Features (Week 2)**  
1. Add projects and feedbacks metrics
2. Implement recent items endpoint
3. Build mini tables component
4. Add calendar endpoint

### **Phase 3: Polish (Week 3)**
1. Add receipts metrics
2. Implement time range controls
3. Add loading states and error handling
4. Performance testing and optimization

### **Phase 4: Advanced Features (Week 4)**
1. Add engagement metrics from customer_activities
2. Implement advanced filtering
3. Add export functionality
4. Final performance tuning

## Why This Approach is Optimal

### **1. Instant First Load**
- Server prefetching eliminates initial loading time
- Hydration boundary provides seamless client takeover

### **2. Efficient Data Transfer**
- Aggregated data instead of raw records
- Time series bucketing reduces payload size
- Smart caching reduces unnecessary requests

### **3. Scalable Architecture**
- React Query handles complex state management
- Dedicated endpoints for different data types
- Easy to add new metrics and features

### **4. Maintainable Code**
- Clear separation of concerns
- Standard API patterns
- Easy to debug and optimize

## Alternative Approaches Considered

### **RPC Functions (Rejected)**
- Harder to debug and maintain
- Less flexible for different query patterns
- More complex error handling

### **Client-Side Aggregation (Rejected)**
- Sends unnecessary data over the wire
- Poor performance with large datasets
- Duplicates logic across devices

### **Real-Time Subscriptions (Considered)**
- Could add later for live updates
- Not needed for initial implementation
- Adds complexity without immediate benefit

## Next Steps

1. **Review and approve this strategy**
2. **Create the API endpoint structure**
3. **Implement the first endpoint (invoices metrics)**
4. **Build the basic chart component**
5. **Iterate and add more features**

This approach will give you an instant-loading dashboard that scales well and maintains good performance as your data grows.

