import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { ChartAreaInteractive } from "../_components/chart-area-interactive";
import DashboardCarousel from "../_components/dashboard-carousel";
import { getAuthenticatedUser } from "@/utils/auth";
import { PreviewChartArea } from "../_components/preview-chart-area";
import RecentActivityWrapper from "./customers/_components/recent-activity-wrapper";
import { QueryClient } from "@tanstack/react-query";
import { fetchRecentCustomerActivities } from "@/hooks/activities/use-activities";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { CustomerActivityWithDetails } from "@/utils/activity-helpers";
import { fetchDashboardMetrics, fetchDashboardRecent, fetchDashboardCalendar } from "@/hooks/dashboard/use-dashboard";
import { subMonths, addMonths } from "date-fns";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  // Server-side prefetching for instant dashboard loading
  const queryClient = new QueryClient();
  
  // Date ranges for prefetching
  const to = new Date()
  const from = subMonths(to, 12)
  const calendarFrom = subMonths(to, 6)
  const calendarTo = addMonths(to, 12)

  // Prefetch all dashboard data in parallel
  await Promise.all([
    // Recent customer activities
    queryClient.prefetchQuery({
      queryKey: ['recent-activities', 50, true],
      queryFn: () => fetchRecentCustomerActivities(50, true),
      staleTime: 5 * 60 * 1000,
    }),
    
    // Dashboard metrics for invoices (default chart)
    queryClient.prefetchQuery({
      queryKey: ['dashboard:metrics', { from: from.toISOString(), to: to.toISOString(), metric: 'invoices' }],
      queryFn: () => fetchDashboardMetrics(from.toISOString(), to.toISOString(), 'invoices'),
      staleTime: 5 * 60 * 1000,
    }),
    
    // Recent items for carousel
    queryClient.prefetchQuery({
      queryKey: ['dashboard:recent'],
      queryFn: fetchDashboardRecent,
      staleTime: 2 * 60 * 1000,
    }),
    
    // Calendar items
    queryClient.prefetchQuery({
      queryKey: ['dashboard:calendar', { from: calendarFrom.toISOString(), to: calendarTo.toISOString() }],
      queryFn: () => fetchDashboardCalendar(calendarFrom.toISOString(), calendarTo.toISOString()),
      staleTime: 5 * 60 * 1000,
    }),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className=" w-full p-4 py-5 mx-auto ">
      <div className="w-full ">
        {/* <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div> */}
        <PreviewChartArea 
          initialFrom={from.toISOString()}
          initialTo={to.toISOString()}
        />
        {/* <ChartAreaInteractive /> */}
      <DashboardCarousel />
      </div>
      {/* <div className="mt-6">
        <RecentActivityWrapper />
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div> */}
    </div>
    </HydrationBoundary>
  );
}
