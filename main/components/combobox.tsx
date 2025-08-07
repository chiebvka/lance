"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "./ui/scroll-area"

interface ComboBoxProps {
  items: { value: string; label: string; searchValue?: string; [key: string]: any }[]
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  onCreate?: {
    label: string
    action: () => void
  }
  itemRenderer?: (item: { value: string; label: string; [key: string]: any }) => React.ReactNode
}

export default function ComboBox({
  items,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  onCreate,
  itemRenderer,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedItem = items.find((item) => item.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedItem?.label || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 overflow-y-auto"
        onWheel={e => e.stopPropagation()}
      >
        <Command >
          <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="overflow-y-auto max-h-60">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.searchValue || item.label}
                    onSelect={() => {
                      onValueChange(item.value === value ? null : item.value)
                      setOpen(false)
                    }}
                    className={cn(
                      "cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30", 
                      value === item.value && "bg-purple-100 dark:bg-purple-900/50"
                    )}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4 text-primary", value === item.value ? "opacity-100" : "opacity-0")}
                    />
                    {itemRenderer ? itemRenderer(item) : item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          {onCreate && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onCreate.action()
                    setOpen(false)
                  }}
                  className="cursor-pointer text-primary font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  >
                  <div className="flex items-center w-full p-1">
                    <Plus className="mr-2 h-4 w-4" />
                    <span>{onCreate.label}</span>
                  </div>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </Command>
    
      </PopoverContent>
    </Popover>
  )
}