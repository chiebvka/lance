"use client"


import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { Path } from "@/hooks/paths/use-paths"

const getStateColor = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'draft':
        return 'bg-blue-100 text-blue-800'
      case 'published':
        return 'bg-green-100 text-green-800'
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

export const columns: ColumnDef<Path>[] = [
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
            <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
            const name = row.original.name
            if (!name) return null
            return <div className="font-medium">{name}</div>
          },
    },
    {
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => {
          const description = row.original.description
          if (!description) return null
          return <div className="text-muted-foreground line-clamp-1 max-w-[150px]">{description}</div>
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
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Issue Date" />
        ),
        cell: ({ row }) => {
          const issueDate = row.original.created_at
          if (!issueDate) return <div>Not set</div>
    
          return (
            <div className="font-medium">{format(new Date(issueDate), "P")}</div>
          )
        },
      },
      {
        accessorKey: "private",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Privacy" />
        ),
        cell: ({ row }) => {
          const isPrivate = row.original.private
          return (
            <Badge variant="outline" className={isPrivate ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}>
              {isPrivate ? 'Private' : 'Public'}
            </Badge>
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
  
