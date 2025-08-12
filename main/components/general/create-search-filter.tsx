"use client"

import React, { useState } from 'react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetFooter, SheetHeader, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Plus, ArrowDown } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { SearchFilter, FilterTag } from '../filtering/search-filter'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"

// Define the dropdown option types
export type DropdownOption = {
  label: string
  type: 'checkbox' | 'submenu' | 'item'
  checked?: boolean
  subItems?: DropdownOption[]
  action?: () => void
  key: string
}

type CreateSearchFilterProps = {
  // Search functionality
  placeholder: string
  onSearch?: (value: string) => void
  
  // Filter functionality  
  filterContent?: React.ReactNode
  filterTags?: FilterTag[]
  onRemoveFilter?: (key: string) => void
  onClearAllFilters?: () => void
  onCreateClick?: () => void // <-- add this
  
  // Sheet functionality
  sheetTriggerText: string
  sheetTitle?: string
  sheetHeader?: React.ReactNode
  sheetContent?: React.ReactNode
  sheetContentClassName?: string
  footer?: React.ReactNode
  closeRef?: React.RefObject<HTMLButtonElement | null>
  
  // New props for layout customization
  sheetHeaderIcon?: React.ReactNode
  sheetHeaderDropdownOptions?: DropdownOption[]
  layoutOptions?: {
    hasTax: boolean
    hasVat: boolean
    hasDiscount: boolean
  } 
  onDropdownOptionChange?: (key: string, value: boolean) => void
  onLayoutOptionChange?: (key: string, value: boolean) => void
  
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
  onCreateClick,
  sheetTitle,
  sheetHeader,
  sheetContent,
  sheetContentClassName,
  footer,
  closeRef,
  sheetHeaderIcon,
  sheetHeaderDropdownOptions,
  onDropdownOptionChange,
  onLayoutOptionChange,
  layoutOptions, 
  className
}: CreateSearchFilterProps) {
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)
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
        
        {onCreateClick ?(         
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{sheetTriggerText}</span>
          </Button>
        ) :(  
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
                  <div className="flex justify-between items-center">
                    <SheetTitle>{sheetTitle}</SheetTitle>
                    {sheetHeaderIcon && sheetHeaderDropdownOptions && (
                      <div className="flex items-center  fixed right-20 gap-2">
                        <DropdownMenu open={desktopDropdownOpen} onOpenChange={setDesktopDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {sheetHeaderIcon}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={(e) => e.preventDefault()}>
                          {sheetHeaderDropdownOptions?.map((option) => (
                            <React.Fragment key={option.key}>
                              {option.type === 'checkbox' && (
                                <DropdownMenuCheckboxItem
                                  checked={option.checked}
                                  onCheckedChange={(checked) => {
                                    onDropdownOptionChange?.(option.key, checked);
                                    onLayoutOptionChange?.(option.key, checked);
                                    // Prevent closing the menu
                                  }}
                                  onSelect={(e) => e.preventDefault()} // Prevent default selection behavior
                                >
                                  {option.label}
                                </DropdownMenuCheckboxItem>
                              )}
                              {option.type === 'submenu' && option.subItems && (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>{option.label}</DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {option.subItems.map((subItem) => (
                                      <DropdownMenuCheckboxItem
                                        key={subItem.key}
                                        checked={subItem.checked}
                                        onCheckedChange={(checked) => {
                                          onDropdownOptionChange?.(subItem.key, checked);
                                          onLayoutOptionChange?.(subItem.key, checked);
                                        }}
                                        onSelect={(e) => e.preventDefault()} // Prevent default selection behavior
                                      >
                                        {subItem.label}
                                      </DropdownMenuCheckboxItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )}
                              {option.type === 'item' && (
                                <DropdownMenuItem onClick={option.action} onSelect={(e) => e.preventDefault()}>
                                  {option.label}
                                </DropdownMenuItem>
                              )}
                            </React.Fragment>
                          ))}
                        </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </SheetHeader>
              )}
              
              {/* Breathing Glow Separator */}
              <div className="relative h-4 bg-gradient-to-b from-background via-background/80 to-transparent flex-shrink-0 -mt-1">
                {/* Breathing glow effect */}
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent rounded-full animate-pulse blur-sm"></div>
                <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500/80 to-transparent rounded-full animate-pulse delay-150"></div>
                
                {/* Scroll wave indicator */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                  <div className="transition-all duration-500 opacity-70 scale-95">
                    <ArrowDown className="h-3 w-3 text-purple-400 animate-bounce" />
                  </div>
                </div>

                {/* Side breathing effects */}
                <div className="absolute top-1 left-6 w-6 h-1 bg-gradient-to-r from-purple-300/30 to-transparent rounded-full animate-pulse delay-300 blur-sm"></div>
                <div className="absolute top-1 right-6 w-6 h-1 bg-gradient-to-l from-purple-300/30 to-transparent rounded-full blur-sm"></div>
                
                {/* Wave pattern */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  <div className="w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse"></div>
                  <div className="w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse delay-100"></div>
                  <div className="w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse delay-200"></div>
                  <div className="w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse delay-300"></div>
                  <div className="w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse delay-400"></div>
                </div>
              </div>
              
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
        )}
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
              className="w-x"
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
                <SheetHeader className="p-4 border-b flex items-center justify-between">
                  <SheetTitle>{sheetTitle}</SheetTitle>
                  {sheetHeaderIcon && sheetHeaderDropdownOptions && (
                    <DropdownMenu open={mobileDropdownOpen} onOpenChange={setMobileDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {sheetHeaderIcon}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {sheetHeaderDropdownOptions.map((option) => (
                          <React.Fragment key={option.key}>
                            {option.type === 'checkbox' && (
                                                              <DropdownMenuCheckboxItem
                                checked={option.checked}
                                onCheckedChange={(checked) => {
                                  onDropdownOptionChange?.(option.key, checked);
                                  onLayoutOptionChange?.(option.key, checked);
                                }}
                              >
                                {option.label}
                              </DropdownMenuCheckboxItem>
                            )}
                            {option.type === 'submenu' && option.subItems && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  {option.label}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {option.subItems.map((subItem) => (
                                    <DropdownMenuCheckboxItem
                                      key={subItem.key}
                                      checked={subItem.checked}
                                      onCheckedChange={(checked) => {
                                        onDropdownOptionChange?.(subItem.key, checked);
                                        onLayoutOptionChange?.(subItem.key, checked);
                                      }}
                                    >
                                      {subItem.label}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}
                            {option.type === 'item' && (
                              <DropdownMenuItem onClick={option.action}>
                                {option.label}
                              </DropdownMenuItem>
                            )}
                          </React.Fragment>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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