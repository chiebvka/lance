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




export interface Receipt {
  id: string
  customerId: string | null
  projectId: string | null
  organizationName: string | null
  organizationLogo: string | null
  organizationLogoUrl: string | null // From organization table
  organizationNameFromOrg: string | null // From organization table
  organizationEmailFromOrg: string | null // From organization table
  organizationEmail: string | null
  recepientName: string | null
  recepientEmail: string | null
  issueDate: string | null
  // dueDate: string | null
  currency: string | null
  hasVat: boolean | null
  hasTax: boolean | null
  hasDiscount: boolean | null
  vatRate: number | null
  taxRate: number | null
  discount: number | null
  notes: string | null
  creationMethod: string | null
  paymentInfo: string | null
  paymentDetails: string | null
  receiptDetails: any | null
  subTotalAmount: number | null
  totalAmount: number | null
  state: string | null
  sentViaEmail: boolean | null
  emailSentAt: string | null
  createdBy: string | null
  organizationId: string | null
  created_at: string | null
  updatedAt: string | null
  paymentConfirmedAt: string | null
  receiptNumber: string | null
  paymentLink: string | null
  paymentType: string | null
  projectName: string | null
  allowReminders: boolean | null
  fts: any | null
  // Additional formatted fields for display
  customerName?: string
  issueDateFormatted?: string
  dueDateFormatted?: string
  totalAmountFormatted?: string
}

const getStateColor = (state: string) => {
  switch (state?.toLowerCase()) {
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

const getCreationMethodColor = (creationMethod: string) => {
  switch (creationMethod?.toLowerCase()) {
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



export const columns: ColumnDef<Receipt>[] = [
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
    accessorKey: "receiptNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Receipt Number" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("receiptNumber") || 'No Receipt Number'}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "recepientName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const customerName = row.original.recepientName
      if (!customerName) {
        return <div className="text-muted-foreground">No Customer Assigned</div>
      }
      
      return <div className="font-medium">{customerName}</div>
    },
  },
  {
    accessorKey: "creationMethod",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Creation Method" />
    ),
    cell: ({ row }) => {
      const creationMethod = row.original.creationMethod
      if (!creationMethod) return null

      return (
        <Badge variant="outline" className={`capitalize ${getCreationMethodColor(creationMethod)}`}>
          {creationMethod}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Amount" />
    ),
    cell: ({ row }) => {
      const totalAmount = row.original.totalAmount
      const currency = row.original.currency

      if (totalAmount === null || totalAmount === undefined) {
        return <div>Not set</div>;
      }
      
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(totalAmount);

      return <div className="font-medium">{formattedAmount}</div>;
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
        <Badge variant="outline" className={`capitalize ${getStateColor(state)}`}>
          {state}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },

  {
    accessorKey: "issueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Issue Date" />
    ),
    cell: ({ row }) => {
      const issueDate = row.original.issueDate
      if (!issueDate) return <div>Not set</div>

      return (
        <div className="font-medium">{format(new Date(issueDate), "P")}</div>
      )
    },
  },
  {
    accessorKey: "paymentConfirmedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payment Date" />
    ),
    cell: ({ row }) => {
      const paymentConfirmedAt = row.original.paymentConfirmedAt
      if (!paymentConfirmedAt) return <div>Not set</div>

      return (
        <div className="font-medium">{format(new Date(paymentConfirmedAt), "P")}</div>
      )
    },
  },
  {
    accessorKey: "taxRate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tax Rate" />
    ),
    cell: ({ row }) => {
      const taxRate = row.original.taxRate
      if (taxRate === null || taxRate === undefined) {
        return <div>Not set</div>;
      }
      
      return <div className="font-medium">{taxRate}%</div>;
    },
  },
  {
    accessorKey: "vatRate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="VAT Rate" />
    ),
    cell: ({ row }) => {
      const vatRate = row.original.vatRate
      if (vatRate === null || vatRate === undefined) {
        return <div>Not set</div>;
      }
      
      return <div className="font-medium">{vatRate}%</div>;
    },
  },
  {
    id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actions" />
    ),
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]