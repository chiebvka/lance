"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const currencies = [
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    searchTerms: "usd us dollar united states america american",
  },
  { code: "EUR", name: "Euro", symbol: "€", searchTerms: "eur euro europe european" },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    searchTerms: "gbp british pound sterling uk united kingdom britain",
  },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", searchTerms: "cad canadian dollar canada" },
  {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    searchTerms: "aud australian dollar australia aussie",
  },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", searchTerms: "jpy japanese yen japan" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", searchTerms: "chf swiss franc switzerland suisse" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", searchTerms: "cny chinese yuan china renminbi" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", searchTerms: "inr indian rupee india" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", searchTerms: "brl brazilian real brazil" },
]

interface CurrencySelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function CurrencySelector({ value, onValueChange }: CurrencySelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedCurrency = currencies.find((currency) => currency.code === value)

  return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selectedCurrency ? (
              <span>
                {selectedCurrency.symbol} {selectedCurrency.code} - {selectedCurrency.name}
              </span>
            ) : (
              "Select currency..."
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search currency..." />
            <CommandList>
              <CommandEmpty>No currency found.</CommandEmpty>
              <CommandGroup>
                {currencies.map((currency) => (
                  <CommandItem
                    key={currency.code}
                    value={`${currency.code} ${currency.name} ${currency.searchTerms}`.toLowerCase()}
                    onSelect={() => {
                      onValueChange(currency.code)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === currency.code ? "opacity-100" : "opacity-0")} />
                    <div className="flex items-center justify-between w-full">
                      <span>
                        {currency.symbol} {currency.code}
                      </span>
                      <span className="text-sm text-muted-foreground">{currency.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
  )
}
