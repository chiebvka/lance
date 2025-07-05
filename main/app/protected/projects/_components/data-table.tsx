"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTableToolbar } from "./data-table-toolbar"
import { DataTableViewOptions } from "./data-table-column-visibility"
import Pagination from "@/components/pagination"
import { createPortal } from "react-dom"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  showToolbar?: boolean
  onProjectSelect?: (projectId: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  showToolbar = true,
  onProjectSelect,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pageSize, setPageSize] = React.useState(10)
  const [pageIndex, setPageIndex] = React.useState(0)

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPagination = updater({ pageIndex, pageSize })
        setPageIndex(newPagination.pageIndex)
        setPageSize(newPagination.pageSize)
      }
    },
  })

  const totalPages = Math.ceil(data.length / pageSize)
  const currentPage = pageIndex + 1

  const handlePageChange = (page: number) => {
    setPageIndex(page - 1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPageIndex(0)
  }

  const handleRowClick = (row: any) => {
    if (onProjectSelect && row.original?.id) {
      onProjectSelect(row.original.id)
    }
  }

  return (
    <div className="space-y-4">
      {showToolbar && <DataTableToolbar table={table} />}
      
      {/* Render column visibility button in the header placeholder */}
      {typeof window !== 'undefined' && 
        createPortal(
          <DataTableViewOptions table={table} />,
          document.getElementById('column-visibility-placeholder') || document.body
        )
      }
      
      {/* Flat table design like the images */}
      <div className="border-0">
        <Table className="border-collapse">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      colSpan={header.colSpan}
                      className="h-10 px-4 text-left align-middle font-medium text-muted-foreground border-b border-border bg-transparent"
                    >
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`border-b border-border hover:bg-muted/50 ${
                    onProjectSelect ? "cursor-pointer" : ""
                  }`}
                  onClick={() => handleRowClick(row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className="px-4 py-3 align-middle"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={data.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        itemName="projects"
      />
    </div>
  )
}
