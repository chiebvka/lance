"use client"
import React from 'react'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Target } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface PaginationProps {
    currentPage: number
    totalPages: number
    pageSize: number
    totalItems: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
}

export default function Pagination({ currentPage, totalPages, pageSize, onPageChange, onPageSizeChange, totalItems }: PaginationProps) {

    const getPageNumbers = (): (string | number)[] => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (currentPage <= 3) {
            return [1, 2, 3, 4, '...', totalPages];
        }
        if (currentPage > totalPages - 3) {
            return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    return (
        <div className="flex items-center justify-between flex-wrap gap-4 py-4">
                    {/* Challenge progress component from neon numbers */}
          <div className="text-center mt-6">
            <div className="inline-flex items-center space-x-4 bg-bexoni/10  px-6 py-3 border border-bexoni">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">
                  Page <span className="font-bold text-bexoni">{currentPage}</span> of{" "}
                  <span className="font-bold text-bexoni/60">{totalPages}</span>
                </span>
              </div>
              <div className="w-px h-4 bg-bexoni" />
              <span className="text-xs text-bexoni/80">
                {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of{" "}
                {totalItems} challenges
              </span>
            </div>
          </div>
            {/* <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items.
            </div> */}
            <div className="flex items-center justify-center space-x-2">
                <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm text-muted-foreground`}>Rows per page:</p>
                    <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
                        <SelectTrigger className={`h-8 w-[70px] dark:bg-transparent`}>
                            <SelectValue placeholder={pageSize.toString()} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="hidden border border-primary h-8 w-8 lg:flex"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="hidden border border-primary h-8 w-8 lg:flex"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === "number" && onPageChange(page)}
                            disabled={page === "..."}
                            className={`relative min-w-[40px] h-10 flex items-center justify-center font-medium text-sm transition-all duration-300 ${
                                page === currentPage
                                    ? "text-white z-10"
                                    : page === "..."
                                        ? "text-gray-400 cursor-default"
                                        : " hover:text-primary z-0"
                            }`}
                            style={{
                                transform: page === currentPage ? "translateY(-2px)" : "translateY(0)",
                            }}
                        >
                            {page !== "..." && (
                                <>
                                    <div
                                        className={`absolute inset-0 rounded ${
                                            page === currentPage
                                                ? "bg-primary shadow-md"
                                                : " border border-primary hover:border-primary/50"
                                        }`}
                                        style={{
                                            transform: "translateY(2px) translateX(1px)",
                                            zIndex: -3,
                                            opacity: 0.4,
                                        }}
                                    />
                                    <div
                                        className={`absolute inset-0 rounded ${
                                            page === currentPage
                                                ? "bg-primary shadow-sm"
                                                : "border border-primary hover:border-primary/50"
                                        }`}
                                        style={{
                                            transform: "translateY(1px) translateX(0.5px)",
                                            zIndex: -2,
                                            opacity: 0.7,
                                        }}
                                    />
                                    <div
                                        className={`absolute inset-0 rounded ${
                                            page === currentPage
                                                ? "bg-primary shadow-lg"
                                                : "bg-secondary dark:bg-transparent text-white border border-primary  hover:shadow-sm"
                                        }`}
                                        style={{ zIndex: -1 }}
                                    />
                                </>
                            )}
                            <span className="relative z-10">{page}</span>
                        </button>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                       className="hidden border border-primary h-8 w-8 lg:flex"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="hidden border border-primary h-8 w-8 lg:flex"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}