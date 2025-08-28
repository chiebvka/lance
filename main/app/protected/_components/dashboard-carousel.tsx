"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Plus, Calendar, TrendingUp, MessagesSquare, ReceiptText, Receipt, FolderKanban } from "lucide-react"
import Autoplay from "embla-carousel-autoplay"
import UpcomingCalendar from "./upcoming calendar"
import SegmentedBar from "@/components/segment-bar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRecentCustomerActivities } from "@/hooks/activities/use-activities"
import { generateActivityDisplayText } from "@/utils/activity-helpers"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useDashboardRecent } from "@/hooks/dashboard/use-dashboard"

export default function DashboardCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  )
  
  const [api, setApi] = React.useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  
  // Fetch real data
  const { data: recentData, isLoading: isLoadingRecent } = useDashboardRecent()
  
  // Use real data or fallback to empty arrays
  const recentInvoices = recentData?.invoices || []
  const recentProjects = recentData?.projects || []  
  const recentFeedbacks = recentData?.feedbacks || []
  const recentReceipts = recentData?.receipts || []

  // --------------------
  // Ratings (calculated from real data)
  // --------------------
  const now = new Date()
  const totalInvoices = recentInvoices.length
  const paidInvoices = recentInvoices.filter(inv => inv.state === 'settled').length
  const overdueInvoices = recentInvoices.filter(inv => inv.state === 'overdue').length
  const paidPercentage = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 60 : 0
  const overduePenalty = totalInvoices > 0 ? Math.min(10, (overdueInvoices / totalInvoices) * 10) : 0
  const invoiceRating = Math.round(Math.max(0, Math.min(100, paidPercentage - overduePenalty + 40))) // Base 40 for other factors

  const totalNonDraftFeedbacks = recentFeedbacks.filter(f => f.state !== 'draft').length
  const completedFeedbacks = recentFeedbacks.filter(f => f.state === 'completed').length
  const overdueFeedbacks = recentFeedbacks.filter(f => f.state === 'overdue').length
  const feedbackBase = totalNonDraftFeedbacks > 0 ? (completedFeedbacks / totalNonDraftFeedbacks) * 100 : 0
  const feedbackRating = Math.max(0, Math.round(feedbackBase - overdueFeedbacks * 10))

  // Tag color helpers (mirrors table column styles)
  const getInvoiceStateColor = (state: string) => {
    switch ((state || '').toLowerCase()) {
      case 'draft':
        return 'bg-blue-100 text-blue-800'
      case 'sent':
        return 'bg-yellow-100 text-yellow-800'
      case 'settled':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'unassigned':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-stone-300 text-stone-800 line-through'
    }
  }
  const getFeedbackStateColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'draft':
        return 'bg-blue-100 text-blue-800'
      case 'sent':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  const getReceiptCreationColor = (method: string) => {
    switch ((method || '').toLowerCase()) {
      case 'manual':
        return 'bg-sky-100 text-sky-800'
      case 'auto':
        return 'bg-orange-100 text-orange-800'
      case 'invoice':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-stone-300 text-stone-800 line-through'
    }
  }
  const getProjectStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      case 'inprogress':
        return 'bg-yellow-100 text-yellow-800'
      case 'signed':
        return 'bg-lime-100 text-lime-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-stone-300 text-stone-800 line-through'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Dashboard cards data
  const dashboardCards = [
    {
      title: "Calendar",
      icon: Calendar,
      action: <span className="text-sm text-muted-foreground">2025</span>,
      content: (
        <div className="px-6 h-full flex flex-col">
          <ScrollArea className="flex-1 min-h-0 overflow-hidden">
            <UpcomingCalendar embedded />
          </ScrollArea>
        </div>
      )
    },
    {
      title: "Invoices",
      icon: Receipt,
      action: (
        <Link href="/protected/invoices">
          <Button size="icon" className="h-7 w-7 rounded-none p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      ),
      content: (
        <div className="flex flex-col h-full px-6 min-w-0">
          <div className="flex-shrink-0">
            <SegmentedBar score={invoiceRating} title="" subtitle="" />
          </div>

          {/* Header row */}
          <div className="flex justify-between text-sm text-primary font-bold my-3 flex-shrink-0">
            <span>Invoice Number</span>
            <span className="text-right">State</span>
          </div>
          
          {/* Scrollable content area */}
          <ScrollArea className="flex-1 min-h-0 px-0 overflow-hidden">
            <div className="space-y-2">
              {isLoadingRecent ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : recentInvoices.length === 0 ? (
                <div className="text-sm text-muted-foreground">No invoices found</div>
              ) : (
                recentInvoices.map((inv) => (
                  <Link key={inv.id} href={`/protected/invoices?invoiceId=${inv.id}`} className="block">
                    <div className="flex items-center justify-between w-full hover:bg-bexoni/10 py-1">
                      <p className="text-xs truncate">{inv.invoiceNumber || 'Invoice'}</p>
                      <Badge className={`text-xs capitalize ${getInvoiceStateColor(inv.state)}`}>{inv.state}</Badge>
                    </div>
                    <Separator className="w-full" />
                  </Link>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )
    },
    {
      title: "Feedback",
      icon: MessagesSquare,
      action: (
        <Link href="/protected/feedback/create">
          <Button size="icon" className="h-7 w-7 rounded-none p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      ),
      content: (
        <div className="flex flex-col h-full px-6 min-w-0">
          <div className="flex-shrink-0">
            <SegmentedBar score={feedbackRating} title="" subtitle="" />
          </div>
          
          <div className="flex justify-between text-sm text-primary font-bold my-3 flex-shrink-0">
            <span>Name</span>
            <span className="text-right">State</span>
          </div>
          
          {/* Scrollable content area */}
          <ScrollArea className="flex-1 min-h-0 overflow-hidden">
            <div className="space-y-2">
              {isLoadingRecent ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : recentFeedbacks.length === 0 ? (
                <div className="text-sm text-muted-foreground">No feedback found</div>
              ) : (
                recentFeedbacks.map((f) => (
                  <Link key={f.id} href={`/protected/feedback?feedbackId=${f.id}`} className="block">
                    <div className="flex items-center justify-between w-full hover:bg-bexoni/10 py-1">
                      <p className="text-xs truncate">{f.name || 'Feedback'}</p>
                      <Badge className={`text-xs capitalize ${getFeedbackStateColor(f.state)}`}>{f.state}</Badge>
                    </div>
                    <Separator className="w-full" />
                  </Link>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )
    },
    {
      title: "Projects",
      icon: FolderKanban,
      action: (
        <Link href="/protected/projects">
          <Button size="icon" className="h-7 w-7 rounded-none p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      ),
      content: (
        <div className="flex flex-col h-full px-6 min-w-0">
          <div className="flex justify-between text-sm text-primary font-bold my-3 flex-shrink-0">
            <span>Name</span>
            <span className="text-right">State</span>
          </div>
          
          {/* Scrollable content area */}
          <ScrollArea className="flex-1 min-h-0  overflow-hidden">
            <div className="space-y-2">
              {isLoadingRecent ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : recentProjects.length === 0 ? (
                <div className="text-sm text-muted-foreground">No projects found</div>
              ) : (
                recentProjects.map((p) => (
                  <Link key={p.id} href={`/protected/projects?projectId=${p.id}`} className="block">
                    <div className="flex items-center justify-between w-full hover:bg-bexoni/10 py-1">
                      <p className="text-xs truncate">{p.name || 'Project'}</p>
                      <Badge className={`text-xs capitalize ${getProjectStatusColor(p.status)}`}>{p.status}</Badge>
                    </div>
                    <Separator className="w-full" />
                  </Link>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )
    },
    {
      title: "Receipts",
      icon: ReceiptText,
      action: (
        <Link href="/protected/receipts">
          <Button size="icon" className="h-7 w-7 rounded-none p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      ),
      content: (
        <div className="flex flex-col h-full px-6 min-w-0">
          <div className="flex justify-between text-sm text-primary font-bold my-3 flex-shrink-0">
            <span>Receipt Number</span>
            <span className="text-right">Creation Method</span>
          </div>
          
          {/* Scrollable content area */}
          <ScrollArea className="flex-1 min-h-0 overflow-hidden">
            <div className="space-y-2">
              {isLoadingRecent ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : recentReceipts.length === 0 ? (
                <div className="text-sm text-muted-foreground">No receipts found</div>
              ) : (
                recentReceipts.map((r) => (
                  <Link key={r.id} href={`/protected/receipts?receiptId=${r.id}`} className="block">
                    <div className="flex items-center justify-between w-full hover:bg-bexoni/10 py-1">
                      <p className="text-xs truncate">{r.receiptNumber || 'Receipt'}</p>
                      <Badge className={`text-xs capitalize ${getReceiptCreationColor(r.creationMethod)}`}>{r.creationMethod}</Badge>
                    </div>
                    <Separator className="w-full" />
                  </Link>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )
    },
    {
      title: "Recent Activity",
      icon: TrendingUp,
      action: <span className="text-sm text-muted-foreground">All</span>,
      content: (
        <div className="px-6 h-full flex flex-col">
          <ScrollArea className="flex-1 min-h-0 overflow-hidden">
            <RecentActivityMini />
          </ScrollArea>
        </div>
      )
    },
  ]
  
  React.useEffect(() => {
    if (!api) return
    
    const onSelect = () => {
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }
    
    api.on('select', onSelect)
    api.on('reInit', onSelect)
    onSelect()
    
    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api])
  
  return (
    <div className="space-y-6 max-w-8xl mx-auto">
      <div className="my-6 relative">
        <h2 className="text-lg font-bold text-primary">Quick view</h2>
        {/* <p className="text-gray-600">Manage your business metrics and activities</p> */}
        
        {/* Navigation arrows positioned at top right */}
        <div className="absolute top-0 right-0 flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => api?.scrollPrev()}
            disabled={!canScrollPrev}
            className="hidden border border-primary h-8 w-8 lg:flex"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => api?.scrollNext()}
            disabled={!canScrollNext}
            className="hidden border border-primary h-8 w-8 lg:flex"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Button>
        </div>
      </div>
      
      <Carousel
        plugins={[plugin.current]}
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full mb-6"
        setApi={setApi}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {dashboardCards.map((card, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-2/3 md:basis-1/2 lg:basis-2/5 xl:basis-1/3 2xl:basis-1/4">
              <Card className="h-full min-h-[420px] max-h-[420px] flex flex-col">
                <CardHeader className="flex flex-row items-center  w-full justify-between space-y-0 my-4 pb-2 flex-shrink-0">
                  <div className="flex space-x-2 items-center">
                    <card.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </div>
                  <div className="flex items-center">
                    {card.action}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden">
                  {card.content}
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}

// Mini recent activity card for carousel
function RecentActivityMini() {
  const { data: activities = [] } = useRecentCustomerActivities(10, true)
  const items = activities.map(a => {
    const d = generateActivityDisplayText(a)
    return {
      id: a.id,
      title: d.title,
      tag: d.tag,
      time: a.created_at,
    }
  })

  const tagColors: Record<string, string> = {
    invoice: '#22c55e',
    project: '#8b5cf6',
    receipt: '#f59e0b',
    feedback: '#3b82f6',
    service_agreement: '#06b6d4',
    other: '#6b7280',
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2 ">
          {items.map(it => (
            <div key={it.id} className="flex items-center justify-between py-1 text-sm">
              <span className="truncate flex items-center gap-2">
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inset-0 animate-ping" style={{ backgroundColor: tagColors[it.tag] || tagColors.other, opacity: 0.4 }} />
                  <span className="relative h-3 w-3" style={{ backgroundColor: tagColors[it.tag] || tagColors.other }} />
                </span>
                {it.title}
              </span>
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs capitalize">{it.tag.replace('_', ' ')}</span>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">No recent activity</div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}