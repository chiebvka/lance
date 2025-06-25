"use client"

import { useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function RecentActivity() {
  // Add state for the active filter
  const [activeFilter, setActiveFilter] = useState("all")

  // Define specific colors for each tag type
  const tagColors = {
    invoice: "#22c55e", // Green
    customer: "#8b5cf6", // Purple
    reminder: "#f59e0b", // Amber
    meeting: "#3b82f6", // Blue
    contract: "#06b6d4", // Cyan
    support: "#ef4444", // Red
    payment: "#10b981", // Emerald
    document: "#6366f1", // Indigo
  }

  const timelineActivities = [
    {
      id: 1,
      type: "invoice_paid",
      tag: "invoice",
      customer: {
        name: "TechCorp Solutions",
        avatar: "TC",
      },
      title: "Invoice #INV-2025-042 Paid",
      time: "Today, 10:23 AM",
      description: "Payment received via bank transfer",
      status: "success",
    },
    {
      id: 2,
      type: "invoice_sent",
      tag: "invoice",
      customer: {
        name: "Digital Dynamics",
        avatar: "DD",
      },
      title: "Invoice #INV-2025-043 Sent",
      time: "Today, 9:15 AM",
      description: "Invoice sent via email to mike@digitaldynamics.com",
      status: "info",
    },
    {
      id: 3,
      type: "invoice_overdue",
      tag: "invoice",
      customer: {
        name: "StartupXYZ",
        avatar: "SX",
      },
      title: "Invoice #INV-2025-038 Overdue",
      time: "Yesterday, 4:30 PM",
      description: "Payment is 15 days overdue",
      status: "warning",
    },
    {
      id: 4,
      type: "customer_added",
      tag: "customer",
      customer: {
        name: "Future Tech",
        avatar: "FT",
      },
      title: "New Customer Added",
      time: "Yesterday, 2:45 PM",
      description: "Alex Johnson (alex@futuretech.com) added as a new customer",
      status: "info",
    },
    {
      id: 5,
      type: "reminder_sent",
      tag: "reminder",
      customer: {
        name: "Local Business Co",
        avatar: "LB",
      },
      title: "Payment Reminder Sent",
      time: "Jun 7, 11:20 AM",
      description: "Second reminder sent for Invoice #INV-2025-036",
      status: "info",
    },
    {
      id: 6,
      type: "invoice_paid",
      tag: "invoice",
      customer: {
        name: "Innovation Labs",
        avatar: "IL",
      },
      title: "Invoice #INV-2025-041 Paid",
      time: "Jun 7, 9:05 AM",
      description: "Payment received via credit card",
      status: "success",
    },
    {
      id: 7,
      type: "meeting_scheduled",
      tag: "meeting",
      customer: {
        name: "TechCorp Solutions",
        avatar: "TC",
      },
      title: "Meeting Scheduled",
      time: "Jun 6, 3:15 PM",
      description: "Quarterly review meeting scheduled with Sarah Johnson",
      status: "info",
    },
    {
      id: 8,
      type: "contract_renewed",
      tag: "contract",
      customer: {
        name: "Digital Dynamics",
        avatar: "DD",
      },
      title: "Service Contract Renewed",
      time: "Jun 5, 10:30 AM",
      description: "Annual service contract renewed for 12 months",
      status: "success",
    },
    {
      id: 9,
      type: "support_ticket",
      tag: "support",
      customer: {
        name: "StartupXYZ",
        avatar: "SX",
      },
      title: "Support Ticket Opened",
      time: "Jun 4, 2:20 PM",
      description: "Issue reported with invoice generation system",
      status: "warning",
    },
    {
      id: 10,
      type: "payment_received",
      tag: "payment",
      customer: {
        name: "Growth Co",
        avatar: "GC",
      },
      title: "Payment Received",
      time: "Jun 3, 4:15 PM",
      description: "Automatic payment processed successfully",
      status: "success",
    },
    {
      id: 11,
      type: "invoice_sent",
      tag: "invoice",
      customer: {
        name: "Acme Corp",
        avatar: "AC",
      },
      title: "Invoice #INV-2025-046 Sent",
      time: "Jun 2, 11:45 AM",
      description: "Monthly service invoice sent to accounting department",
      status: "info",
    },
    {
      id: 12,
      type: "customer_updated",
      tag: "customer",
      customer: {
        name: "Tech Solutions Inc",
        avatar: "TS",
      },
      title: "Customer Information Updated",
      time: "Jun 1, 9:30 AM",
      description: "Contact information and billing address updated",
      status: "info",
    },
  ]

  // Filter activities based on the active filter
  const filteredActivities =
    activeFilter === "all" ? timelineActivities : timelineActivities.filter((activity) => activity.tag === activeFilter)

  const upcomingPayments = [
    {
      customer: "Digital Dynamics",
      invoiceNumber: "INV-2025-043",
      amount: "$3,800.00",
      dueDate: "Jun 20, 2025",
      daysLeft: 12,
    },
    {
      customer: "Growth Co",
      invoiceNumber: "INV-2025-044",
      amount: "$2,500.00",
      dueDate: "Jun 15, 2025",
      daysLeft: 7,
    },
    {
      customer: "Future Tech",
      invoiceNumber: "INV-2025-045",
      amount: "$4,200.00",
      dueDate: "Jun 12, 2025",
      daysLeft: 4,
    },
  ]

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
                        <SelectItem value="customer">Customers</SelectItem>
                        <SelectItem value="reminder">Reminders</SelectItem>
                        <SelectItem value="meeting">Meetings</SelectItem>
                        <SelectItem value="contract">Contracts</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="payment">Payments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No activities found for this filter.</p>
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
                                          style={{ backgroundColor: tagColors[activity.tag as keyof typeof tagColors], opacity: 0.4 }}
                                        />
                                        {/* Solid color square */}
                                        <span
                                          className="relative  h-3 w-3"
                                          style={{ backgroundColor: tagColors[activity.tag as keyof typeof tagColors] }}
                                        />
                                      </span>
                                      <span className="text-sm text-gray-600 capitalize">{activity.tag}</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-500">{activity.customer.name}</p>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
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
                  {Object.entries(tagColors).map(([tag, color]) => {
                    const count = timelineActivities.filter((a) => a.tag === tag).length
                    if (count === 0) return null
                    return (
                      <div key={tag} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {/* Pulsing colored square */}
                          <span className="relative flex h-3 w-3 items-center justify-center">
                            {/* Pulsing effect */}
                            <span
                              className="absolute inset-0  animate-ping"
                              style={{ backgroundColor: color, opacity: 0.4 }}
                            />
                            {/* Solid color square */}
                            <span
                              className="relative  h-3 w-3"
                              style={{ backgroundColor: color }}
                            />
                          </span>
                          <span className="text-sm capitalize">{tag} Activities</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    )
                  })}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
