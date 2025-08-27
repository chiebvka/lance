"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { Feedbacks } from "@/hooks/feedbacks/use-feedbacks"

export  interface Feedback {
    id: string
    created_at: string | null
    name: string | null
    recepientName: string | null
    answers?: any[] 
    questions?: any[]
    recepientEmail: string | null
    state: "draft" | "sent" | "completed" | "overdue" | null
    filledOn?: string | null
    projectId: string | null
    customerId: string | null
    templateId: string | null
    dueDate: string | null
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "draft":
      return "bg-blue-100 text-blue-800";
    case "sent":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

  export const columns: ColumnDef<Feedbacks>[] = [
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
      accessorKey: "recepientName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Recipient Name" />
      ),
      cell: ({ row }) => {
        const type = row.original.recepientName
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
      accessorKey: "recepientEmail",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Recipient Email" />
      ),
      cell: ({ row }) => {
        const recepientEmail = row.original.recepientEmail;
  
        if (recepientEmail === null || recepientEmail === undefined) {
          return <div>Not set</div>;
        }
        
  
  
        return <div className="font-medium">{recepientEmail}</div>;
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
          <Badge className={getStatusColor(state)}>
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="End Date" />
      ),
      cell: ({ row }) => {
        const dueDate = row.original.dueDate
        if (!dueDate) return <div>Not set</div>
  
        return (
          <div className="font-medium">{format(new Date(dueDate), "P")}</div>
        )
      },
    },
    {
      accessorKey: "filledOn",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Filled On" />
      ),
      cell: ({ row }) => {
        const filledOn = row.original.filledOn
        if (!filledOn) return <div>Not set</div>
  
        return (
          <div className="font-medium">{format(new Date(filledOn), "P")}</div>
        )
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
  
