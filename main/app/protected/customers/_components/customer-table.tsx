"use client"

import Pagination from '@/components/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Clock, Filter, Search, Star, Bubbles, InfoIcon } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import EditCustomer from './edit-customer';
import { cn } from '@/lib/utils';
import CustomerRatingMeter from '@/components/customer-rating-meter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  website?: string
  contactPerson?: string
  address?: string
  addressLine2?: string
  invoiceCount: number
  projectCount: number
  receiptCount: number
  feedbackCount: number
  rating: number
  created_at: string
  lastActivity: string
  avatar?: string
}


// Define the color scheme from the activity component
const tagColors = {
  invoice: "#22c55e", // Green
  project: "#8b5cf6", // Purple
  receipt: "#f59e0b", // Amber
  feedback: "#3b82f6", // Blue
}

type Props = {
  customer: Customer[] | null
}

export default function CustomerTable({ customer }: Props) {
  const [isClient, setIsClient] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setIsClient(true)
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      const data = await response.json()
      
      if (data.success) {
        setCustomers(data.customers)
      } else {
        console.error('Failed to fetch customers:', data.error)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsEditSheetOpen(true)
  }

  const handleEditSuccess = () => {
    closeRef.current?.click()
    setIsEditSheetOpen(false)
    fetchCustomers() // Refresh the customer list
  }

  const [sortBy, setSortBy] = useState<"lastActivity" | "created_at" | "rating">("lastActivity")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState<"all" | "high" | "medium" | "low">("all")

  if (!isClient) {
    return null;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading customers...</div>
  }

  const customersToDisplay = customer || customers

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

    // Sort and filter customers based on selected criteria
    const sortedCustomers = customersToDisplay
    .filter(
      (customer) =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((customer) => {
      if (filterBy === "all") return true
      if (filterBy === "high") return customer.rating >= 4.5
      if (filterBy === "medium") return customer.rating >= 4.0 && customer.rating < 4.5
      if (filterBy === "low") return customer.rating < 4.0
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "lastActivity":
          // Simple sorting by activity string - in real app you'd use actual dates
          const activityOrder = [
            "minutes ago",
            "hours ago",
            "day ago",
            "days ago",
            "week ago",
            "weeks ago",
            "month ago",
          ]
          const aIndex = activityOrder.findIndex((term) => a.lastActivity.includes(term))
          const bIndex = activityOrder.findIndex((term) => b.lastActivity.includes(term))
          return aIndex - bIndex
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "rating":
          return b.rating - a.rating
        default:
          return 0
      }
    })

  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCustomers = sortedCustomers.slice(startIndex, startIndex + itemsPerPage)


  const getActivityColor = (activity: string) => {
    if (activity.includes("minutes") || activity.includes("hour")) return "bg-green-500"
    if (activity.includes("day")) return "bg-blue-500"
    if (activity.includes("week")) return "bg-yellow-500"
    return "bg-gray-500"
  }




  return (
    <div className="p-4 lg:p-6 space-y-6">

    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
          <Select value={sortBy} onValueChange={(value: "lastActivity" | "created_at" | "rating") => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastActivity">Last Activity</SelectItem>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="rating">Rating Score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Priority:</span>
          <Select value={filterBy} onValueChange={(value: "all" | "high" | "medium" | "low") => setFilterBy(value)}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="high">High Priority (4.5+)</SelectItem>
              <SelectItem value="medium">Medium Priority (4.0-4.4)</SelectItem>
              <SelectItem value="low">Low Priority (&lt;4.0)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Showing {sortedCustomers.length} customers</span>
      </div>
    </div>

    <div className="relative">

      <div className="space-y-6">
        {paginatedCustomers.map((customer, index) => (
          <div key={customer.id} className="relative flex items-start gap-6">

            {/* Customer card */}
            <div
              className="flex-1 cursor-pointer hover:shadow-md border-bexoni transition-shadow border p-4"
              onClick={() => handleCustomerClick(customer)}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={customer.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-3">
                      <p className="text-base text-primary font-medium truncate">{customer.name}</p> 
                      <div className="hidden sm:block w-[3px] h-4 bg-bexoni flex-shrink-0" />
                      <div className="flex items-center gap-4 flex-1">
                        <p className="text-sm text-muted-foreground font-medium truncate">{customer.email}</p>
                        <div className="flex items-center gap-2 ml-auto">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  <span className="text-xs text-primary font-medium underline decoration-primary">
                                    Customer Rating
                                  </span>
                                  <InfoIcon className="h-3 w-3 text-primary" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-2">
                                  <p className="font-semibold">Customer Reliability Score</p>
                                  <p className="text-xs">This rating is calculated based on:</p>
                                  <ul className="text-xs space-y-1">
                                    <li>• Invoice payment completion rate </li>
                                    <li>• On-time payment history </li>
                                    <li>• Customer project volume history </li>
                                    <li>• Customer interaction rate </li>
                                    <li>• Penalties for overdue invoices</li>
                                    {/* <li>• On-time payment history (30%)</li> */}
                                    {/* <li>• Invoice payment completion rate (70%)</li> */}
                                  </ul>
                                  <p className="text-xs text-muted-foreground pt-1">
                                    Higher scores indicate more reliable payment behavior.
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <CustomerRatingMeter 
                            rating={customer.rating} 
                            size="sm" 
                            showLabel={false}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">Last activity: {customer.lastActivity}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 lg:flex lg:gap-6 gap-3 text-center">
                  <div>
                    <div className="text-lg lg:text-xl font-bold" style={{ color: tagColors.invoice }}>{customer.invoiceCount}</div>
                    <div className="text-xs text-muted-foreground">Invoices</div>
                  </div>
                  <div>
                    <div className="text-lg lg:text-xl font-bold" style={{ color: tagColors.project }}>{customer.projectCount}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div>
                    <div className="text-lg lg:text-xl font-bold" style={{ color: tagColors.receipt }}>{customer.receiptCount}</div>
                    <div className="text-xs text-muted-foreground">Receipts</div>
                  </div>
                  <div>
                    <div className="text-lg lg:text-xl font-bold" style={{ color: tagColors.feedback }}>{customer.feedbackCount}</div>
                    <div className="text-xs text-muted-foreground">Feedback</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={itemsPerPage}
      totalItems={sortedCustomers.length}
      onPageChange={setCurrentPage}
      onPageSizeChange={setItemsPerPage}
      itemName="customers"
    />



    {/* Edit Customer Sheet */}
    {selectedCustomer && (
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="right" bounce="right" withGap={true} className={cn("flex flex-col", "w-full sm:w-3/4 md:w-1/2 lg:w-[40%]")}>
          <SheetTitle className='sr-only'>
            Edit Customer
          </SheetTitle>
          <ScrollArea className="flex-1 pr-4">
            <EditCustomer 
              customer={selectedCustomer} 
              onSuccess={handleEditSuccess} 
              onLoadingChange={setIsSubmitting} 
            />
          </ScrollArea>
          <SheetFooter className='pt-4'>
            <SheetClose asChild>
              <Button variant="ghost" ref={closeRef}>Cancel</Button>
            </SheetClose>
            <Button type="submit" form="edit-customer-form" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.8s]" />
                  Updating customer...
                </>
              ) : (
                'Update Customer'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )}
  </div>
  )
}