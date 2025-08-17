"use client"

import { SlidersHorizontal } from "lucide-react"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

const columnLabels: Record<string, string> = {
  name: "Name",
  description: "Description",
  state: "State",
  created_at: "Issue Date",
  type: "Type",

}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto flex h-8 border border-bexoni rounded-none"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-none">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuItem
                key={column.id}
                className="capitalize"
                onSelect={(e) => {
                  e.preventDefault()
                  column.toggleVisibility(!column.getIsVisible())
                }}
              >
                <Checkbox
                  className="mr-2 rounded-none"
                  checked={column.getIsVisible()}
                  aria-label="Toggle column visibility"
                />
                {columnLabels[column.id] ?? column.id}
              </DropdownMenuItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
