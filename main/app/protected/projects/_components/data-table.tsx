"use client"

import { flexRender, type Table } from "@tanstack/react-table"
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Project } from "./columns"

interface DataTableProps<TData> {
  table: Table<TData>
  onProjectSelect?: (projectId: string) => void
}

export function DataTable<TData>({
  table,
  onProjectSelect,
}: DataTableProps<TData>) {
  const handleRowClick = (row: any) => {
    // Prevent action menu from triggering row click
    if ((event?.target as HTMLElement).closest('[role="menu"]')) {
      return
    }

    if (onProjectSelect) {
      const project = row.original as Project
      if (project.id) {
        onProjectSelect(project.id)
      }
    }
  }

  return (
    <div className="rounded-md border">
      <ShadcnTable>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => handleRowClick(row)}
                className="cursor-pointer"
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </ShadcnTable>
    </div>
  )
}
