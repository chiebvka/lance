"use client"

import React from 'react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetFooter, SheetHeader, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { SearchFilter, FilterTag } from '../filtering/search-filter'

type CreateSearchFilterProps = {
  // Search functionality
  placeholder: string
  onSearch?: (value: string) => void
  
  // Filter functionality  
  filterContent?: React.ReactNode
  filterTags?: FilterTag[]
  onRemoveFilter?: (key: string) => void
  onClearAllFilters?: () => void
  
  // Sheet functionality
  sheetTriggerText: string
  sheetTitle: string
  sheetHeader?: React.ReactNode
  sheetContent: React.ReactNode
  sheetContentClassName?: string
  footer?: React.ReactNode
  closeRef?: React.RefObject<HTMLButtonElement | null>
  
  // Optional wrapper className
  className?: string
}

export default function CreateSearchFilter({
  placeholder,
  onSearch,
  filterContent,
  filterTags,
  onRemoveFilter,
  onClearAllFilters,
  sheetTriggerText,
  sheetTitle,
  sheetHeader,
  sheetContent,
  sheetContentClassName,
  footer,
  closeRef,
  className
}: CreateSearchFilterProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Layout */}
      <div className="hidden md:flex justify-between items-center border-b pb-4">
        <div className="flex items-center space-x-4 flex-1 mr-4">
          <SearchFilter 
            placeholder={placeholder}
            filterTags={filterTags}
            onRemoveFilter={onRemoveFilter}
            onClearAllFilters={onClearAllFilters}
            onSearch={onSearch}
          >
            {filterContent}
          </SearchFilter>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button> 
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{sheetTriggerText}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" bounce="right" withGap={false} className={cn("flex flex-col p-0", sheetContentClassName)}>
            {sheetHeader ? (
              sheetHeader
            ) : (
              <SheetHeader className="p-4 border-b">
                <SheetTitle>{sheetTitle}</SheetTitle>
              </SheetHeader>
            )}
            <ScrollArea className="flex-grow">
              <div className="p-4">
                {sheetContent}
              </div>
            </ScrollArea>
            {footer && (
              <SheetFooter className="p-4 border-t">
                {footer}
              </SheetFooter>
            )}
            <SheetClose ref={closeRef as React.RefObject<HTMLButtonElement>} className="hidden" />
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile Layout - Flex with plus icon only */}
      <div className="md:hidden border-b pb-4">
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1">
            <SearchFilter 
              placeholder={placeholder}
              filterTags={filterTags}
              onRemoveFilter={onRemoveFilter}
              onClearAllFilters={onClearAllFilters}
              onSearch={onSearch}
              className="w-full"
            >
              {filterContent}
            </SearchFilter>
          </div>
          
          {/* Just plus icon on mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" className="flex-shrink-0"> 
                <Plus className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              bounce="right" 
              withGap={false} 
              className={cn("flex flex-col p-0", sheetContentClassName)}
            >
              {sheetHeader ? (
                sheetHeader
              ) : (
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>{sheetTitle}</SheetTitle>
                </SheetHeader>
              )}
              <ScrollArea className="flex-grow">
                <div className="p-4">
                  {sheetContent}
                </div>
              </ScrollArea>
              {footer && (
                <SheetFooter className="p-4 border-t">
                  {footer}
                </SheetFooter>
              )}
              <SheetClose ref={closeRef as React.RefObject<HTMLButtonElement>} className="hidden" />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}