// ... existing imports ...
import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectClientSkeleton() {
  // Adjust columns to match your table
  const columns = 8
  const rows = 5

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="rounded-none border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-bexoni/10">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b">
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}