"use client"

import Pagination from '@/components/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Clock, Filter, Search, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';



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
  openProjects: number
  pendingContracts: number
  rating: number
  dateCreated: string
  status: "active" | "inactive" | "pending"
  lastActivity: string
  completedRevenue: number
  avatar?: string
  performanceScore?: number
}


const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Acme Inc",
    email: "contact@acme.com",
    phone: "+1 (555) 123-4567",
    website: "acme.com",
    contactPerson: "John Doe",
    address: "123 Main Street",
    addressLine2: "Suite 100",
    invoiceCount: 12,
    openProjects: 3,
    pendingContracts: 2,
    rating: 4.8,
    status: "active",
    lastActivity: "2 hours ago",
    dateCreated: "2024-01-15",
    completedRevenue: 45000,
    avatar: "/placeholder.svg?height=40&width=40&text=AI",
    performanceScore: 88,
  },
  {
    id: "2",
    name: "TechCorp Solutions",
    email: "hello@techcorp.com",
    phone: "+1 (555) 987-6543",
    website: "techcorp.com",
    contactPerson: "Jane Smith",
    address: "456 Tech Avenue",
    addressLine2: "Floor 5",
    invoiceCount: 8,
    openProjects: 1,
    pendingContracts: 1,
    rating: 4.2,
    status: "active",
    lastActivity: "1 day ago",
    dateCreated: "2024-02-20",
    completedRevenue: 28000,
    avatar: "/placeholder.svg?height=40&width=40&text=TC",
    performanceScore: 76,
  },
  {
    id: "3",
    name: "Digital Dynamics",
    email: "info@digitaldynamics.com",
    phone: "+1 (555) 456-7890",
    website: "digitaldynamics.com",
    contactPerson: "Mike Johnson",
    address: "789 Innovation Drive",
    addressLine2: "Floor 5",
    invoiceCount: 15,
    openProjects: 5,
    pendingContracts: 3,
    rating: 4.9,
    status: "active",
    lastActivity: "3 hours ago",
    dateCreated: "2023-11-10",
    completedRevenue: 67000,
    avatar: "/placeholder.svg?height=40&width=40&text=DD",
    performanceScore: 92,
  },
  {
    id: "4",
    name: "StartupXYZ",
    email: "team@startupxyz.com",
    phone: "+1 (555) 321-0987",
    website: "startupxyz.com",
    contactPerson: "Sarah Wilson",
    address: "321 Startup Lane",
    invoiceCount: 4,
    openProjects: 2,
    pendingContracts: 0,
    rating: 3.8,
    status: "pending",
    lastActivity: "1 week ago",
    dateCreated: "2024-03-05",
    completedRevenue: 12000,
    avatar: "/placeholder.svg?height=40&width=40&text=SX",
    performanceScore: 65,
  },
  {
    id: "5",
    name: "Enterprise Corp",
    email: "contact@enterprise.com",
    phone: "+1 (555) 654-3210",
    website: "enterprise.com",
    contactPerson: "Robert Brown",
    address: "654 Corporate Blvd",
    invoiceCount: 25,
    openProjects: 8,
    pendingContracts: 5,
    rating: 4.6,
    status: "active",
    lastActivity: "5 minutes ago",
    dateCreated: "2023-08-12",
    completedRevenue: 125000,
    avatar: "/placeholder.svg?height=40&width=40&text=EC",
    performanceScore: 90,
  },
  {
    id: "6",
    name: "Global Systems",
    email: "info@globalsystems.com",
    phone: "+1 (555) 789-0123",
    website: "globalsystems.com",
    contactPerson: "Lisa Chen",
    address: "987 Global Plaza",
    invoiceCount: 18,
    openProjects: 4,
    pendingContracts: 2,
    rating: 4.4,
    status: "active",
    lastActivity: "30 minutes ago",
    dateCreated: "2023-12-01",
    completedRevenue: 89000,
    avatar: "/placeholder.svg?height=40&width=40&text=GS",
    performanceScore: 80,
  },
  {
    id: "7",
    name: "InnovateLab",
    email: "hello@innovatelab.com",
    phone: "+1 (555) 234-5678",
    website: "innovatelab.com",
    contactPerson: "David Kim",
    address: "111 Innovation Way",
    invoiceCount: 7,
    openProjects: 3,
    pendingContracts: 1,
    rating: 4.1,
    status: "active",
    lastActivity: "2 days ago",
    dateCreated: "2024-01-28",
    completedRevenue: 34000,
    avatar: "/placeholder.svg?height=40&width=40&text=IL",
    performanceScore: 70,
  },
  {
    id: "8",
    name: "CloudFirst Technologies",
    email: "support@cloudfirst.com",
    phone: "+1 (555) 345-6789",
    website: "cloudfirst.com",
    contactPerson: "Emily Rodriguez",
    address: "222 Cloud Street",
    invoiceCount: 22,
    openProjects: 6,
    pendingContracts: 4,
    rating: 4.7,
    status: "active",
    lastActivity: "1 hour ago",
    dateCreated: "2023-09-15",
    completedRevenue: 98000,
    avatar: "/placeholder.svg?height=40&width=40&text=CF",
    performanceScore: 85,
  },
  {
    id: "9",
    name: "NextGen Solutions",
    email: "contact@nextgen.com",
    phone: "+1 (555) 456-7891",
    website: "nextgen.com",
    contactPerson: "Alex Thompson",
    address: "333 Future Blvd",
    invoiceCount: 11,
    openProjects: 2,
    pendingContracts: 1,
    rating: 4.3,
    status: "inactive",
    lastActivity: "2 weeks ago",
    dateCreated: "2023-10-22",
    completedRevenue: 56000,
    avatar: "/placeholder.svg?height=40&width=40&text=NG",
    performanceScore: 75,
  },
  {
    id: "10",
    name: "DataFlow Inc",
    email: "info@dataflow.com",
    phone: "+1 (555) 567-8912",
    website: "dataflow.com",
    contactPerson: "Maria Garcia",
    address: "444 Data Drive",
    invoiceCount: 16,
    openProjects: 7,
    pendingContracts: 3,
    rating: 4.5,
    status: "active",
    lastActivity: "4 hours ago",
    dateCreated: "2023-07-08",
    completedRevenue: 78000,
    avatar: "/placeholder.svg?height=40&width=40&text=DF",
    performanceScore: 82,
  },
  {
    id: "11",
    name: "SecureNet Systems",
    email: "admin@securenet.com",
    phone: "+1 (555) 678-9123",
    website: "securenet.com",
    contactPerson: "James Wilson",
    address: "555 Security Lane",
    invoiceCount: 9,
    openProjects: 1,
    pendingContracts: 0,
    rating: 4.0,
    status: "pending",
    lastActivity: "3 days ago",
    dateCreated: "2024-02-14",
    completedRevenue: 42000,
    avatar: "/placeholder.svg?height=40&width=40&text=SN",
    performanceScore: 60,
  },
  {
    id: "12",
    name: "WebCraft Studios",
    email: "hello@webcraft.com",
    phone: "+1 (555) 789-1234",
    website: "webcraft.com",
    contactPerson: "Sophie Anderson",
    address: "666 Design District",
    invoiceCount: 13,
    openProjects: 4,
    pendingContracts: 2,
    rating: 4.6,
    status: "active",
    lastActivity: "6 hours ago",
    dateCreated: "2023-06-30",
    completedRevenue: 61000,
    avatar: "/placeholder.svg?height=40&width=40&text=WC",
    performanceScore: 88,
  },
  {
    id: "13",
    name: "AI Ventures",
    email: "contact@aiventures.com",
    phone: "+1 (555) 891-2345",
    website: "aiventures.com",
    contactPerson: "Dr. Ryan Lee",
    address: "777 AI Boulevard",
    invoiceCount: 20,
    openProjects: 9,
    pendingContracts: 6,
    rating: 4.8,
    status: "active",
    lastActivity: "15 minutes ago",
    dateCreated: "2023-05-18",
    completedRevenue: 156000,
    avatar: "/placeholder.svg?height=40&width=40&text=AV",
    performanceScore: 95,
  },
  {
    id: "14",
    name: "MobileFirst Apps",
    email: "team@mobilefirst.com",
    phone: "+1 (555) 912-3456",
    website: "mobilefirst.com",
    contactPerson: "Taylor Swift",
    address: "888 Mobile Plaza",
    invoiceCount: 6,
    openProjects: 2,
    pendingContracts: 1,
    rating: 3.9,
    status: "active",
    lastActivity: "1 day ago",
    dateCreated: "2024-04-02",
    completedRevenue: 29000,
    avatar: "/placeholder.svg?height=40&width=40&text=MF",
    performanceScore: 78,
  },
  {
    id: "15",
    name: "BlockChain Dynamics",
    email: "info@blockchain.com",
    phone: "+1 (555) 123-4567",
    website: "blockchain.com",
    contactPerson: "Chris Johnson",
    address: "999 Crypto Street",
    invoiceCount: 14,
    openProjects: 5,
    pendingContracts: 3,
    rating: 4.2,
    status: "active",
    lastActivity: "8 hours ago",
    dateCreated: "2023-04-25",
    completedRevenue: 87000,
    avatar: "/placeholder.svg?height=40&width=40&text=BD",
    performanceScore: 84,
  },
  {
    id: "16",
    name: "GreenTech Solutions",
    email: "contact@greentech.com",
    phone: "+1 (555) 234-5678",
    website: "greentech.com",
    contactPerson: "Emma Davis",
    address: "101 Eco Avenue",
    invoiceCount: 10,
    openProjects: 3,
    pendingContracts: 2,
    rating: 4.4,
    status: "inactive",
    lastActivity: "1 month ago",
    dateCreated: "2023-03-12",
    completedRevenue: 52000,
    avatar: "/placeholder.svg?height=40&width=40&text=GT",
    performanceScore: 72,
  },
  {
    id: "17",
    name: "FinTech Innovations",
    email: "hello@fintech.com",
    phone: "+1 (555) 345-6789",
    website: "fintech.com",
    contactPerson: "Michael Brown",
    address: "202 Finance Row",
    invoiceCount: 19,
    openProjects: 6,
    pendingContracts: 4,
    rating: 4.7,
    status: "active",
    lastActivity: "2 hours ago",
    dateCreated: "2023-01-20",
    completedRevenue: 134000,
    avatar: "/placeholder.svg?height=40&width=40&text=FI",
    performanceScore: 91,
  },
  {
    id: "18",
    name: "HealthTech Corp",
    email: "support@healthtech.com",
    phone: "+1 (555) 456-7890",
    website: "healthtech.com",
    contactPerson: "Dr. Lisa Wang",
    address: "303 Medical Center",
    invoiceCount: 17,
    openProjects: 8,
    pendingContracts: 5,
    rating: 4.9,
    status: "active",
    lastActivity: "45 minutes ago",
    dateCreated: "2022-12-05",
    completedRevenue: 112000,
    avatar: "/placeholder.svg?height=40&width=40&text=HT",
    performanceScore: 94,
  },
  {
    id: "19",
    name: "EduTech Platform",
    email: "info@edutech.com",
    phone: "+1 (555) 567-8901",
    website: "edutech.com",
    contactPerson: "Professor John Smith",
    address: "404 Learning Lane",
    invoiceCount: 12,
    openProjects: 4,
    pendingContracts: 2,
    rating: 4.1,
    status: "pending",
    lastActivity: "5 days ago",
    dateCreated: "2024-05-10",
    completedRevenue: 68000,
    avatar: "/placeholder.svg?height=40&width=40&text=ET",
    performanceScore: 79,
  },
  {
    id: "20",
    name: "SportsTech Analytics",
    email: "team@sportstech.com",
    phone: "+1 (555) 678-9012",
    website: "sportstech.com",
    contactPerson: "Coach Mike Wilson",
    address: "505 Stadium Drive",
    invoiceCount: 8,
    openProjects: 2,
    pendingContracts: 1,
    rating: 4.0,
    status: "active",
    lastActivity: "12 hours ago",
    dateCreated: "2024-06-01",
    completedRevenue: 38000,
    avatar: "/placeholder.svg?height=40&width=40&text=ST",
    performanceScore: 68,
  },
]


type Props = {
  customer: Customer[] | null
}

export default function CustomerTable({ customer }: Props) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const [sortBy, setSortBy] = useState<"lastActivity" | "dateCreated" | "rating">("lastActivity")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState<"all" | "high" | "medium" | "low">("all")


  if (!isClient) {
    return null;
  }

  if (!customer) return null

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
    const sortedCustomers = (customer || [])
    .filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
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
        case "dateCreated":
          return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }


  return (
    <div className="p-6 space-y-6">

    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={sortBy} onValueChange={(value: "lastActivity" | "dateCreated" | "rating") => setSortBy(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastActivity">Last Activity</SelectItem>
            <SelectItem value="dateCreated">Date Created</SelectItem>
            <SelectItem value="rating">Rating Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Priority:</span>
        <Select value={filterBy} onValueChange={(value: "all" | "high" | "medium" | "low") => setFilterBy(value)}>
          <SelectTrigger className="w-[120px]">
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
              className="flex-1 cursor-pointer hover:shadow-md border-bexoni transition-shadow border  p-4"
           
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={customer.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-base text-muted-foreground mb-3 font-medium">{customer.email}</p>

                    <div className="flex items-center gap-4 text-sm mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Last activity: {customer.lastActivity}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {renderStars(customer.rating)}
                      <span className="ml-1 text-sm">{customer.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 text-center">
                  <div>
                    <div className="text-xl font-bold text-orange-600">{customer.pendingContracts}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-600">{customer.openProjects}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      ${(customer.completedRevenue / 1000).toFixed(0)}k
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
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
    />

    {/* <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedCustomers.length)} of{" "}
        {sortedCustomers.length} customers
      </p>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div> */}

    {/* <CustomerDetailSheet customer={selectedCustomer} open={sheetOpen} onOpenChange={setSheetOpen} /> */}
  </div>
  )
}