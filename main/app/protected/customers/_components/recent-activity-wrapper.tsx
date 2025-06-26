import { fetchRecentCustomerActivities } from "@/actions/activities/fetch"
import RecentActivity from "./recent-activity"

export default async function RecentActivityWrapper() {
  // Fetch data on the server
  const activities = await fetchRecentCustomerActivities(12)
  
  // Pass data to client component
  return <RecentActivity activities={activities} />
} 