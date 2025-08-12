"use client"

import React from 'react';
import { flexRender, type Table } from "@tanstack/react-table"
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserRoundSearch, ChevronUp, ChevronDown, FolderOpenDot } from "lucide-react";
import { Receipt } from './columns';



interface DataTableProps<TData> {
  table: Table<TData>
  onInvoiceSelect?: (invoiceId: string) => void
  searchQuery?: string
}

export function DataTable<TData>({
  table,
  onInvoiceSelect,
  searchQuery = "",
}: DataTableProps<TData>) {
  const handleRowClick = (row: any) => {
    // Prevent action menu from triggering row click
    if ((event?.target as HTMLElement).closest('[role="menu"]')) {
      return
    }

    if (onInvoiceSelect) {
      const receipt = row.original as Receipt
      if (receipt.id) {
        onInvoiceSelect(receipt.id)
      }
    }
  }

  return (
    <div className="rounded-none border">
      <ShadcnTable >
        <TableHeader className="bg-bexoni/10 hover:bg-bexoni/10">
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <TableHead key={header.id} colSpan={header.colSpan} className="text-primary">
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
                className="cursor-pointer "
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className=" ">
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
                {/* No results found state */}
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <div className="bg-muted/50 rounded-lg p-8 max-w-md w-full text-center space-y-4">
                    {/* Search Icon */}
                    <div className="flex justify-center">
                      <div className="bg-primary p-3 rounded-lg">
                        <FolderOpenDot className="h-6 w-6 text-primary-foreground" />
                      </div>
                    </div>
                    
                    {/* Heading */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        No results found
                      </h3>
                      <span className="text-sm flex items-center justify-center gap-0 text-muted-foreground">
                        No results for '<p className="text-primary">{searchQuery || "your search"}</p> '
                      </span>
                    </div>
                    
                    {/* Instructional Text */}
                    <p className="text-xs text-muted-foreground">
                      Try searching for receipts by number, customer, or status
                    </p>
                    
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </ShadcnTable>
    </div>
  )
}
