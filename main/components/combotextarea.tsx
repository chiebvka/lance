"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "./ui/textarea"
import { Bank } from "@/hooks/banks/use-banks"
import { getBankType } from "@/validation/banks"

interface ComboTextareaItem {
  value: string
  label: string
  name: string
  description: string
  searchValue?: string
}

interface ComboTextareaSeamlessProps {
  items?: ComboTextareaItem[]
  banks?: Bank[]
  placeholder?: string
  textareaPlaceholder?: string
  label?: string
  className?: string
  onValueChange?: (value: string | null) => void
  onContentChange?: (content: string) => void
}

type Props = {}

// Function to format bank information based on bank type
function formatBankInfo(bank: Bank): string {
  const bankType = getBankType(bank.type || 'bank', bank.country || '')
  
  switch (bankType) {
    case 'bankUs':
      return `${bank.bankName || 'Bank'}\nAccount Name: ${bank.accountName || 'N/A'}\nAccount Number: ${bank.accountNumber || 'N/A'}\nRouting Number: ${bank.routingNumber || 'N/A'}`
    
    case 'bankCanada':
      return `${bank.bankName || 'Bank'}\nAccount Name: ${bank.accountName || 'N/A'}\nAccount Number: ${bank.accountNumber || 'N/A'}\nInstitution Number: ${bank.institutionNumber || 'N/A'}\nTransit Number: ${bank.transitNumber || 'N/A'}`
    
    case 'bankUk':
      return `${bank.bankName || 'Bank'}\nAccount Name: ${bank.accountName || 'N/A'}\nAccount Number: ${bank.accountNumber || 'N/A'}\nSort Code: ${bank.sortCode || 'N/A'}`
    
    case 'bankEurope':
      return `${bank.bankName || 'Bank'}\nAccount Name: ${bank.accountName || 'N/A'}\nIBAN: ${bank.iban || 'N/A'}\nSWIFT Code: ${bank.swiftCode || 'N/A'}`
    
    case 'crypto':
      return `${bank.bankName || 'Crypto Wallet'}\nWallet Name: ${bank.accountName || 'N/A'}\nCrypto Type: ${bank.type || 'N/A'}\nWallet Address: ${bank.accountNumber || 'N/A'}`
    
    case 'stripe':
      return `${bank.bankName || 'Stripe Payment'}\nAccount Name: ${bank.accountName || 'N/A'}\nPayment Link: ${bank.stripePaymentLink || 'N/A'}`
    
    case 'paypal':
      return `${bank.bankName || 'PayPal Payment'}\nAccount Name: ${bank.accountName || 'N/A'}\nPayment Link: ${bank.paypalPaymentLink || 'N/A'}`
    
    default:
      return `${bank.bankName || 'Bank'}\nAccount Name: ${bank.accountName || 'N/A'}\nAccount Number: ${bank.accountNumber || 'N/A'}\nBank Address: ${bank.bankAddress || 'N/A'}`
  }
}

// Function to convert banks to combobox items
function banksToItems(banks: Bank[]): ComboTextareaItem[] {
  return banks.map(bank => ({
    value: bank.id,
    label: bank.accountName || bank.bankName || 'Unnamed Account',
    name: bank.accountName || bank.bankName || 'Unnamed Account',
    description: `${bank.bankName || 'Bank'} - ${bank.country || 'Unknown Country'}`,
    searchValue: `${bank.accountName || ''} ${bank.bankName || ''} ${bank.country || ''}`.trim()
  }))
}

export default function ComboTextarea({
    items = [],
    banks = [],
    placeholder = "Select payment method...",
    textareaPlaceholder = "Enter payment instructions...",
    label = "Payment Details",
    className = "",
    onValueChange,
    onContentChange,
  }: ComboTextareaSeamlessProps) {
    const [selectedValue, setSelectedValue] = React.useState<string | null>(null)
    const [textareaContent, setTextareaContent] = React.useState("")
    const [open, setOpen] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)
  
    // Combine items and banks
    const allItems = React.useMemo(() => {
      const bankItems = banksToItems(banks)
      return [...items, ...bankItems]
    }, [items, banks])
  
    React.useEffect(() => {
      setMounted(true)
    }, [])
  
    const selectedItem = React.useMemo(() => allItems.find((item) => item.value === selectedValue), [allItems, selectedValue])
    const selectedBank = React.useMemo(() => banks.find((bank) => bank.id === selectedValue), [banks, selectedValue])
  
    const handleValueChange = React.useCallback(
      (value: string | null) => {
        setSelectedValue(value)
        onValueChange?.(value)
  
        if (value) {
          // Check if it's a bank
          const bank = banks.find(b => b.id === value)
          if (bank) {
            const content = formatBankInfo(bank)
            setTextareaContent(content)
            onContentChange?.(content)
          } else {
            // Check if it's a regular item
            const item = items.find((item) => item.value === value)
            if (item) {
              const content = `${item.name}\n${item.description}`
              setTextareaContent(content)
              onContentChange?.(content)
            }
          }
        } else {
          setTextareaContent("")
          onContentChange?.("")
        }
        setOpen(false)
      },
      [items, banks, onValueChange, onContentChange],
    )
  
    const handleSelect = React.useCallback(
      (itemValue: string) => {
        const newValue = itemValue === selectedValue ? null : itemValue
        handleValueChange(newValue)
      },
      [handleValueChange, selectedValue],
    )
  
    const handleOpenChange = React.useCallback(
      (newOpen: boolean) => {
        if (mounted) {
          setOpen(newOpen)
        }
      },
      [mounted],
    )
  
    const handleTextareaChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      setTextareaContent(newContent)
      onContentChange?.(newContent)
    }, [onContentChange])
  
    const itemRenderer = React.useCallback(
      (item: ComboTextareaItem) => {
        // Check if this item is a bank
        const bank = banks.find(b => b.id === item.value)
        if (bank) {
          const bankType = getBankType(bank.type || 'bank', bank.country || '')
          return (
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-medium text-sm truncate">{item.name}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">
                {bankType === 'crypto' ? 'Crypto Wallet' : 
                 bankType === 'stripe' ? 'Stripe Payment' :
                 bankType === 'paypal' ? 'PayPal Payment' :
                 `${bank.bankName || 'Bank'} - ${bank.country || 'Unknown'}`}
              </span>
            </div>
          )
        }
        
        return (
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-medium text-sm truncate">{item.name}</span>
            <span className="text-xs text-muted-foreground line-clamp-2">{item.description}</span>
          </div>
        )
      },
      [banks],
    )
  
    if (!mounted) {
      return (
        <div className={`space-y-2 ${className}`}>
          <Label className="text-sm font-medium">{label}</Label>
          <div className="border-2 border-input rounded-md">
            <Button variant="ghost" className="w-full justify-between h-10 rounded-b-none border-b" disabled>
              {placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            <Textarea
              className="w-full px-3 py-2 text-sm bg-background rounded-t-none resize-none border-0 focus:outline-none"
              placeholder={textareaPlaceholder}
              variant="checkerboard"
              rows={4}
              disabled
            />
          </div>
        </div>
      )
    }
  
    return (
      <div className={`space-y-2 ${className}`}>
        <Label htmlFor="payment-details" className="text-sm font-medium">
          {label}
        </Label>
  
        {/* Seamless integrated component */}
        <div className="border border-purple-200 dark:border-purple-700 rounded-none">
          {/* Template selector header */}
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between h-10 rounded-b-none border-b border-purple-200 dark:border-purple-700 hover:bg-muted/50"
              >
                <span className="truncate text-left">
                  {selectedItem ? (
                    <span className="font-medium">{selectedItem.name}</span>
                  ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                  )}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[400px] p-0"
              align="start"
              sideOffset={4}
              avoidCollisions={true}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command shouldFilter={false}>
                <CommandInput placeholder="Search payment methods..." />
                <CommandList>
                  <CommandEmpty>No payment methods found.</CommandEmpty>
                  <CommandGroup>
                    {allItems.map((item) => (
                      <CommandItem
                        key={item.value}
                        value={item.value}
                        onSelect={() => handleSelect(item.value)}
                        className={cn("cursor-pointer", selectedValue === item.value && "bg-accent")}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", selectedValue === item.value ? "opacity-100" : "opacity-0")}
                        />
                        <div className="flex-1 min-w-0">{itemRenderer(item)}</div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
  
          {/* Integrated textarea */}
          <Textarea
            id="payment-details"
            className="w-full px-3 py-2 text-sm bg-background rounded-t-none resize-none border-0 focus:outline-none placeholder:text-muted-foreground"
            placeholder={textareaPlaceholder}
            value={textareaContent}
            onChange={handleTextareaChange}
            rows={4}
          />
        </div>
      </div>
    )
  }
  