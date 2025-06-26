"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CustomerActivityWithDetails, formatTimeAgo, generateActivityDisplayText } from "@/utils/activity-helpers"


interface RecentActivityProps {
  activities: CustomerActivityWithDetails[]
}

export default function RecentActivity({ activities = [] }: RecentActivityProps) {
  // Add state for the active filter
  const [activeFilter, setActiveFilter] = useState("all")

  // Define specific colors for each tag type
  const tagColors = {
    invoice: "#22c55e", // Green
    project: "#8b5cf6", // Purple
    receipt: "#f59e0b", // Amber
    feedback: "#3b82f6", // Blue
    service_agreement: "#06b6d4", // Cyan
    other: "#6b7280", // Gray
  }

  // Define all possible activity categories
  const allCategories = [
    { key: "invoice", label: "Invoice Activities", color: tagColors.invoice },
    { key: "project", label: "Project Activities", color: tagColors.project },
    { key: "feedback", label: "Feedback Activities", color: tagColors.feedback },
    { key: "receipt", label: "Receipt Activities", color: tagColors.receipt },
    { key: "service_agreement", label: "Service Agreement Activities", color: tagColors.service_agreement },
  ]

  // Convert activities to display format
  const timelineActivities = activities.map((activity) => {
    const displayInfo = generateActivityDisplayText(activity)
    const customerInitials = activity.customer?.name
      ? activity.customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : "?"
    
    return {
      id: activity.id,
      type: activity.type || "unknown",
      tag: displayInfo.tag,
      customer: {
        name: activity.customer?.name || "Unknown Customer",
        avatar: customerInitials,
      },
      title: displayInfo.title,
      time: formatTimeAgo(activity.created_at),
      description: displayInfo.description,
      status: "info" as const,
    }
  })

  // Filter activities based on the active filter
  const filteredActivities =
    activeFilter === "all" ? timelineActivities : timelineActivities.filter((activity) => activity.tag === activeFilter)

  // Count activities by type for summary
  const activityCounts = timelineActivities.reduce((acc, activity) => {
    acc[activity.tag] = (acc[activity.tag] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className=" my-3">
      {/* Add custom CSS for pulsing animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .pulse-dot {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center flex-col md:flex-row md:justify-between">
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest customer interactions and invoice updates</CardDescription>
                  </div>
                  <div className="flex w-full md:w-auto flex-col md:flex-row md:items-center gap-2">
                    <Select defaultValue="all" value={activeFilter} onValueChange={(value) => setActiveFilter(value)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent className="mx-0 pl-0">
                                                  <SelectItem value="all">All Activities</SelectItem>
                          <SelectItem value="invoice">Invoices</SelectItem>
                          <SelectItem value="project">Projects</SelectItem>
                          <SelectItem value="receipt">Receipts</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="service_agreement">Service Agreements</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {activeFilter === "all" 
                        ? "No activities found. Start sending projects or invoices to see activity here." 
                        : `No ${activeFilter} activities found for this filter.`}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[40vh] px-4">
                    <div className="space-y-6 py-4">
                      {filteredActivities.map((activity, index) => (
                        <div key={activity.id} className="flex gap-4">
                          {/* Timeline connector with pulsing dot */}
                          <div className="flex flex-col items-center gap-2 w-6">
                            <div className="relative h-3 w-3 flex items-center justify-center">
                              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </div>
                            {index !== filteredActivities.length - 1 && (
                              <div className="w-0.5 bg-primary h-full mt-1 mx-auto" />
                            )}
                          </div>

                          {/* Activity content with fixed height */}
                          <div className="flex-1  border-bexoni border p-4 hover:shadow-md transition-shadow min-h-[100px]">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>{activity.customer.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{activity.title}</h4>
                                    {/* Tag with colored square like in the image */}
                                    <div className="flex items-center gap-2">
                                      {/* Pulsing colored square for tag */}
                                      <span className="relative flex h-3 w-3 items-center justify-center">
                                        {/* Pulsing effect */}
                                        <span
                                          className="absolute inset-0 animate-ping "
                                          style={{ 
                                            backgroundColor: tagColors[activity.tag as keyof typeof tagColors] || tagColors.other, 
                                            opacity: 0.4 
                                          }}
                                        />
                                        {/* Solid color square */}
                                        <span
                                          className="relative  h-3 w-3"
                                          style={{ 
                                            backgroundColor: tagColors[activity.tag as keyof typeof tagColors] || tagColors.other 
                                          }}
                                        />
                                      </span>
                                      <span className="text-sm text-gray-600 capitalize">{activity.tag}</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-primary font-medium">{activity.customer.name}</p>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              {activity.description.split(activity.customer.name).map((part, index, array) => (
                                <span key={index}>
                                  {part}
                                  {index < array.length - 1 && (
                                    <span className="text-primary font-medium" style={{ fontWeight: '125%' }}>
                                      {activity.customer.name}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-gray-500">{activity.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center flex-col md:flex-row md:justify-between">
                  <div>
                    <CardTitle>Activity Summary</CardTitle>
                    <CardDescription>Activity breakdown by type</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[40vh] px-4">
                  <div className="space-y-3 py-4">
                    {allCategories.map((category) => {
                      const count = activityCounts[category.key] || 0
                      return (
                        <div key={category.key} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            {/* Pulsing colored square */}
                            <span className="relative flex h-3 w-3 items-center justify-center">
                              {/* Pulsing effect */}
                              <span
                                className="absolute inset-0 animate-ping"
                                style={{ backgroundColor: category.color, opacity: 0.4 }}
                              />
                              {/* Solid color square */}
                              <span
                                className="relative h-3 w-3"
                                style={{ backgroundColor: category.color }}
                              />
                            </span>
                            <span className="text-sm">{category.label}</span>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
