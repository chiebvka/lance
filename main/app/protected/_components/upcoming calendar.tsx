"use client"

import React, { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek, isToday, isFuture, isPast } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDashboardCalendar, CalendarItem } from '@/hooks/dashboard/use-dashboard'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from 'next/link'
import { ScrollArea } from '@/components/ui/scroll-area'

// Upcoming item type (using the same structure as CalendarItem from API)
type UpcomingItem = CalendarItem & {
  dueDate: Date; // We'll convert the due_date string to Date for easier handling
}

type Props = {
  embedded?: boolean
}

export default function UpcomingCalendar({ embedded = false }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return now
  })

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Calculate calendar limits (6 months back, 12 months forward)
  const calendarLimits = useMemo(() => {
    const now = new Date()
    const minDate = subMonths(now, 6)
    const maxDate = addMonths(now, 12)
    return { minDate, maxDate }
  }, [])

  // Fetch real calendar data for the entire 18-month window to cache it
  const { data: calendarData = [], isLoading } = useDashboardCalendar(
    calendarLimits.minDate.toISOString(),
    calendarLimits.maxDate.toISOString()
  )

  // Convert API data to UpcomingItem format
  const upcomingItems: UpcomingItem[] = useMemo(() => {
    return calendarData.map(item => ({
      ...item,
      dueDate: new Date(item.due_date)
    }))
  }, [calendarData])

  // Get the start and end of the current month view
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  
  // Get the start and end of the week that contains the month start
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  // Generate all dates for the calendar view
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [calendarStart, calendarEnd])

  // Get upcoming items for the selected date
  const getItemsForDate = (date: Date): UpcomingItem[] => {
    return upcomingItems.filter(item => isSameDay(item.dueDate, date))
  }

  // Get upcoming items for the current month
  const getItemsForMonth = (date: Date): UpcomingItem[] => {
    return upcomingItems.filter(item => isSameMonth(item.dueDate, date))
  }

  // Generate link for each item type
  const getItemLink = (item: UpcomingItem): string => {
    switch (item.type) {
      case 'invoice':
        return `/protected/invoices?invoiceId=${item.id}`
      case 'feedback':
        return `/protected/feedback?feedbackId=${item.id}`
      case 'project':
        return `/protected/projects?projectId=${item.id}`
      default:
        return '#'
    }
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1)
    // Don't allow going before 6 months ago
    if (newMonth >= calendarLimits.minDate) {
      setCurrentMonth(newMonth)
    }
  }

  const goToNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1)
    // Don't allow going beyond 12 months ahead
    if (newMonth <= calendarLimits.maxDate) {
      setCurrentMonth(newMonth)
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get type icon and color
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'invoice':
        return { color: 'text-blue-600', bg: 'bg-blue-100' }
      case 'project':
        return { color: 'text-purple-600', bg: 'bg-purple-100' }
      case 'feedback':
        return { color: 'text-green-600', bg: 'bg-green-100' }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100' }
    }
  }

  // Get background color for calendar dates based on event types
  const getDateBackgroundColor = (date: Date): string => {
    const dayItems = getItemsForDate(date)
    if (dayItems.length === 0) return ''
    
    // If multiple types, use a mixed color approach
    const types = Array.from(new Set(dayItems.map(item => item.type)))
    
    if (types.length === 1) {
      // Single type - use that type's color
      switch (types[0]) {
        case 'invoice':
          return 'bg-blue-200'
        case 'project':
          return 'bg-purple-200'
        case 'feedback':
          return 'bg-green-200'
        default:
          return 'bg-gray-50'
      }
    } else {
      // Multiple types - use a subtle mixed background
      return 'bg-gradient-to-br from-blue-50 via-purple-50 to-green-50'
    }
  }

  // Get indicator color for event types (darker shades for better visibility)
  const getIndicatorColor = (type: string): string => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-400'
      case 'project':
        return 'bg-purple-400'
      case 'feedback':
        return 'bg-green-400'
      default:
        return 'bg-gray-400'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'inProgress':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'completed':
      case 'settled':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const currentMonthItems = getItemsForMonth(currentMonth)

  const HeaderControls = (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPreviousMonth}
        disabled={subMonths(currentMonth, 1) < calendarLimits.minDate}
        className="h-6 w-6 p-0"
      >
        <ChevronLeft className="h-3 w-3" />
      </Button>
      <span className="text-sm font-medium min-w-[60px] text-center">
        {format(currentMonth, 'MMM yyyy')}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={goToNextMonth}
        disabled={addMonths(currentMonth, 1) > calendarLimits.maxDate}
        className="h-6 w-6 p-0"
      >
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  )

  const Body = (
    <div className="pt-0 p-4">
        {/* Month Summary */}
        <div className="mb-3 p-2 bg-lightCard dark:bg-darkCard  border border-primary rounded-none">
          <div className="text-xs  mb-1">This month:</div>
          <div className="flex flex-wrap gap-1">
            {isLoading ? (
              <span className="text-xs ">Loading...</span>
            ) : currentMonthItems.length > 0 ? (
              // Show unique types only once
              Array.from(new Set(currentMonthItems.map(item => item.type))).map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className={`text-xs ${getTypeInfo(type).bg} ${getTypeInfo(type).color} border-0`}
                >
                  {type}
                </Badge>
              ))
            ) : (
              <span className="text-xs ">No upcoming items</span>
            )}
          </div>
        </div>

        {/* Calendar Grid */}

          <div className="space-y-2 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center text-muted-foreground font-medium p-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar dates */}
            <div className="grid grid-cols-7 gap-1">
              <TooltipProvider>
                {calendarDays.map((day, index) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isCurrentDay = isToday(day)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const dayItems = getItemsForDate(day)
                  const hasItems = dayItems.length > 0

                  const dayContent = (
                    <div
                      className={`
                        relative min-h-[30px] p-1 text-xs flex flex-col items-center justify-center rounded-none cursor-pointer transition-colors
                        ${isCurrentMonth 
                          ? ' hover:bg-bexoni/10' 
                          : ''
                        }
                        ${isCurrentDay ? 'bg-primary  hover:bg-purple-300 hover:text-muted-foreground font-semibold' : ''}
                        ${isSelected ? 'bg-bexoni/60 ring-2  ring-purple-300' : ''}
                        ${hasItems ? getDateBackgroundColor(day) : ''}
                      `}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="text-center mb-1">
                        {format(day, 'd')}
                      </div>
                      
                      {/* Item indicators */}
                      {hasItems && (
                        <div className="space-y-1 w-full">
                          {dayItems.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              className={`
                                w-full h-1.5 rounded-none ${getIndicatorColor(item.type)}
                                opacity-80
                              `}
                            />
                          ))}
                          {dayItems.length > 2 && (
                            <div className="w-full h-1.5 bg-gray-300 rounded-none opacity-60" />
                          )}
                        </div>
                      )}
                    </div>
                  )

                  if (hasItems) {
                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          {dayContent}
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs rounded-none">
                          <div className="space-y-2">
                            <div className="font-medium text-sm">
                              {format(day, 'EEEE, MMMM d')}
                            </div>
                            {dayItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-none ${getIndicatorColor(item.type)}`} />
                                  <span className="font-medium capitalize">{item.type}:</span>
                                  <span className="truncate max-w-[120px]">{item.title}</span>
                                </div>
                                <Link 
                                  href={getItemLink(item)}
                                  className="text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View
                                </Link>
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  } else {
                    return <div key={index}>{dayContent}</div>
                  }
                })}
              </TooltipProvider>
            </div>
          </div>
 

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-3 p-2 bg-gray-50 rounded-md">
            <div className="text-xs font-medium mb-2">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </div>
            <div className="space-y-1">
              {getItemsForDate(selectedDate).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getTypeInfo(item.type).bg}`} />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </Badge>
                    <Link 
                      href={getItemLink(item)}
                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
              {getItemsForDate(selectedDate).length === 0 && (
                <span className="text-xs text-gray-500">No items due on this date</span>
              )}
            </div>
          </div>
        )}
    </div>
  )

  if (embedded) {
    // Embedded mode: no Card wrapper or title, only controls + body
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Upcoming Calendar</span>
          </div>
          {HeaderControls}
        </div>
        {Body}
      </div>
    )
  }

  return (
    <Card className="h-full min-h-[320px] w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-gray-600" />
          <CardTitle className="text-lg">Upcoming Calendar</CardTitle>
        </div>
        {HeaderControls}
      </CardHeader>
      <CardContent className="pt-0 p-0">
        {Body}
      </CardContent>
    </Card>
  )
}