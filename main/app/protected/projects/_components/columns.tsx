"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "./data-table-column-header"


// Define the Project type based on our API response
export type Project = {
  id: string
  name: string
  description: string
  type: string
  customerName: string
  customerId: string | null
  budget: number
  currency: string
  budgetFormatted: string
  hasServiceAgreement: boolean
  status: string
  paymentType: string
  startDate: string | null
  endDate: string | null
  startDateFormatted: string
  endDateFormatted: string
  created_at: string
  createdAtFormatted: string
  customers: { name: string } | null
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'in progress':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
    case 'done':
      return 'bg-green-100 text-green-800'
    case 'on hold':
    case 'paused':
      return 'bg-yellow-100 text-yellow-800'
    case 'cancelled':
    case 'canceled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getPaymentTypeColor = (paymentType: string) => {
  switch (paymentType?.toLowerCase()) {
    case 'milestone':
      return 'bg-purple-100 text-purple-800'
    case 'hourly':
      return 'bg-orange-100 text-orange-800'
    case 'fixed':
      return 'bg-indigo-100 text-indigo-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Project Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.getValue("name")}
        </div>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string
      return (
        <div className="max-w-[200px] truncate" title={description}>
          {description}
        </div>
      )
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      return (
        <Badge variant="outline" className="capitalize">
          {row.getValue("type")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "customerId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const projectType = row.original.type;
      const customer = row.original.customers; // Assuming 'customers' object is fetched

      if (projectType === 'personal') {
        return <span>Personal</span>;
      }

      if (customer && customer.name) {
        return <span>{customer.name}</span>;
      }

      return <span className="text-muted-foreground">No Customer Assigned</span>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "budgetFormatted",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Budget
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.getValue("budgetFormatted")}
        </div>
      )
    },
  },
  {
    accessorKey: "hasServiceAgreement",
    header: "Service Agreement",
    cell: ({ row }) => {
      const hasAgreement = row.getValue("hasServiceAgreement") as boolean
      return (
        <Badge variant={hasAgreement ? "default" : "secondary"}>
          {hasAgreement ? "Yes" : "No"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge className={getStatusColor(status)}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "paymentType",
    header: "Payment Type",
    cell: ({ row }) => {
      const paymentType = row.getValue("paymentType") as string
      return (
        <Badge className={getPaymentTypeColor(paymentType)}>
          {paymentType}
        </Badge>
      )
    },
  },
  {
    accessorKey: "startDateFormatted",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-medium"
        >
          Start Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const project = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(project.id)}
            >
              Copy project ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View project</DropdownMenuItem>
            <DropdownMenuItem>Edit project</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
