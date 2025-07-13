"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
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
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableRowActions } from "./data-table-row-actions"

import { labels, priorities, statuses } from "../data/data"

const paymentTypeOptions = [
  { value: 'milestonePayment', label: 'Milestone' },
  { value: 'deliverablePayment', label: 'Deliverable' },
  { value: 'fullDownPayment', label: 'Full Payment Upfront' },
  { value: 'paymentOnCompletion', label: 'Payment on Completion' },
  { value: 'noPaymentRequired', label: 'No Payment' }
];

export interface Project {
  id: string
  name: string | null
  description: string | null
  type: "personal" | "customer" | null
  customerName?: string | null
  budget: number | null
  currency: string | null
  hasServiceAgreement: boolean | null
  paymentType: string | null
  endDate: string | null
  state: "draft" | "published" | null
  created_at: string | null
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
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px] rounded-none"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px] rounded-none"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Project Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("name")}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex w-[100px] items-center">
          <span>{row.getValue("description")}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.original.type
      if (!type) return null

      return (
        <Badge variant="outline" className="capitalize">
          {type}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "customerName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const type = row.original.type
      const customerName = row.original.customerName

      if (type === "personal") {
        return <div className="font-medium">Personal</div>
      }

      if (customerName) {
        return <div className="font-medium">{customerName}</div>
      }
      
      return <div className="text-muted-foreground">No Customer Assigned</div>
    },
  },
  {
    accessorKey: "budget",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Budget" />
    ),
    cell: ({ row }) => {
      const budget = row.original.budget;
      const currency = row.original.currency;

      if (budget === null || budget === undefined) {
        return <div>Not set</div>;
      }
      
      const formattedBudget = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(budget);

      return <div className="font-medium">{formattedBudget}</div>;
    },
  },
  {
    accessorKey: "hasServiceAgreement",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Service Agreement" />
    ),
    cell: ({ row }) => {
      const hasAgreement = row.original.hasServiceAgreement
      const variant = hasAgreement ? "default" : "secondary"
      const text = hasAgreement ? "Yes" : "No"

      return (
        <Badge variant={variant} className={hasAgreement ? "bg-purple-600 text-white" : ""}>
          {text}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "state",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="State" />
    ),
    cell: ({ row }) => {
      const state = row.original.state
      if (!state) return null

      return (
        <Badge variant={state === 'published' ? 'default' : 'secondary'} className="capitalize">
          {state}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "paymentType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payment Type" />
    ),
    cell: ({ row }) => {
      const paymentType = row.original.paymentType
      if (!paymentType) return null

      const option = paymentTypeOptions.find(p => p.value === paymentType)

      return <div className="font-medium">{option ? option.label : paymentType}</div>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="End Date" />
    ),
    cell: ({ row }) => {
      const endDate = row.original.endDate
      if (!endDate) return <div>Not set</div>

      return (
        <div className="font-medium">{format(new Date(endDate), "P")}</div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
