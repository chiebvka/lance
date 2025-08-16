"use client"

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, BarChart3, Bell, Calendar, Clock, Copy, Edit, ExternalLink, FileText, HardDriveDownload, Mail, MessageSquareShare, SquareArrowOutUpRight, User, DollarSign, Receipt, CalendarDays, CalendarFold, GitCommitVertical, Grip, Trash2, UserPlus, X, Check, Ban } from 'lucide-react';
import { differenceInDays, isBefore, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { baseUrl } from '@/utils/universal';
import { downloadReceiptAsPDF, type ReceiptPDFData } from '@/utils/receipt-pdf';
import { useUpdateReceipt, useDeleteReceipt } from '@/hooks/receipts/use-receipts';
import { useCustomers, type Customer } from '@/hooks/customers/use-customers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import ComboBox from '@/components/combobox';
import ConfirmModal from '@/components/modal/confirm-modal';
import ReceiptConfirmModal from './receipt-confirm-modal';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Receipt as ReceiptType } from '@/hooks/receipts/use-receipts'; 

type Receipt = {
    id: string
    receiptNumber?: string | null
    recepientEmail?: string | null
    recepientName?: string | null
    customerId?: string | null
    created_at?: string | null
    creationMethod?: string | null
    paymentConfirmedAt?: string | null
    issueDate?: string | null
    state?: string | null
    totalAmount?: number | null
    subTotalAmount?: number | null
    currency?: string | null
    taxRate?: number | null
    vatRate?: number | null
    discount?: number | null
    hasDiscount?: boolean | null
    hasTax?: boolean | null
    hasVat?: boolean | null
    notes?: string | null
    organizationName?: string | null
    organizationLogo?: string | null
    organizationLogoUrl?: string | null // From organization table
    organizationNameFromOrg?: string | null // From organization table
    organizationEmailFromOrg?: string | null // From organization table
    organizationEmail?: string | null
    receiptDetails?: Array<{
        position: number;
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
      }> | null
}

type Props = {
  receipt: ReceiptType
}

const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case "draft":
        return "bg-blue-100 text-blue-800";
      case "sent":
        return "bg-yellow-100 text-yellow-800";
      case "settled":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "unassigned":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return 'bg-stone-300 text-stone-800 line-through'
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

export default function ReceiptDetailsSheet({ receipt }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Hooks for data and mutations
    const { data: customers = [] } = useCustomers();
    const updateReceiptMutation = useUpdateReceipt();
    const deleteReceiptMutation = useDeleteReceipt();

    // State for UI interactions
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [selectedAssignCustomerId, setSelectedAssignCustomerId] = useState<string | null>(null);
  
    // State management functions
    const handleDeleteReceipt = async () => {
        try {
        await deleteReceiptMutation.mutateAsync(receipt.id);
        toast.success("Receipt deleted successfully!");
        router.refresh();
        setIsDeleteModalOpen(false);
        } catch (error) {
        console.error("Delete receipt error:", error);
        toast.error("Failed to delete receipt");
        }
    };

    const handleMarkAsSettled = async (settleDate: Date) => {
        try {
          await updateReceiptMutation.mutateAsync({
            receiptId: receipt.id,
            receiptData: {
              state: 'settled',
              // Pass Date object; API accepts Date or ISO string
              paymentConfirmedAt: settleDate,
            }
          });
          toast.success("Receipt marked as settled!");
        } catch (error) {
          console.error('Error marking invoice as settled:', error);
          toast.error("Failed to mark invoice as settled");
        }
    };

    const handleUnassign = async () => {
        try {
          await updateReceiptMutation.mutateAsync({
            receiptId: receipt.id,
            receiptData: {
              state: 'unassigned',
              customerId: null,
              recepientName: null,
              recepientEmail: null,
            }
          });
          toast.success("Receipt unassigned successfully!");
        } catch (error) {
          console.error('Error unassigning invoice:', error);
          toast.error("Failed to unassign receipt");
        }
    };

    const handleCancel = async () => {
    try {
        await updateReceiptMutation.mutateAsync({
        receiptId: receipt.id,
        receiptData: {
            state: 'cancelled',
        }
        });
        toast.success("Receipt cancelled successfully!");
    } catch (error) {
        console.error('Error cancelling invoice:', error);
        toast.error("Failed to cancel receipt");
    }
    };

    const handleAssignToCustomer = async (customerId: string, emailToCustomer: boolean) => {
        const selectedCustomer = customers.find(c => c.id === customerId);
        if (!selectedCustomer) {
          toast.error("Selected customer not found");
          return;
        }

        try {
          await updateReceiptMutation.mutateAsync({
            receiptId: receipt.id,
            receiptData: {
              state: 'draft',
              customerId: customerId,
              recepientName: selectedCustomer.name,
              recepientEmail: selectedCustomer.email,
              emailToCustomer,
            }
          });
          toast.success(emailToCustomer ? "Receipt assigned and email sent!" : "Receipt assigned to customer successfully!");
        } catch (error) {
          console.error('Error assigning receipt to customer:', error);
          toast.error(emailToCustomer ? "Failed to assign and email customer" : "Failed to assign receipt to customer");
        }
    };

    const handleSetToUnassigned = async () => {
        try {
          await updateReceiptMutation.mutateAsync({
            receiptId: receipt.id,
            receiptData: {
              state: 'unassigned',
            }
          });
          toast.success("Invoice set to unassigned successfully!");
        } catch (error) {
          console.error('Error setting invoice to unassigned:', error);
          toast.error("Failed to set invoice to unassigned");
        }
    };

    // Helper function to get available actions based on state
    const getAvailableActions = (state: string) => {
        switch (state.toLowerCase()) {
        case 'draft':
            return ['assign', 'delete'];
        case 'sent':
            return ['settle', 'unassign', 'cancel', 'delete'];
        case 'unassigned':
            return ['cancel', 'settle', 'delete', 'assign', 'create_receipt'];
        case 'cancelled':
            return ['unassigned', 'delete'];
        case 'settled':
            return ['unassigned', 'delete', 'create_receipt'];
        default:
            return ['delete'];
        }
    };



  const recipient = receipt.recepientEmail ?? 'N/A'
  const created = receipt.created_at ? format(new Date(receipt.created_at), 'd MMMM yyyy') : 'N/A'
  const issued = receipt.issueDate ? format(new Date(receipt.issueDate), 'd MMMM yyyy') : 'N/A'
  const paid = receipt.paymentConfirmedAt ? format(new Date(receipt.paymentConfirmedAt), 'd MMMM yyyy') : 'Not paid'
  
  const state = (receipt.state ?? 'draft').toLowerCase();
  const totalAmount = receipt.totalAmount || 0;
  const currency = receipt.currency || 'USD';
  const taxRate = receipt.taxRate || 0;
  const vatRate = receipt.vatRate || 0;
    
    // Progress calculation
    let progress = 0
    let progressLabel = ''
    let daysRemaining = ''
    let estDays = ''
    let isOverdue = false
  
    const now = new Date()
    const dueDate = receipt.paymentConfirmedAt ? new Date(receipt.paymentConfirmedAt) : null

    const formLink = `${baseUrl}/r/${receipt.id}`;
    {/* Form Link */}
    const showFormLink =  state !== "";

    
    if (state === 'draft') {
        progress = 25
        progressLabel = '25%'
        if (dueDate) {
        const days = differenceInDays(dueDate, now)
        daysRemaining = `${days} days remaining`
        estDays = `Est. ${Math.abs(days)} days`
        }
    } else if (state === 'sent') {
        progress = 50
        progressLabel = '50%'
        if (dueDate) {
        const days = differenceInDays(dueDate, now)
        if (days < 0) {
            isOverdue = true
            progress = 75
            progressLabel = '75%'
            daysRemaining = `${Math.abs(days)} days overdue`
            estDays = ''
        } else {
            daysRemaining = `${days} days remaining`
            estDays = `Est. ${Math.abs(days)} days`
        }
        }
    } else if (state === 'settled') {
        progress = 100
        progressLabel = '100%'
        daysRemaining = '0 days remaining'
        estDays = ''
    } else {
        // Overdue or unknown state
        if (dueDate && isBefore(dueDate, now)) {
        isOverdue = true
        progress = 75
        progressLabel = '75%'
        const days = differenceInDays(now, dueDate)
        daysRemaining = `${days} days overdue`
        estDays = ''
        } else {
        progress = 0
        progressLabel = '0%'
        daysRemaining = ''
        estDays = ''
        }
    }

    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(totalAmount);

      
  return (
    <div className="p-4">
    <div className="flex items-center justify-between gap-2 pt-2">
      <span className='flex items-center gap-2'>
        <span className="text-sm text-muted-foreground">State</span>
        <Badge className={getStateColor(state)}>{state.charAt(0).toUpperCase() + state.slice(1)}</Badge>
      </span>
      <div className='flex items-center gap-2'>
        <span className="text-sm text-muted-foreground">{receipt.receiptNumber?.slice(0, 8) || receipt.id.slice(0, 8)}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border rounded-none">
              <Grip size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* Mark as settled with date picker */}
            {getAvailableActions(state).includes('settle') && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as settled
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="p-0 h-[350px] w-auto">
                  <CalendarComponent
                    mode="single"
                    selected={new Date()}
                    onSelect={(date) => {
                      if (date) {
                        handleMarkAsSettled(date);
                      }
                    }}
                    initialFocus
                    className="h-full"
                  />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            
            {/* Assign to customer with customer selection */}
            {getAvailableActions(state).includes('assign') && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserPlus className="w-4 h-4 mr-2" />
              Assign to customer
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64 h-[350px] p-0">
              <div className="flex flex-col h-full">
                <Command className="flex-1">
                  <CommandInput placeholder="Search customers..." />
                  <CommandList className="h-full max-h-none">
                    <CommandEmpty>No customers found.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.name}
                          onSelect={() => setSelectedAssignCustomerId(customer.id)}
                          className={`cursor-pointer ${selectedAssignCustomerId === customer.id ? 'bg-muted' : ''}`}
                        >
                          <Check className={`mr-2 h-4 w-4 ${selectedAssignCustomerId === customer.id ? 'opacity-100' : 'opacity-0'}`} />
                          {customer.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                <div className="p-2 border-t flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 rounded-none"
                    disabled={!selectedAssignCustomerId}
                    onClick={() => selectedAssignCustomerId && handleAssignToCustomer(selectedAssignCustomerId, false)}
                  >
                    Assign only
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-none"
                    disabled={!selectedAssignCustomerId}
                    onClick={() => selectedAssignCustomerId && handleAssignToCustomer(selectedAssignCustomerId, true)}
                  >
                    Assign & Email
                  </Button>
                </div>
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
            )}
            
            {/* Direct action items */}
            {getAvailableActions(state).includes('unassign') && (
              <DropdownMenuItem onClick={handleUnassign}>
                <X className="w-4 h-4 mr-2" />
                Unassign
              </DropdownMenuItem>
            )}
            
            {getAvailableActions(state).includes('cancel') && (
              <DropdownMenuItem onClick={handleCancel}>
                <Ban className="w-4 h-4 mr-2" />
                Cancel
              </DropdownMenuItem>
            )}
            
            {getAvailableActions(state).includes('unassigned') && (
              <DropdownMenuItem onClick={handleSetToUnassigned}>
                <User className="w-4 h-4 mr-2" />
                Mark as unassigned
              </DropdownMenuItem>
            )}
            

            
            {/* Delete with separator */}
            {getAvailableActions(state).includes('delete') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    <Separator />

    <div className="space-y-6 pt-6">
      {/* Key Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Customer</span>
          </div>
          <span className="text-sm">{receipt.recepientName || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Email</span>
          </div>
          <span className="text-sm">{recipient}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Issue Date</span>
          </div>
          <span className="text-sm">{issued}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarFold className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Due Date</span>
          </div>
          <span className="text-sm">{paid}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total Amount</span>
          </div>
          <span className="text-sm font-medium">{formattedAmount}</span>
        </div>
        {state === 'settled' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Settled On</span>
            </div>
            <span className="text-sm">{paid}</span>
          </div>
        )}
      </div>

      <Separator />
      
      <div className="border p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Payment Progress</span>
          <span className="text-sm font-bold">{progressLabel}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{daysRemaining}</span>
          {!isOverdue && estDays && <span>{estDays}</span>}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="font-semibold text-base">Form Link</h3>
        {showFormLink ? (
          <div className="flex items-center gap-2 p-3 border">
            <Input
              type="text"
              value={formLink}
              readOnly
              className="flex-1 bg-transparent text-sm border-none outline-none"
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 border-r-2 rounded-none"
              onClick={() => {
                navigator.clipboard.writeText(formLink);
                toast.success("Link copied to clipboard!");
              }}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={async () => {
                try {
                  console.log('Receipt data for PDF:', receipt);
                  console.log('Receipt details:', receipt.receiptDetails);
                  
                  const receiptData: ReceiptPDFData = {
                    ...receipt,
                  };
                  
                  const filename = receipt.receiptNumber 
                    ? `${receipt.receiptNumber}.pdf`
                    : `receipt-${receipt.id}.pdf`;
                  
                  await downloadReceiptAsPDF(receiptData, filename);
                  toast.success("Receipt PDF downloaded successfully!");
                } catch (error) {
                  console.error('Error downloading receipt PDF:', error);
                  toast.error("Failed to download receipt PDF");
                }
              }}
              title="Download Receipt PDF"
            >
              <HardDriveDownload className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="p-3 border text-sm text-muted-foreground">
            Form link will be available once the receipt is sent.
          </div>
        )}
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="space-y-3">
          <Button 
          className="w-full h-11 text-base"
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('type', 'edit');
            router.push(`${window.location.pathname}?${params.toString()}`);
          }}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Receipt
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-10 bg-transparent"
            disabled={!showFormLink}
            onClick={() => window.open(formLink, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full">
                  <Button
                    variant="outline"
                    className="h-10 bg-transparent w-full"
                    disabled={state !== "sent" && state !== "overdue"}
                    onClick={() => setIsReminderModalOpen(true)}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Send Reminder
                  </Button>
                </span>
              </TooltipTrigger>
              {state !== "sent" && state !== "overdue" && (
                <TooltipContent>
                  {state === "settled"
                    ? "This receipt has already been settled."
                    : "This receipt is still in draft mode."}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>

    {/* Delete Confirmation Modal */}
    <ConfirmModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onConfirm={handleDeleteReceipt}
      title="Delete Receipt"
      itemName={receipt.receiptNumber || receipt.id.slice(0, 8)}
      itemType="receipt"
      description="This action cannot be undone."
      isLoading={deleteReceiptMutation.isPending}
    />

    {/* Reminder Confirmation Modal */}
    <ReceiptConfirmModal
      isOpen={isReminderModalOpen}
      onClose={() => setIsReminderModalOpen(false)}
      receiptId={receipt.id}
      receiptState={state}
      recipientEmail={receipt.recepientEmail ?? ''}
    />


  </div>
  )
}