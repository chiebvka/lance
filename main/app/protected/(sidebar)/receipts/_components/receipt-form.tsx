"use client"

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Trash, Upload, Plus, Minus, GripVertical } from 'lucide-react'
import Image from 'next/image'
import { useCustomers } from '@/hooks/customers/use-customers'
import { useOrganization } from '@/hooks/organizations/use-organization'
import { useBanks } from '@/hooks/banks/use-banks';
import { Reorder, useDragControls } from "framer-motion";
import { useReceipts, useCreateReceipt } from '@/hooks/receipts/use-receipts'
import { generateNextReceiptNumber} from '@/utils/receipt-helpers';
import InvoiceReceiptUploader from '@/components/invoice-receipt/uploader'
import { format, addDays } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import ComboBox from '@/components/combobox'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import CustomerForm from '@/app/protected/(sidebar)/customers/_components/customer-form'
import { useQueryClient } from '@tanstack/react-query'
import { Bubbles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ComboTextarea from '@/components/combotextarea'
import { Label } from '@/components/ui/label'
import { currencies, type Currency } from '@/data/currency'
import { toast } from 'sonner';



type Props = {
    userEmail?: string | null
    layoutOptions?: {
      hasTax: boolean
      hasVat: boolean
      hasDiscount: boolean
    }
    onLayoutOptionChange?: (key: string, value: boolean) => void
    selectedCurrency?: Currency
    onCurrencyChange?: (currencyCode: string) => void
    onSuccess?: () => void
    onLoadingChange?: (loading: boolean) => void
    onCancel?: () => void
    onFormValidChange?: (valid: boolean) => void
    onCustomerChange?: (customer: any) => void
    onSavingChange?: (saving: boolean, action?: 'draft' | 'receipt') => void
}

export interface ReceiptFormRef {
    handleSubmit: (emailToCustomer: boolean) => Promise<void>
  }

const ReceiptForm = forwardRef<ReceiptFormRef, Props>(({ 
    userEmail, 
    layoutOptions, 
    onLayoutOptionChange, 
    selectedCurrency: propSelectedCurrency, 
    onCurrencyChange,
    onSuccess,
    onLoadingChange,
    onCancel,
    onFormValidChange,
    onCustomerChange,
    onSavingChange
}, ref) => {

    const { data: receipts = [], isLoading } = useReceipts()
    const { data: customers = [], isLoading: customersLoading } = useCustomers()
    const { data: organization } = useOrganization()
    const { data: banks = [], isLoading: banksLoading } = useBanks()
    const createReceiptMutation = useCreateReceipt()
    const queryClient = useQueryClient()
    const [isHovered, setIsHovered] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [disabled, setDisabled] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

      // Date states
  const [issueDate, setIssueDate] = useState<Date>(new Date())
  const [paymentConfirmedAt, setPaymentConfirmedAt] = useState<Date>(addDays(new Date(), 3))

  // Customer and organization states
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [fromEmail, setFromEmail] = useState<string>(userEmail || organization?.email || '')
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false)
  const [isCustomerFormLoading, setIsCustomerFormLoading] = useState(false)

  // Notes state
  const [notes, setNotes] = useState<string>('')

  // Receipt items state
  const [receiptItems, setReceiptItems] = useState([
    { id: 1, description: '', quantity: 0, price: 0, total: 0, position: 0 }
  ])

  // Layout options state with defaults - sync with parent
  const layoutOpts = {
    hasTax: layoutOptions?.hasTax ?? true,
    hasVat: layoutOptions?.hasVat ?? true,
    hasDiscount: layoutOptions?.hasDiscount ?? true,
  }

  // Tax and discount rates state
  const [taxRate, setTaxRate] = useState(10) // Default 10%
  const [vatRate, setVatRate] = useState(20) // Default 20%
  const [discountAmount, setDiscountAmount] = useState(0)
  
  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    if (propSelectedCurrency) return propSelectedCurrency
    return currencies[0]
  })

  // Update local state when prop changes
  React.useEffect(() => {
    if (propSelectedCurrency) {
      setSelectedCurrency(propSelectedCurrency)
    }
  }, [propSelectedCurrency])

  // Generate the next receipt number
  const nextReceiptNumber = generateNextReceiptNumber(receipts)

  // Calculate totals
  const subtotal = receiptItems.reduce((sum, item) => sum + item.total, 0)
  const discountValue = subtotal * (discountAmount / 100)
  const taxAmount = layoutOpts.hasTax ? subtotal * (taxRate / 100) : 0
  const vatAmount = layoutOpts.hasVat ? subtotal * (vatRate / 100) : 0
  const total = subtotal + taxAmount + vatAmount - discountValue

  // Get receipt details with positions for database
  const getReceiptDetails = () => {
    return receiptItems.map((item, index) => ({
      position: index + 1,
      description: item.description,
      quantity: item.quantity,
      // API normalizes price -> unitPrice
      price: item.price,
      total: item.total
    }))
  }


  // Get receipt data for submission
  const getReceiptData = () => {
    return {
      customerId: selectedCustomer,
      organizationName: organization?.name,
      organizationLogoUrl: organization?.logoUrl,
      organizationEmail: organization?.email || userEmail,
      recepientName: selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.name : null,
      recepientEmail: selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.email : null,
      issueDate: issueDate,
      paymentConfirmedAt: paymentConfirmedAt,
      currency: selectedCurrency.code,
      hasVat: layoutOpts.hasVat,
      hasTax: layoutOpts.hasTax,
      hasDiscount: layoutOpts.hasDiscount,
      taxRate: taxRate,
      vatRate: vatRate,
      discount: discountAmount,
      notes: notes,

      state: selectedCustomer ? "draft" : "unassigned",
      receiptDetails: getReceiptDetails(),
    }
  }


  // Handle customer selection
  const handleCustomerSelect = (customerId: string | null) => {
    setSelectedCustomer(customerId)
    onCustomerChange?.(customerId)
  }

  // Get customer items for combobox
  const customerItems = customers.map(customer => ({
    value: customer.id,
    label: customer.name,
    searchValue: `${customer.name} ${customer.email || ''}`.trim()
  }))

  // Get selected customer data     
  const selectedCustomerData = customers.find(c => c.id === selectedCustomer)

  // Handle form submission
  const handleSubmit = async (emailToCustomer = false) => {
    if (!organization) {
      toast.error("You must be part of an organization to create invoices")
      return
    }

    if (receiptItems.length === 0 || receiptItems.every(item => !item.description)) {
      toast.error("Please add at least one receipt item")
      return
    }

    if (emailToCustomer && !selectedCustomer) {
      toast.error("Please select a customer to send the invoice")
      return
    }

    const receiptData = {
      ...getReceiptData(),
      emailToCustomer,
      state: (emailToCustomer ? "sent" : (selectedCustomer ? "draft" : "unassigned")) as "draft" | "unassigned" | "sent" | "settled" | "overdue" | "cancelled"
    }

    try {
      onSavingChange?.(true, emailToCustomer ? 'receipt' : 'draft')
      await createReceiptMutation.mutateAsync(receiptData)
      
      toast.success(emailToCustomer ? "Receipt sent successfully!" : "Receipt saved as draft!")
      onSuccess?.()
    } catch (error: any) {
      console.error("Invoice creation error:", error)
      toast.error(error.response?.data?.error || "Failed to create invoice")
    } finally {
      onSavingChange?.(false, emailToCustomer ? 'receipt' : 'draft')
    }
  }

  const handleClick = () => {
    if (!disabled && !loading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDelete = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

    const handleCustomerCreated = () => {
        setIsCreateCustomerOpen(false)
        // Invalidate and refetch customers
        queryClient.invalidateQueries({ queryKey: ['customers'] })
    }


    // Handle quantity changes with +/- buttons
    const handleQuantityChange = (itemId: number, newQuantity: number) => {
        if (newQuantity < 0) return
        setReceiptItems(prev => prev.map(item => 
        item.id === itemId 
            ? { ...item, quantity: newQuantity, total: Math.round((newQuantity * item.price) * 100) / 100 }
            : item
        ))
    }

    // Handle price changes
    const handlePriceChange = (itemId: number, newPrice: number) => {
    setReceiptItems(prev => prev.map(item => 
        item.id === itemId 
        ? { ...item, price: newPrice, total: Math.round((item.quantity * newPrice) * 100) / 100 }
        : item
    ))
    }

    // Add new receipt item
    const addReceiptItem = () => {
    const newId = Math.max(...receiptItems.map(item => item.id)) + 1
    const newPosition = receiptItems.length
    setReceiptItems(prev => [...prev, { id: newId, description: '', quantity: 0, price: 0, total: 0, position: newPosition }])
    }

    // Remove invoice item
    const removeReceiptItem = (itemId: number) => {
        if (receiptItems.length > 1) {
        setReceiptItems(prev => {
            const filtered = prev.filter(item => item.id !== itemId)
            // Update positions after removal
            return filtered.map((item, index) => ({
            ...item,
            position: index
            }))
        })
        }
    }

  useImperativeHandle(ref, () => ({
    handleSubmit: (emailToCustomer: boolean) => handleSubmit(emailToCustomer),
  }));
    
  



    return (
        <div className='min-h-screen p-6'>
        <div className='max-w-4xl mx-auto'>
          {/* Header Section */}
          <div className='flex items-start justify-between mb-8'>
            <div className='flex-1'>
              <div className='space-y-2 text-sm '>
                <div className='flex items-center gap-4'>
                  <span className='font-medium'>Receipt No:</span>
                  <span className=''>{isLoading ? 'Loading...' : nextReceiptNumber}</span>
                </div>
                <div className='flex items-center gap-4'>
                  <span className='font-medium'>Issue Date:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !issueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {issueDate ? format(issueDate, "MM/dd/yyyy") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={issueDate}
                        onSelect={(date) => date && setIssueDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='flex items-center gap-4'>
                  <span className='font-medium'>Payment Date:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !paymentConfirmedAt && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {paymentConfirmedAt ? format(paymentConfirmedAt, "MM/dd/yyyy") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={paymentConfirmedAt}
                        onSelect={(date) => date && setPaymentConfirmedAt(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            {/* Logo Uploader */}
            <div className='ml-8'>
              <InvoiceReceiptUploader 
                description="Click to upload your company logo"
              />
            </div>
          </div>
  
          {/* Currency Selection Section */}
          <div className='mb-6'>
            <div className='flex items-center gap-4'>
              <Label className='font-semibold text-sm'>Currency:</Label>
              <div className='w-60'>
                <ComboBox
                  items={currencies.map(currency => ({
                    value: currency.code,
                    label: currency.label,
                    searchValue: `${currency.code} ${currency.name} ${currency.symbol}`.toLowerCase()
                  }))}
                  value={selectedCurrency.code}
                  onValueChange={(value) => {
                    if (value && onCurrencyChange) {
                      onCurrencyChange(value)
                    }
                  }}
                  placeholder="Select currency..."
                  searchPlaceholder="Search currencies..."
                  emptyMessage="No currencies found."
                  itemRenderer={(item) => (
                    <div className="flex items-center justify-between w-full">
                      <span>{item.label}</span>
                      <span className="text-xs text-gray-500">{item.value}</span>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        
        <div className='flex w-full space-x-3 gap-4'>
            {/* From Section */}
            <div className='w-1/2 mb-6'>
              <h3 className='font-semibold  mb-3'>From</h3>
              <div>
                <Input 
                  type="email" 
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="Enter your email"
                  className=''
                />
              </div>
            </div>
  
            {/* To Section */}
            <div className='w-1/2 mb-6'>
              <h3 className='font-semibold  mb-3'>To</h3>
                <div>
                  <Sheet open={isCreateCustomerOpen} onOpenChange={setIsCreateCustomerOpen}>
                    <ComboBox
                      items={customerItems}
                      value={selectedCustomer}
                      onValueChange={handleCustomerSelect}
                      placeholder="Search customer..."
                      searchPlaceholder="Search customer..."
                      emptyMessage="No customers found."
                      onCreate={{
                        label: "Create customer",
                        action: () => setIsCreateCustomerOpen(true)
                      }}
                    />
                    <SheetContent withGap={true} bounce="right" className="flex flex-col w-full sm:w-3/4 md:w-1/2 lg:w-[40%]">
                      <SheetHeader>
                        <SheetTitle>New Customer</SheetTitle>
                        <SheetDescription>
                          Fill in the details below to create a new customer. This customer will be
                          available for future invoices.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="flex-grow overflow-y-auto py-4 pr-4">
                        <CustomerForm
                          onSuccess={handleCustomerCreated}
                          onLoadingChange={setIsCustomerFormLoading}
                        />
                      </div>
                      <SheetFooter>
                        <Button
                          variant="ghost"
                          onClick={() => setIsCreateCustomerOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          form="customer-form"
                          disabled={isCustomerFormLoading}
                        >
                          {isCustomerFormLoading ? (
                            <>
                              <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.5s]" />
                              Creating customer...
                            </>
                          ) : (
                            "Create Customer"
                          )}
                        </Button>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </div>
            </div>
        </div>
  
          {/* Receipt Items Section */}
          <div className='my-6'>
            <div className='border rounded-none overflow-hidden'>
              {/* Table Header */}
              <div className={`bg-bexoni/10 hover:bg-bexoni/10 px-4 py-3 grid gap-4 text-sm font-medium text-primary ${receiptItems.length > 1 ? 'grid-cols-12' : 'grid-cols-11'}`}>
                {receiptItems.length > 1 && <div className='col-span-1'></div>}
                <div className={receiptItems.length > 1 ? 'col-span-4' : 'col-span-5'}>Description</div>
                <div className={receiptItems.length > 1 ? 'col-span-2' : 'col-span-2'}>Quantity</div>
                <div className={receiptItems.length > 1 ? 'col-span-2' : 'col-span-2'}>Price</div>
                <div className={receiptItems.length > 1 ? 'col-span-2' : 'col-span-2'}>Total</div>
                <div className={receiptItems.length > 1 ? 'col-span-1' : 'col-span-0'}></div>
              </div>
              
              {/* Reorderable Items */}
              {receiptItems.length > 1 ? (
                <Reorder.Group 
                  axis="y" 
                  values={receiptItems} 
                  onReorder={(newItems) => {
                    const updatedItems = newItems.map((item, index) => ({
                      ...item,
                      position: index
                    }))
                    setReceiptItems(updatedItems)
                  }}
                  className="space-y-0"
                >
                  {receiptItems.map((item) => (
                    <Reorder.Item
                      key={item.id}
                      value={item}
                      className="border-b last:border-b-0"
                    >
                      <div className='px-2 py-2 grid grid-cols-12 gap-4 items-center'>
                        {/* Drag Handle */}
                        <div className='col-span-1 flex items-center justify-center'>
                          <div className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        
                        {/* Description */}
                        <div className='col-span-4'>
                          <Input 
                            type="text" 
                            value={item.description}
                            onChange={(e) => setReceiptItems(prev => prev.map(receipt => 
                              receipt.id === item.id 
                                ? { ...receipt, description: e.target.value }
                                : receipt
                            ))}
                            placeholder="Enter description..."
                            className='w-full px-2 py-1 border text-sm'
                          />
                        </div>
                        
                        {/* Quantity */}
                        <div className='col-span-2'>
                          <div className="flex items-center space-x-3 justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 0}
                              className="h-8 w-8 rounded-none border border-purple-200 dark:border-purple-700  transition-all duration-200"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity || ''}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-12 text-center "
                              min="0"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="h-8 w-8 rounded-none border border-purple-200 dark:border-purple-700 transition-all duration-200"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className='col-span-2'>
                          <Input 
                            type="number" 
                            value={item.price || ''}
                            onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className='w-24 px-2 py-1 border text-sm'
                            min="0"
                            step="0.01"
                          />
                        </div>
                        
                        {/* Total */}
                        <div className='col-span-2 text-sm font-medium'>
                          {selectedCurrency.symbol}{item.total.toFixed(2)}
                        </div>
                        
                        {/* Delete Button */}
                        <div className='col-span-1 flex justify-center'>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 border-none hover:border-none hover:bg-red-50 text-red-400 hover:text-red-500"
                            onClick={() => removeReceiptItem(item.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              ) : (
                /* Single Item Display (No Reorder) */
                <div className='border-b'>
                  <div className='px-4 py-3 grid grid-cols-11 gap-4 items-center'>
                    <div className='col-span-5'>
                      <Input 
                        type="text" 
                        value={receiptItems[0]?.description || ''}
                        onChange={(e) => setReceiptItems(prev => prev.map(receipt => 
                          receipt.id === receiptItems[0]?.id 
                            ? { ...receipt, description: e.target.value }
                            : receipt
                        ))}
                        placeholder="Enter description..."
                        className='w-full px-2 py-1 border text-sm'
                      />
                    </div>
                    <div className='col-span-2'>
                      <div className="flex items-center space-x-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(receiptItems[0]?.id || 0, (receiptItems[0]?.quantity || 0) - 1)}
                          disabled={(receiptItems[0]?.quantity || 0) <= 0}
                          className="h-8 w-8 rounded-none border border-purple-200 dark:border-purple-700  transition-all duration-200"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={receiptItems[0]?.quantity || ''}
                          onChange={(e) => handleQuantityChange(receiptItems[0]?.id || 0, parseInt(e.target.value) || 0)}
                          className="w-16 text-center"
                          min="0"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(receiptItems[0]?.id || 0, (receiptItems[0]?.quantity || 0) + 1)}
                          className="h-8 w-8 rounded-none border border-purple-200 dark:border-purple-700 transition-all duration-200"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className='col-span-2'>
                      <Input 
                        type="number" 
                        value={receiptItems[0]?.price || ''}
                        onChange={(e) => handlePriceChange(receiptItems[0]?.id || 0, parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className='w-24 px-2 py-1 border text-sm'
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className='col-span-2 text-sm font-medium'>
                      {selectedCurrency.symbol}{(receiptItems[0]?.total || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Add Item Button */}
            <div className='mt-4 flex justify-start'>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addReceiptItem}
                className="flex items-center rounded-none gap-2"
              >
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            </div>
          </div>
  
          {/* Totals Section */}
  
          <div className='flex justify-end mb-6'>
            <div className='w-80 space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Subtotal:</span>
                <span>{selectedCurrency.symbol}{subtotal.toFixed(2)}</span>
              </div>
              {layoutOpts.hasDiscount && (
                <div className='flex justify-between items-center text-sm'>
                  <span>Discount ({discountAmount}%):</span>
                  <div className='flex items-center gap-2'>
                    <Input
                      type="number"
         
                      value={discountAmount || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        // Limit discount to 100%
                        setDiscountAmount(Math.min(100, Math.max(0, value)));
                      }}
                      className='w-16 text-right text-sm h-7'
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                    />
                    <span>-{selectedCurrency.symbol}{discountValue.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {layoutOpts.hasVat && (
                <div className='flex justify-between items-center text-sm'>
                  <div className='flex items-center gap-1'>
                    <span>VAT (</span>
                    <Input
                      type="number"
                      value={vatRate || ''}
                      onChange={(e) => setVatRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className='w-8 text-center text-xs h-5 p-0 border-0 bg-transparent focus:bg-white  rounded-none'
                      min="0"
                      max="100"
                    />
                    <span>%):</span>
                  </div>
                  <span>{selectedCurrency.symbol}{vatAmount.toFixed(2)}</span>
                </div>
              )}
              {layoutOpts.hasTax && (
                <div className='flex justify-between items-center text-sm'>
                  <div className='flex items-center gap-1'>
                    <span>Tax (</span>
                    <Input
                      type="number"
                      value={taxRate || ''}
                      onChange={(e) => setTaxRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className='w-8 text-center text-xs h-5 p-0 border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded'
                      min="0"
                      max="100"
                    />
                    <span>%):</span>
                  </div>
                  <span>{selectedCurrency.symbol}{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className='flex justify-between text-lg font-bold border-t pt-2'>
                <span>Total:</span>
                <span>{selectedCurrency.symbol}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
  
          {/* Additional Sections */}
          <div className='grid grid-cols-2 gap-6'>
   
            <div className='space-y-2'>
              <Label className='font-medium text-sm mb-3'>Notes</Label>
              <Textarea 
                variant="checkerboard"
                placeholder="Enter additional notes..."
                className='w-full px-3 py-2  '
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    )
})


export default ReceiptForm