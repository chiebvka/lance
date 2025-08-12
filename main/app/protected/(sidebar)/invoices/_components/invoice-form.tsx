"use client"

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { Trash, Upload, Plus, Minus, GripVertical } from 'lucide-react'
import Image from 'next/image'
import { useInvoices, useCreateInvoice } from '@/hooks/invoices/use-invoices'
import { useCustomers } from '@/hooks/customers/use-customers'
import { useOrganization } from '@/hooks/organizations/use-organization'
import { useBanks } from '@/hooks/banks/use-banks';
import { Reorder, useDragControls } from "framer-motion";
import { generateNextInvoiceNumber } from '@/utils/invoice-helpers'
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
import { toast } from 'sonner'

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
  onSavingChange?: (saving: boolean, action?: 'draft' | 'invoice') => void
}

export interface InvoiceFormRef {
  handleSubmit: (emailToCustomer: boolean) => Promise<void>
}

const InvoiceForm = forwardRef<InvoiceFormRef, Props>(({ 
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
  const { data: invoices = [], isLoading } = useInvoices()
  const { data: customers = [], isLoading: customersLoading } = useCustomers()
  const { data: organization } = useOrganization()
  const { data: banks = [], isLoading: banksLoading } = useBanks()
  const createInvoiceMutation = useCreateInvoice()
  const queryClient = useQueryClient()
  const [isHovered, setIsHovered] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Date states
  const [issueDate, setIssueDate] = useState<Date>(new Date())
  const [dueDate, setDueDate] = useState<Date>(addDays(new Date(), 3))

  // Customer and organization states
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [fromEmail, setFromEmail] = useState<string>(userEmail || organization?.email || '')
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false)
  const [isCustomerFormLoading, setIsCustomerFormLoading] = useState(false)

  // Payment details state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<string>('')

  // Notes state
  const [notes, setNotes] = useState<string>('')

  // Invoice items state
  const [invoiceItems, setInvoiceItems] = useState([
    { id: 1, description: '', quantity: 0, price: 0, total: 0, position: 0 }
  ])

  // Layout options state with defaults - sync with parent
  const layoutOpts = {
    hasTax: layoutOptions?.hasTax ?? true,
    hasVat: layoutOptions?.hasVat ?? true,
    hasDiscount: layoutOptions?.hasDiscount ?? true
  }

  // Tax and discount rates state
  const [taxRate, setTaxRate] = useState(10) // Default 10%
  const [vatRate, setVatRate] = useState(20) // Default 20%
  const [discountAmount, setDiscountAmount] = useState(0)

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    // Use prop if available, otherwise default to organization's base currency or CAD
    if (propSelectedCurrency) return propSelectedCurrency
    const orgCurrency = organization?.baseCurrency || 'CAD'
    return currencies.find(c => c.code === orgCurrency) || currencies.find(c => c.code === 'CAD')!
  })

  // Update local state when prop changes
  React.useEffect(() => {
    if (propSelectedCurrency) {
      setSelectedCurrency(propSelectedCurrency)
    }
  }, [propSelectedCurrency])

  // Generate the next invoice number
  const nextInvoiceNumber = generateNextInvoiceNumber(invoices)

  // Calculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0)
  const discountValue = subtotal * (discountAmount / 100)
  const taxAmount = layoutOpts.hasTax ? subtotal * (taxRate / 100) : 0
  const vatAmount = layoutOpts.hasVat ? subtotal * (vatRate / 100) : 0
  const total = subtotal + taxAmount + vatAmount - discountValue

  // Get invoice details with positions for database
  const getInvoiceDetails = () => {
    return invoiceItems.map((item, index) => ({
      position: index + 1,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.total,
    }))
  }

  // Get invoice data for submission
  const getInvoiceData = () => {
    return {
      customerId: selectedCustomer,
      organizationName: organization?.name,
      organizationLogoUrl: organization?.logoUrl,
      organizationEmail: organization?.email || userEmail,
      recepientName: selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.name : null,
      recepientEmail: selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.email : null,
      issueDate: issueDate,
      dueDate: dueDate,
      currency: selectedCurrency.code,
      hasVat: layoutOpts.hasVat,
      hasTax: layoutOpts.hasTax,
      hasDiscount: layoutOpts.hasDiscount,
      vatRate: layoutOpts.hasVat ? vatRate : 0,
      taxRate: layoutOpts.hasTax ? taxRate : 0,
      discount: layoutOpts.hasDiscount ? discountAmount : 0,
      notes: notes, // Add notes state if needed
      paymentInfo: selectedPaymentMethod,
      paymentDetails: paymentDetails,
      invoiceDetails: getInvoiceDetails(),
      state: selectedCustomer ? "draft" : "unassigned",
    }
  }

  // Handle customer selection
  const handleCustomerSelect = (customerId: string | null) => {
    setSelectedCustomer(customerId)
    onCustomerChange?.(customerId ? customers.find(c => c.id === customerId) : null)
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

    if (invoiceItems.length === 0 || invoiceItems.every(item => !item.description)) {
      toast.error("Please add at least one invoice item")
      return
    }

    if (emailToCustomer && !selectedCustomer) {
      toast.error("Please select a customer to send the invoice")
      return
    }

    const invoiceData = {
      ...getInvoiceData(),
      emailToCustomer,
      state: (emailToCustomer ? "sent" : (selectedCustomer ? "draft" : "unassigned")) as "draft" | "unassigned" | "sent" | "settled" | "overdue" | "cancelled"
    }

    try {
      onSavingChange?.(true, emailToCustomer ? 'invoice' : 'draft')
      await createInvoiceMutation.mutateAsync(invoiceData)
      
      toast.success(emailToCustomer ? "Invoice sent successfully!" : "Invoice saved as draft!")
      onSuccess?.()
    } catch (error: any) {
      console.error("Invoice creation error:", error)
      toast.error(error.response?.data?.error || "Failed to create invoice")
    } finally {
      onSavingChange?.(false, emailToCustomer ? 'invoice' : 'draft')
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

  // Handle payment method selection
  const handlePaymentMethodChange = (value: string | null) => {
    setSelectedPaymentMethod(value)
  }

  // Handle payment details content change
  const handlePaymentDetailsChange = (content: string) => {
    setPaymentDetails(content)
  }

  // This is now handled by the parent component through layoutOptions prop

  // Handle quantity changes with +/- buttons
  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity < 0) return
    setInvoiceItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: Math.round((newQuantity * item.price) * 100) / 100 }
        : item
    ))
  }

  // Handle price changes
  const handlePriceChange = (itemId: number, newPrice: number) => {
    setInvoiceItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, price: newPrice, total: Math.round((item.quantity * newPrice) * 100) / 100 }
        : item
    ))
  }

  // Add new invoice item
  const addInvoiceItem = () => {
    const newId = Math.max(...invoiceItems.map(item => item.id)) + 1
    const newPosition = invoiceItems.length
    setInvoiceItems(prev => [...prev, { id: newId, description: '', quantity: 0, price: 0, total: 0, position: newPosition }])
  }

  // Remove invoice item
  const removeInvoiceItem = (itemId: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(prev => {
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
                <span className='font-medium'>Invoice No:</span>
                <span className=''>{isLoading ? 'Loading...' : nextInvoiceNumber}</span>
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
                <span className='font-medium'>Due Date:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "MM/dd/yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => date && setDueDate(date)}
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

        {/* Invoice Items Section */}
        <div className='my-6'>
          <div className='border rounded-none overflow-hidden'>
            {/* Table Header */}
            <div className={`bg-bexoni/10 hover:bg-bexoni/10 px-4 py-3 grid gap-4 text-sm font-medium text-primary ${invoiceItems.length > 1 ? 'grid-cols-12' : 'grid-cols-11'}`}>
              {invoiceItems.length > 1 && <div className='col-span-1'></div>}
              <div className={invoiceItems.length > 1 ? 'col-span-4' : 'col-span-5'}>Description</div>
              <div className={invoiceItems.length > 1 ? 'col-span-2' : 'col-span-2'}>Quantity</div>
              <div className={invoiceItems.length > 1 ? 'col-span-2' : 'col-span-2'}>Price</div>
              <div className={invoiceItems.length > 1 ? 'col-span-2' : 'col-span-2'}>Total</div>
              <div className={invoiceItems.length > 1 ? 'col-span-1' : 'col-span-0'}></div>
            </div>
            
            {/* Reorderable Items */}
            {invoiceItems.length > 1 ? (
              <Reorder.Group 
                axis="y" 
                values={invoiceItems} 
                onReorder={(newItems) => {
                  const updatedItems = newItems.map((item, index) => ({
                    ...item,
                    position: index
                  }))
                  setInvoiceItems(updatedItems)
                }}
                className="space-y-0"
              >
                {invoiceItems.map((item) => (
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
                          onChange={(e) => setInvoiceItems(prev => prev.map(invoice => 
                            invoice.id === item.id 
                              ? { ...invoice, description: e.target.value }
                              : invoice
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
                          onClick={() => removeInvoiceItem(item.id)}
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
                      value={invoiceItems[0]?.description || ''}
                      onChange={(e) => setInvoiceItems(prev => prev.map(invoice => 
                        invoice.id === invoiceItems[0]?.id 
                          ? { ...invoice, description: e.target.value }
                          : invoice
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
                        onClick={() => handleQuantityChange(invoiceItems[0]?.id || 0, (invoiceItems[0]?.quantity || 0) - 1)}
                        disabled={(invoiceItems[0]?.quantity || 0) <= 0}
                        className="h-8 w-8 rounded-none border border-purple-200 dark:border-purple-700  transition-all duration-200"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={invoiceItems[0]?.quantity || ''}
                        onChange={(e) => handleQuantityChange(invoiceItems[0]?.id || 0, parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                        min="0"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(invoiceItems[0]?.id || 0, (invoiceItems[0]?.quantity || 0) + 1)}
                        className="h-8 w-8 rounded-none border border-purple-200 dark:border-purple-700 transition-all duration-200"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className='col-span-2'>
                    <Input 
                      type="number" 
                      value={invoiceItems[0]?.price || ''}
                      onChange={(e) => handlePriceChange(invoiceItems[0]?.id || 0, parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className='w-24 px-2 py-1 border text-sm'
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className='col-span-2 text-sm font-medium'>
                    {selectedCurrency.symbol}{(invoiceItems[0]?.total || 0).toFixed(2)}
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
              onClick={addInvoiceItem}
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
          <div>
            <ComboTextarea
              banks={banks}
              label="Payment Details"
              placeholder="Select payment method..."
              textareaPlaceholder="Enter payment instructions..."
              onValueChange={handlePaymentMethodChange}
              onContentChange={handlePaymentDetailsChange}
            />
          </div>
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

export default InvoiceForm