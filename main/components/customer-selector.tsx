"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronDown, Plus, Edit } from "lucide-react"
import { cn } from "@/lib/utils"

const mockCustomers = [
  { id: "1", name: "Kevin Johnson", email: "kevin@example.com", company: "Tech Corp" },
  { id: "2", name: "Jun Li", email: "jun@example.com", company: "Design Studio" },
  { id: "3", name: "Bexoni Smith", email: "bexoni@example.com", company: "Marketing Inc" },
  { id: "4", name: "Junior Rodriguez", email: "junior@example.com", company: "Startup LLC" },
]

interface CustomerSelectorProps {
  value: string
  onValueChange: (value: string) => void
  onCreateCustomer: () => void
  onEditCustomer: (customerId: string) => void
}

export function CustomSelector({ value, onValueChange, onCreateCustomer, onEditCustomer }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedCustomer = mockCustomers.find((customer) => customer.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedCustomer ? (
            <span>
              {selectedCustomer.name} - {selectedCustomer.company}
            </span>
          ) : value === "none" ? (
            "No Customer (Internal Project)"
          ) : (
            "Select customer..."
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search customer..." />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none no customer internal project"
                onSelect={() => {
                  onValueChange("none")
                  setOpen(false)
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === "none" ? "opacity-100" : "opacity-0")} />
                No Customer (Internal Project)
              </CommandItem>
              {mockCustomers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`${customer.name} ${customer.email} ${customer.company}`.toLowerCase()}
                  onSelect={() => {
                    onValueChange(customer.id)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Check className={cn("mr-2 h-4 w-4", value === customer.id ? "opacity-100" : "opacity-0")} />
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.company} • {customer.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        onEditCustomer(customer.id)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <div className="border-t">
              <CommandItem
                value="create new customer add"
                onSelect={() => {
                  onCreateCustomer()
                  setOpen(false)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create customer
              </CommandItem>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
