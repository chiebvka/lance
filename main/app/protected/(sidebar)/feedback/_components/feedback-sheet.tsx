"use client"

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, Bubbles, Calendar, Clock, Copy, Edit, ExternalLink, FileText, HardDriveDownload, Mail, MessageSquareShare, User, CalendarDays, Grip, Trash2, UserPlus, X, Check, Ban } from 'lucide-react';
import { differenceInDays, isBefore, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { baseUrl } from '@/utils/universal';
import { downloadFeedbackAsCSV } from '@/utils/exportCsv';
import { useUpdateFeedback, useDeleteFeedback } from '@/hooks/feedbacks/use-feedbacks';
import { useCustomers } from '@/hooks/customers/use-customers';
import { useQueryClient } from '@tanstack/react-query';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import ConfirmModal from '@/components/modal/confirm-modal';
import SuccessConfirmModal from '@/components/modal/success-confirm-modal';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Feedbacks } from '@/hooks/feedbacks/use-feedbacks';

type Feedback = Feedbacks;

type Props = {
  feedback: Feedback
}

const getStateColor = (state: string) => {
  switch (state.toLowerCase()) {
    case "draft":
      return "bg-blue-100 text-blue-800";
    case "sent":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
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

export default function FeedbackSheet({ feedback }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Hooks for data and mutations
  const { data: customers = [] } = useCustomers();
  const updateFeedbackMutation = useUpdateFeedback();
  const deleteFeedbackMutation = useDeleteFeedback();
  
  // State for UI interactions
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedAssignCustomerId, setSelectedAssignCustomerId] = useState<string | null>(null);
  
  // Consolidated loading state for all actions
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  
  // State management functions
  const handleDeleteFeedback = async () => {
    try {
      await deleteFeedbackMutation.mutateAsync(feedback.id);
      toast.success("Feedback deleted successfully!");
      setIsDeleteModalOpen(false);
      // Close the sheet by navigating back
      const params = new URLSearchParams(window.location.search);
      params.delete('feedbackId');
      params.delete('type');
      router.push(`${window.location.pathname}?${params.toString()}`);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error("Failed to delete feedback");
    }
  };

  const handleMarkAsCompleted = async (completionDate: Date) => {
    setIsActionLoading(true);
    setCurrentAction('Marking as completed...');
    try {
      await updateFeedbackMutation.mutateAsync({
        feedbackId: feedback.id,
        feedbackData: {
          action: 'mark_completed',
          filledOn: completionDate.toISOString(),
        }
      });
      toast.success("Feedback marked as completed!");
    } catch (error) {
      console.error('Error marking feedback as completed:', error);
      toast.error("Failed to mark feedback as completed");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleRestart = async (emailToCustomer: boolean) => {
    setIsActionLoading(true);
    setCurrentAction(emailToCustomer ? 'Restarting and emailing...' : 'Restarting...');
    try {
      await updateFeedbackMutation.mutateAsync({
        feedbackId: feedback.id,
        feedbackData: {
          action: 'restart',
          emailToCustomer: emailToCustomer,
        }
      });
      
      toast.success(`Feedback restarted as ${emailToCustomer ? 'sent' : 'draft'}!`);
    } catch (error) {
      console.error('Error restarting feedback:', error);
      toast.error("Failed to restart feedback");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleUnassign = async () => {
    setIsActionLoading(true);
    setCurrentAction('Unassigning...');
    try {
      await updateFeedbackMutation.mutateAsync({
        feedbackId: feedback.id,
        feedbackData: {
          action: 'unassign',
          setToDraft: false,
        }
      });
      toast.success("Feedback unassigned successfully!");
    } catch (error) {
      console.error('Error unassigning feedback:', error);
      toast.error("Failed to unassign feedback");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleUnassignAndSetToDraft = async () => {
    setIsActionLoading(true);
    setCurrentAction('Unassigning and setting to draft...');
    try {
      await updateFeedbackMutation.mutateAsync({
        feedbackId: feedback.id,
        feedbackData: {
          action: 'unassign',
          setToDraft: true,
        }
      });
      toast.success("Feedback unassigned and set to draft successfully!");
    } catch (error) {
      console.error('Error unassigning and setting to draft:', error);
      toast.error("Failed to unassign and set to draft");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleCancel = async () => {
    setIsActionLoading(true);
    setCurrentAction('Cancelling...');
    try {
      await updateFeedbackMutation.mutateAsync({
        feedbackId: feedback.id,
        feedbackData: {
          action: 'cancel',
        }
      });
      toast.success("Feedback cancelled successfully!");
    } catch (error) {
      console.error('Error cancelling feedback:', error);
      toast.error("Failed to cancel feedback");
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
      await updateFeedbackMutation.mutateAsync({
        feedbackId: feedback.id,
        feedbackData: {
          action: 'assign_customer',
          customerId: customerId,
          emailToCustomer: emailToCustomer,
        }
      });
      toast.success(emailToCustomer ? "Feedback assigned and email sent!" : "Feedback assigned to customer successfully!");
    } catch (error) {
      console.error('Error assigning feedback to customer:', error);
      toast.error(emailToCustomer ? "Failed to assign and email customer" : "Failed to assign feedback to customer");
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
      await updateFeedbackMutation.mutateAsync({
        feedbackId: feedback.id,
        feedbackData: {
          action: 'update_customer',
          customerId: customerId,
          emailToCustomer: emailToCustomer,
        }
      });
      toast.success(emailToCustomer ? "Feedback updated and email sent!" : "Feedback updated successfully!");
    } catch (error) {
      console.error('Error updating assigned customer:', error);
      toast.error(emailToCustomer ? "Failed to update and email customer" : "Failed to update feedback");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleSetToUnassigned = async () => {
    setIsActionLoading(true);
    setCurrentAction('Setting to unassigned...');
    try {
      await updateFeedbackMutation.mutateAsync({
        feedbackId: feedback.id,
        feedbackData: {
          action: 'set_unassigned',
        }
      });
      toast.success("Feedback set to unassigned successfully!");
    } catch (error) {
      console.error('Error setting feedback to unassigned:', error);
      toast.error("Failed to set feedback to unassigned");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleSendFeedback = async () => {
    if (!feedback.customerId && !feedback.recepientEmail) {
      toast.error('No assigned customer to send feedback to');
      return;
    }
    
    // Get the recipient email - prefer customer email from database, fallback to feedback recipient
    const recipientEmail = feedback.customerId 
      ? (await queryClient.getQueryData(['customers']) as any[])?.find(c => c.id === feedback.customerId)?.email
      : feedback.recepientEmail;
    
    if (!recipientEmail) {
      toast.error('No valid email address found for customer');
      return;
    }
    
    setIsActionLoading(true);
    setCurrentAction('Sending...');
    try {
      await updateFeedbackMutation.mutateAsync({
        feedbackId: feedback.id,
        feedbackData: {
          action: 'send_feedback',
          recepientEmail: recipientEmail,
          recepientName: feedback.recepientName || feedback.customerName,
        }
      });
      toast.success('Feedback sent to customer!');
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast.error('Failed to send feedback');
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  // Helper function to get available actions based on state
  const getAvailableActions = (state: string) => {
    const isAssigned = feedback.customerId || feedback.recepientEmail;
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
        actions.push('complete', 'cancel', 'delete');
        if (isAssigned) {
          actions.push('assign', 'unassign'); // assign here means update customer
        }
        break;
      case 'unassigned':
        actions.push('complete', 'cancel', 'delete', 'assign');
        break;
      case 'cancelled':
        actions.push('delete');
        if (isAssigned) {
          actions.push('restart', 'assign', 'unassign'); // assign here means update customer
        } else {
          actions.push('restart', 'assign'); // assign here means assign new customer
        }
        break;
      case 'completed':
        actions.push('unassigned', 'delete');
        if (isAssigned) {
          actions.push('assign'); // assign here means update customer
        }
        break;
      case 'overdue':
        actions.push('complete', 'cancel', 'delete');
        if (isAssigned) {
          actions.push('assign', 'unassign'); // assign here means update customer
        }
        break;
      default:
        actions.push('delete');
    }
    
    return actions;
  };

  // Normalize fields
  const token = feedback.token;
  const recipient = feedback.recepientEmail ?? 'N/A'
  const created = feedback.created_at ? format(new Date(feedback.created_at), 'd MMMM yyyy') : 'N/A'
  const due = feedback.dueDate ? format(new Date(feedback.dueDate), 'd MMMM yyyy') : 'N/A'
  const filled = feedback.filledOn ? format(new Date(feedback.filledOn), 'd MMMM yyyy') : 'Not filled'
  
  // Questions count robustly
  let questionsArr: any[] = [];
  if (typeof feedback.questions === "string") {
    try {
      questionsArr = JSON.parse(feedback.questions);
    } catch {
      questionsArr = [];
    }
  } else if (Array.isArray(feedback.questions)) {
    questionsArr = feedback.questions;
  } else if (feedback.questions && typeof feedback.questions === "object") {
    questionsArr = Object.values(feedback.questions);
  }
  const questionsCount = questionsArr.length;
  const state = (feedback.state ?? 'draft').toLowerCase();
  const formLink = `${baseUrl}/f/${feedback.id}?token=${token}`;
  const showFormLink = !!token && state !== "draft";

  const canRemind = state === "sent" || state === "overdue"

  // Progress calculation
  let progress = 0
  let progressLabel = ''
  let daysRemaining = ''
  let estDays = ''
  let isOverdue = false

  const now = new Date()
  const dueDate = feedback.dueDate ? new Date(feedback.dueDate) : null

  if (state === 'draft') {
    progress = 33
    progressLabel = '33%'
    if (dueDate) {
      const days = differenceInDays(dueDate, now)
      daysRemaining = `${days} days remaining`
      estDays = `Est. ${Math.abs(days)} days`
    }
  } else if (state === 'sent') {
    progress = 66
    progressLabel = '66%'
    if (dueDate) {
      const days = differenceInDays(dueDate, now)
      if (days < 0) {
        isOverdue = true
        progress = 50
        progressLabel = '50%'
        daysRemaining = `${Math.abs(days)} days overdue`
        estDays = ''
      } else {
        daysRemaining = `${days} days remaining`
        estDays = `Est. ${Math.abs(days)} days`
      }
    }
  } else if (state === 'completed') {
    progress = 100
    progressLabel = '100%'
    daysRemaining = '0 days remaining'
    estDays = ''
  } else {
    // Overdue or unknown state
    if (dueDate && isBefore(dueDate, now)) {
      isOverdue = true
      progress = 50
      progressLabel = '50%'
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

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 pt-2">
        <span className='flex items-center gap-2'>
          <span className="text-sm text-muted-foreground">State</span>
          <Badge className={getStateColor(state)}>{state.charAt(0).toUpperCase() + state.slice(1)}</Badge>
        </span>
        <div className='flex items-center gap-2'>
          <span className="text-sm text-muted-foreground">Form-{feedback.id.slice(0, 4)}</span>
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
              
              {/* Restart Feedback - when cancelled and has customer */}
              {getAvailableActions(state).includes('restart') && feedback.customerId && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isActionLoading}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Restart Feedback
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

              {/* Restart Feedback - when cancelled and no customer */}
              {getAvailableActions(state).includes('restart') && !feedback.customerId && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isActionLoading}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Restart Feedback
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleRestart(false)} disabled={isActionLoading}>
                      Restart Only
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Restart & Assign</DropdownMenuSubTrigger>
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
                              disabled={!selectedAssignCustomerId || isActionLoading}
                              onClick={() => selectedAssignCustomerId && handleAssignToCustomer(selectedAssignCustomerId, false)}
                            >
                              Assign Only
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 rounded-none"
                              disabled={!selectedAssignCustomerId || isActionLoading}
                              onClick={() => selectedAssignCustomerId && handleAssignToCustomer(selectedAssignCustomerId, true)}
                            >
                              Assign & Email
                            </Button>
                          </div>
                        </div>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {/* Send Feedback */}
              {getAvailableActions(state).includes('send') && (
                <DropdownMenuItem 
                  onClick={handleSendFeedback}
                  disabled={isActionLoading}
                >
                  <MessageSquareShare className="w-4 h-4 mr-2" />
                  Send Feedback
                </DropdownMenuItem>
              )}
              
              {/* Mark as completed with date picker */}
              {getAvailableActions(state).includes('complete') && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isActionLoading}>
                    <Check className="w-4 h-4 mr-2" />
                    Mark as completed
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0 h-[350px] w-auto">
                    <CalendarComponent
                      mode="single"
                      selected={new Date()}
                      onSelect={(date) => {
                        if (date && !isActionLoading) {
                          handleMarkAsCompleted(date);
                        }
                      }}
                      initialFocus
                      className="h-full"
                      disabled={isActionLoading}
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              
              {/* Assign/Update customer */}
              {getAvailableActions(state).includes('assign') && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isActionLoading}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {feedback.customerId
                      ? 'Update Customer'
                      : feedback.state === 'cancelled' 
                      ? 'Assign & Restart'
                      : 'Assign Customer'
                    }
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-92 h-[350px] p-0">
                    <div className="flex flex-col h-full">
                      <Command className="flex-1">
                        <CommandInput placeholder="Search customers..." disabled={isActionLoading} />
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
                                <Check className={`mr-2 h-4 w-4 ${(selectedAssignCustomerId ?? feedback.customerId) === customer.id ? 'opacity-100' : 'opacity-0'}`} />
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
                          disabled={!selectedAssignCustomerId || isActionLoading}
                          onClick={() => selectedAssignCustomerId && (feedback.customerId ? handleUpdateAssignedCustomer(selectedAssignCustomerId, false) : handleAssignToCustomer(selectedAssignCustomerId, false))}
                        >
                          {feedback.customerId 
                            ? 'Update Only' 
                            : feedback.state === 'cancelled' 
                            ? 'Assign & Restart as Draft' 
                            : 'Assign Only'
                          }
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-none"
                          disabled={!selectedAssignCustomerId || isActionLoading}
                          onClick={() => selectedAssignCustomerId && (feedback.customerId ? handleUpdateAssignedCustomer(selectedAssignCustomerId, true) : handleAssignToCustomer(selectedAssignCustomerId, true))}
                        >
                          {feedback.customerId 
                            ? 'Update & Email' 
                            : feedback.state === 'cancelled' 
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
              {getAvailableActions(state).includes('unassign') && (feedback.customerId || feedback.recepientEmail) && (
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
                      onClick={handleUnassignAndSetToDraft}
                      disabled={isActionLoading}
                    >
                      Unassign & Set to Draft
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              
              {/* Direct action items */}
              {getAvailableActions(state).includes('cancel') && (
                <DropdownMenuItem onClick={handleCancel} disabled={isActionLoading}>
                  <Ban className="w-4 h-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
              )}
              
              {getAvailableActions(state).includes('unassigned') && (
                <DropdownMenuItem onClick={handleSetToUnassigned} disabled={isActionLoading}>
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
            <span className="text-sm">{feedback.recepientName || 'N/A'}</span>
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
              <span className="text-sm font-medium">Created</span>
            </div>
            <span className="text-sm">{created}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Due Date</span>
            </div>
            <span className="text-sm">{due}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Questions</span>
            </div>
            <span className="text-sm">{questionsCount}</span>
          </div>
          {state === 'completed' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Completed On</span>
              </div>
              <span className="text-sm">{filled}</span>
            </div>
          )}
        </div>

        <Separator />
        
        <div className="border p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Completion Progress</span>
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
                onClick={() => {
                  // Map feedback to the expected Feedback type for CSV export
                  const mappedFeedback = {
                    name: feedback.name || `Feedback ${feedback.id}`,
                    recepientName: feedback.recepientName || '',
                    recepientEmail: feedback.recepientEmail || '',
                    state: feedback.state || '',
                    created_at: feedback.created_at || '',
                    dueDate: feedback.dueDate || '',
                    filledOn: feedback.filledOn || '',
                    questions: feedback.questions || [],
                    answers: feedback.answers || [],
                  };
                  downloadFeedbackAsCSV(mappedFeedback, `feedback-${feedback.id}.csv`)
                }}
                title="Download CSV"
              >
                <HardDriveDownload className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="p-3 border text-sm text-muted-foreground">
              Form link will be available once the feedback is sent.
            </div>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            className="w-full h-11 text-base"
            onClick={() => router.push(`/protected/feedback/${feedback.id}`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Form
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
                      onClick={() => setIsReminderModalOpen(true)}
                      disabled={!canRemind}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Remind
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canRemind && (
                  <TooltipContent>
                    {state === "completed"
                      ? "This feedback form has already been submitted."
                      : "This feedback form is still in draft mode."}
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
        onConfirm={handleDeleteFeedback}
        title="Delete Feedback"
        itemName={feedback.name || feedback.id.slice(0, 8)}
        itemType="feedback"
        description="This action cannot be undone."
        isLoading={deleteFeedbackMutation.isPending}
      />

      {/* Reminder Confirmation Modal */}
      <SuccessConfirmModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        feedbackId={feedback.id}
        feedbackState={state}
        recipientEmail={feedback.recepientEmail ?? ''}
      />
    </div>
  )
}
