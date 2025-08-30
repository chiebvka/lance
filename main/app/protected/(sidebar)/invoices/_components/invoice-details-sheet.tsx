"use client"

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, BarChart3, Bell, Bubbles, Calendar, Clock, Copy, Edit, ExternalLink, FileText, HardDriveDownload, Mail, MessageSquareShare, SquareArrowOutUpRight, User, DollarSign, Receipt, CalendarDays, CalendarFold, GitCommitVertical, Grip, Trash2, UserPlus, X, Check, Ban } from 'lucide-react';
import { differenceInDays, isBefore, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { baseUrl } from '@/utils/universal';
import { downloadInvoiceAsPDF, type InvoicePDFData } from '@/utils/invoice-pdf';
import { useUpdateInvoice, useDeleteInvoice } from '@/hooks/invoices/use-invoices';
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
import InvoiceConfirmModal from './invoice-confirm-modal';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Invoice as InvoiceType } from '@/hooks/invoices/use-invoices'
import { cn } from '@/lib/utils';

type Invoice = {
  id: string
  invoiceNumber?: string | null
  recepientEmail?: string | null
  recepientName?: string | null
  customerId?: string | null
  created_at?: string | null
  paidOn?: string | null
  dueDate?: string | null
  issueDate?: string | null
  state?: string | null
  status?: string | null
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
  invoiceDetails?: Array<{
    position: number;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }> | null
}

type Props = {
  invoice: InvoiceType
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

export default function InvoiceDetailsSheet({ invoice }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Hooks for data and mutations
  const { data: customers = [] } = useCustomers();
  const updateInvoiceMutation = useUpdateInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();
  
  // Receipt creation mutation
  const createReceiptMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return axios.post(`/api/invoices/${invoiceId}/receipt`);
    },
    onSuccess: (response) => {
      toast.success("Receipt created successfully!");
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      // Optionally redirect to receipts page or show receipt details
    },
    onError: (error: any) => {
      console.error("Create receipt error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to create receipt";
      toast.error(errorMessage);
    },
  });
  
  // State for UI interactions
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedAssignCustomerId, setSelectedAssignCustomerId] = useState<string | null>(null);
  
  // Consolidated loading state for all actions
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  
  // State management functions
  const handleDeleteInvoice = async () => {
    try {
      await deleteInvoiceMutation.mutateAsync(invoice.id);
      toast.success("Invoice deleted successfully!");
      setIsDeleteModalOpen(false);
      // Close the sheet by navigating back
      const params = new URLSearchParams(window.location.search);
      params.delete('invoiceId');
      params.delete('type');
      router.push(`${window.location.pathname}?${params.toString()}`);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error("Failed to delete invoice");
      // Don't close the modal on error, let user try again
    }
  };

  const handleMarkAsSettled = async (settleDate: Date) => {
    setIsActionLoading(true);
    setCurrentAction('Marking as settled...');
    try {
      await updateInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
        invoiceData: {
          state: 'settled',
          paidOn: settleDate.toISOString(),
        }
      });
      toast.success("Invoice marked as settled!");
    } catch (error) {
      console.error('Error marking invoice as settled:', error);
      toast.error("Failed to mark invoice as settled");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleRestart = async (emailToCustomer: boolean) => {
    setIsActionLoading(true);
    setCurrentAction(emailToCustomer ? 'Restarting and emailing...' : 'Restarting...');
    try {
        // Get the recipient email - prefer customer email from database, fallback to invoice recipient
        const recipientEmail = invoice.customerId 
          ? (await queryClient.getQueryData(['customers']) as any[])?.find(c => c.id === invoice.customerId)?.email
          : invoice.recepientEmail;
        
        if (emailToCustomer && !recipientEmail) {
          toast.error('No valid email address found for customer');
          return;
        }

        // Build the update data
        const updateData: any = {
            state: emailToCustomer ? 'sent' : 'draft',
            emailToCustomer: emailToCustomer,
        };

        // If the invoice already has a customer assigned, we need to ensure the API has the customer data
        if (invoice.customerId) {
            updateData.customerId = invoice.customerId;
            updateData.recepientEmail = recipientEmail;
            updateData.recepientName = invoice.recepientName || invoice.customerName;
        } else if (recipientEmail) {
            // Fallback for invoices without customerId but with recipient email
            updateData.recepientEmail = recipientEmail;
            updateData.recepientName = invoice.recepientName;
        }

        await updateInvoiceMutation.mutateAsync({
            invoiceId: invoice.id,
            invoiceData: updateData
        });
        
        toast.success(`Invoice restarted as ${emailToCustomer ? 'sent' : 'draft'}!`);
    } catch (error) {
        console.error('Error restarting invoice:', error);
        toast.error("Failed to restart invoice");
    } finally {
        setIsActionLoading(false);
        setCurrentAction('');
    }
}

  const handleUnassign = async () => {
    setIsActionLoading(true);
    setCurrentAction('Unassigning...');
    try {
      const updateData: any = {
        customerId: null,
        recepientName: null,
        recepientEmail: null,
      };
      
      // Only change state to unassigned if current state is not cancelled, settled, or draft
      if (!['cancelled', 'settled', 'draft'].includes(invoice.state?.toLowerCase() || '')) {
        updateData.state = 'unassigned';
      }
      
      await updateInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
        invoiceData: updateData
      });
      toast.success("Invoice unassigned successfully!");
    } catch (error) {
      console.error('Error unassigning invoice:', error);
      toast.error("Failed to unassign invoice");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleUnassignAndUnpublish = async () => {
    setIsActionLoading(true);
    setCurrentAction('Unassigning and setting to draft...');
    try {
      await updateInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
        invoiceData: {
          state: 'draft',
          customerId: null,
          recepientName: null,
          recepientEmail: null,
        }
      });
      toast.success("Invoice unassigned and set to draft successfully!");
    } catch (error) {
      console.error('Error unassigning and unpublishing invoice:', error);
      toast.error("Failed to unassign and unpublish invoice");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleCancel = async () => {
    setIsActionLoading(true);
    setCurrentAction('Cancelling...');
    try {
      await updateInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
        invoiceData: {
          state: 'cancelled',
        }
      });
      toast.success("Invoice cancelled successfully!");
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast.error("Failed to cancel invoice");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleUnassignFromCancelled = async () => {
    setIsActionLoading(true);
    setCurrentAction('Unassigning and setting to draft...');
    try {
      await updateInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
        invoiceData: {
          state: 'draft',
          customerId: null,
          recepientName: null,
          recepientEmail: null,
        }
      });
      toast.success("Invoice unassigned and set to draft successfully!");
    } catch (error) {
      console.error('Error unassigning cancelled invoice:', error);
      toast.error("Failed to unassign cancelled invoice");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleAssignToCustomer = async (customerId: string, emailToCustomer: boolean) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (!selectedCustomer) {
      toast.error("Selected customer not found");
      return;
    }

    setIsActionLoading(true);
    setCurrentAction(emailToCustomer ? 'Assigning and emailing...' : 'Assigning...');
    try {
      await updateInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
        invoiceData: {
          state: 'draft', // Reset to draft when reassigning (including from cancelled)
          customerId: customerId,
          recepientName: selectedCustomer.name,
          recepientEmail: selectedCustomer.email,
          emailToCustomer,
        }
      });
      toast.success(emailToCustomer ? "Invoice assigned and email sent!" : "Invoice assigned to customer successfully!");
    } catch (error) {
      console.error('Error assigning invoice to customer:', error);
      toast.error(emailToCustomer ? "Failed to assign and email customer" : "Failed to assign invoice to customer");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleUpdateAssignedCustomer = async (customerId: string, emailToCustomer: boolean) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (!selectedCustomer) {
      toast.error("Selected customer not found");
      return;
    }

    setIsActionLoading(true);
    setCurrentAction(emailToCustomer ? 'Updating and emailing...' : 'Updating...');
    try {
      await updateInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
        invoiceData: {
          customerId: customerId,
          recepientName: selectedCustomer.name,
          recepientEmail: selectedCustomer.email,
          emailToCustomer,
        }
      });
      toast.success(emailToCustomer ? "Invoice updated and email sent!" : "Invoice updated successfully!");
    } catch (error) {
      console.error('Error updating assigned customer:', error);
      toast.error(emailToCustomer ? "Failed to update and email customer" : "Failed to update invoice");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleSetToUnassigned = async () => {
    setIsActionLoading(true);
    setCurrentAction('Setting to unassigned...');
    try {
      await updateInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
        invoiceData: {
          state: 'unassigned',
        }
      });
      toast.success("Invoice set to unassigned successfully!");
    } catch (error) {
      console.error('Error setting invoice to unassigned:', error);
      toast.error("Failed to set invoice to unassigned");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleCreateReceipt = async () => {
    try {
      toast.loading(
        <div className="flex items-center gap-3">
          <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s]" />
          <span>Creating Receipt...</span>
        </div>,
        { id: `create-receipt-${invoice.id}`, duration: Infinity }
      );
      await createReceiptMutation.mutateAsync(invoice.id);
      toast.dismiss(`create-receipt-${invoice.id}`);
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Error creating receipt:', error);
      toast.dismiss(`create-receipt-${invoice.id}`);
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice.customerId && !invoice.recepientEmail) {
      toast.error('No assigned customer to send invoice to');
      return;
    }
    
    // Get the recipient email - prefer customer email from database, fallback to invoice recipient
    const recipientEmail = invoice.customerId 
      ? (await queryClient.getQueryData(['customers']) as any[])?.find(c => c.id === invoice.customerId)?.email
      : invoice.recepientEmail;
    
    if (!recipientEmail) {
      toast.error('No valid email address found for customer');
      return;
    }
    
    setIsActionLoading(true);
    setCurrentAction('Sending...');
    try {
      await updateInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
        invoiceData: {
          state: 'sent',
          emailToCustomer: true,
          // Ensure we have the recipient email for the API to send the email
          recepientEmail: recipientEmail,
          recepientName: invoice.recepientName || invoice.customerName,
        }
      });
      toast.success('Invoice sent to customer!');
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  // Helper function to get available actions based on state
  const getAvailableActions = (state: string) => {
    const isAssigned = invoice.customerId || invoice.recepientEmail;
    const actions: string[] = [];
    
    switch (state.toLowerCase()) {
        case 'draft':
            actions.push('delete');
            if (isAssigned) {
                actions.push('send', 'assign', 'unassign'); // assign here means update customer
            } else {
                actions.push('assign');
            }
            break;
        case 'sent':
            actions.push('settle', 'cancel', 'delete');
            if (isAssigned) {
                actions.push('assign', 'unassign'); // assign here means update customer
            }
            break;
        case 'unassigned':
            actions.push('cancel', 'settle', 'delete', 'assign', 'create_receipt');
            break;
        case 'cancelled':
            actions.push('delete');
            if (isAssigned) {
                actions.push('restart', 'assign', 'unassign'); // assign here means update customer
            } else {
                actions.push('restart', 'assign'); // assign here means assign new customer
            }
            break;
        case 'settled':
            actions.push('unassigned', 'delete', 'create_receipt');
            if (isAssigned) {
                actions.push('assign'); // assign here means update customer
            }
            break;
        case 'overdue':
            actions.push('settle', 'cancel', 'delete');
            if (isAssigned) {
                actions.push('assign', 'unassign'); // assign here means update customer
            }
            break;
        default:
            actions.push('delete');
    }
    
    return actions;
  };

  const recipient = invoice.recepientEmail ?? 'N/A'
  const created = invoice.created_at ? format(new Date(invoice.created_at), 'd MMMM yyyy') : 'N/A'
  const due = invoice.dueDate ? format(new Date(invoice.dueDate), 'd MMMM yyyy') : 'N/A'
  const issued = invoice.issueDate ? format(new Date(invoice.issueDate), 'd MMMM yyyy') : 'N/A'
  const paid = invoice.paidOn ? format(new Date(invoice.paidOn), 'd MMMM yyyy') : 'Not paid'
  
  const state = (invoice.state ?? 'draft').toLowerCase();
  const totalAmount = invoice.totalAmount || 0;
  const currency = invoice.currency || 'USD';
  const taxRate = invoice.taxRate || 0;
  const vatRate = invoice.vatRate || 0;
  
  // Check if invoice is assigned to a customer
  const isAssigned = invoice.customerId || invoice.recepientEmail;

  // Progress calculation
  let progress = 0
  let progressLabel = ''
  let daysRemaining = ''
  let estDays = ''
  let isOverdue = false

  const now = new Date()
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null

  const formLink = `${baseUrl}/i/${invoice.id}`;
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
          <span className="text-sm text-muted-foreground">{invoice.invoiceNumber?.slice(0, 8) || invoice.id.slice(0, 8)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border rounded-none">
                {isActionLoading ? (
                  <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s]" />
                ) : (
                  <Grip size={12} />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Show loading state at the top when any action is loading */}
              {isActionLoading && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground border-b">
                  {currentAction}
                </div>
              )}
              
              {/* Restart Invoice */}
                {getAvailableActions(state).includes('restart') && invoice.customerId && (
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger disabled={isActionLoading}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Restart Invoice
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleRestart(false)} disabled={isActionLoading}>
                                Restart as Draft
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRestart(true)} disabled={isActionLoading}>
                                Restart and Email
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                )}
              {/* Send Invoice */}
              {getAvailableActions(state).includes('send') && isAssigned && (
                <DropdownMenuItem 
                  onClick={handleSendInvoice}
                  disabled={isActionLoading}
                >
                  <MessageSquareShare className="w-4 h-4 mr-2" />
                  Send Invoice
                </DropdownMenuItem>
              )}
              
              {/* Mark as settled with date picker */}
                              {getAvailableActions(state).includes('settle') && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger disabled={isActionLoading}>
                      <Check className="w-4 h-4 mr-2" />
                      Mark as settled
                    </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0 h-[350px] w-auto">
                    <CalendarComponent
                      mode="single"
                      selected={new Date()}
                      onSelect={(date) => {
                        if (date && !isActionLoading) {
                          handleMarkAsSettled(date);
                        }
                      }}
                      initialFocus
                      className="h-full"
                      disabled={isActionLoading}
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              
              {/* Assign to customer or update assigned customer */}
              {getAvailableActions(state).includes('assign') && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isActionLoading}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isAssigned
                        ? 'Update assigned customer'
                        : invoice.state === 'cancelled' && !invoice.customerId
                        ? 'Assign & Restart'
                        : 'Assign to customer'
                    }
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64 h-[350px] p-0">
                    <div className="flex flex-col h-full">
                      <Command className="flex-1">
                        <CommandInput placeholder="Search customers..." autoFocus disabled={isActionLoading} />
                        <CommandList className="h-full max-h-none">
                          <CommandEmpty>No customers found.</CommandEmpty>
                          <CommandGroup>
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.name}
                                onSelect={() => !isActionLoading && setSelectedAssignCustomerId(customer.id)}
                                disabled={isActionLoading}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    (selectedAssignCustomerId ?? invoice.customerId) === customer.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {customer.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      <div className="p-2 pt-1 flex gap-2 border-t">
                        <Button
                     
                          className="flex-1"
                          disabled={!selectedAssignCustomerId || isActionLoading}
                          onClick={() => selectedAssignCustomerId && (isAssigned ? handleUpdateAssignedCustomer(selectedAssignCustomerId, false) : handleAssignToCustomer(selectedAssignCustomerId, false))}
                        >
                          {isAssigned 
                            ? 'Update only' 
                            : invoice.state === 'cancelled' 
                            ? 'Assign & Restart as Draft' 
                            : 'Assign only'
                          }
                        </Button>
                        <Button
                      
                          variant="outline"
                          className="flex-1"
                          disabled={!selectedAssignCustomerId || isActionLoading}
                          onClick={() => selectedAssignCustomerId && (isAssigned ? handleUpdateAssignedCustomer(selectedAssignCustomerId, true) : handleAssignToCustomer(selectedAssignCustomerId, true))}
                        >
                          {isAssigned 
                            ? 'Update & Email' 
                            : invoice.state === 'cancelled' 
                            ? 'Assign, Restart & Email' 
                            : 'Assign & Email'
                          }
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              
              {/* Unassign options */}
              {getAvailableActions(state).includes('unassign') && isAssigned && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isActionLoading}>
                    <X className="w-4 h-4 mr-2" />
                    Unassign Customer
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem 
                      onClick={handleUnassign}
                      disabled={isActionLoading}
                    >
                      Unassign
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleUnassignAndUnpublish}
                      disabled={isActionLoading}
                    >
                      Unassign & Set to Draft
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              
              {/* Unassign from cancelled state */}
              {state === 'cancelled' && isAssigned && (
                                  <DropdownMenuItem 
                    onClick={handleUnassignFromCancelled}
                    disabled={isActionLoading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Unassign & Set to Draft
                  </DropdownMenuItem>
              )}
              
              {getAvailableActions(state).includes('cancel') && (
                <DropdownMenuItem 
                  onClick={handleCancel}
                  disabled={isActionLoading}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
              )}
              
              {getAvailableActions(state).includes('unassigned') && (
                <DropdownMenuItem 
                  onClick={handleSetToUnassigned}
                  disabled={isActionLoading}
                >
                  <User className="w-4 h-4 mr-2" />
                  Mark as unassigned
                </DropdownMenuItem>
              )}
              
              {/* Create Receipt */}
              {getAvailableActions(state).includes('create_receipt') && (
                <DropdownMenuItem 
                  onClick={handleCreateReceipt}
                  disabled={createReceiptMutation.isPending}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  {createReceiptMutation.isPending ? 'Creating Receipt...' : 'Create Receipt'}
                </DropdownMenuItem>
              )}
              
              {/* Delete with separator */}
              {getAvailableActions(state).includes('delete') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="text-red-600"
                    disabled={deleteInvoiceMutation.isPending}
                  >
                    {deleteInvoiceMutation.isPending ? (
                      <Bubbles className="w-4 h-4 mr-2 animate-spin [animation-duration:0.5s]" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
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
            <span className="text-sm">{invoice.recepientName || 'N/A'}</span>
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
            <span className="text-sm">{due}</span>
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
                    console.log('Invoice data for PDF:', invoice);
                    console.log('Invoice details:', invoice.invoiceDetails);
                    
                    const invoiceData: InvoicePDFData = {
                      ...invoice,
                    };
                    
                    const filename = invoice.invoiceNumber 
                      ? `${invoice.invoiceNumber}.pdf`
                      : `invoice-${invoice.id}.pdf`;
                    
                    await downloadInvoiceAsPDF(invoiceData, filename);
                    toast.success("Invoice PDF downloaded successfully!");
                  } catch (error) {
                    console.error('Error downloading invoice PDF:', error);
                    toast.error("Failed to download invoice PDF");
                  }
                }}
                title="Download Invoice PDF"
              >
                <HardDriveDownload className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="p-3 border text-sm text-muted-foreground">
              Form link will be available once the invoice is sent.
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
            Edit Invoice
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
                      ? "This invoice has already been settled."
                      : "This invoice is still in draft mode."}
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
        onClose={() => !deleteInvoiceMutation.isPending && setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteInvoice}
        title="Delete Invoice"
        itemName={invoice.invoiceNumber || invoice.id.slice(0, 8)}
        itemType="invoice"
        description="This action cannot be undone."
        isLoading={deleteInvoiceMutation.isPending}
      />

      {/* Reminder Confirmation Modal */}
      <InvoiceConfirmModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        invoiceId={invoice.id}
        invoiceState={state}
        recipientEmail={invoice.recepientEmail ?? ''}
      />


    </div>
  )
} 