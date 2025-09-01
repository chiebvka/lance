"use client"

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CalendarDays, ClipboardCopy, DollarSign, FileEdit, FileText, User, Tag, HardDriveDownload, Bell, ExternalLink, Grip, UserPlus, X, Ban, Check, Trash2, EyeOff, Loader2, Bubbles } from 'lucide-react'
import { format, differenceInDays, isBefore } from 'date-fns'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { baseUrl } from '@/utils/universal'
import { downloadProjectAsPDF, type ProjectPDFData } from '@/utils/project-pdf'
import axios from 'axios'
import { useProject } from '@/hooks/projects/use-projects'
import { useCustomers } from '@/hooks/customers/use-customers'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import ConfirmModal from '@/components/modal/confirm-modal'
import ProjectConfirmModal from './project-confirm-modal'
import { 
  useAssignProject, 
  useUnassignProject, 
  useCancelProject, 
  useMarkProjectCompleted, 
  useDeleteProject,
  usePublishProject,
  useUnpublishProject,
  useUpdateProject
} from '@/hooks/projects/use-projects'

type ProjectDetails = {
  id: string
  name?: string | null
  description?: string | null
  type?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerId?: string | null
  budget?: number | null
  currency?: string | null
  state?: string | null
  status?: string | null
  startDate?: string | null
  endDate?: string | null
  created_at?: string | null
  token?: string | null
  serviceAgreement?: string | null
  deliverables?: Array<{ name?: string | null; description?: string | null; dueDate?: string | null }>
}

type Props = {
  project: ProjectDetails
}

const getStateColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-blue-100 text-blue-800";
    case "inProgress":
      return "bg-yellow-100 text-yellow-800";
    case "signed":
      return "bg-lime-100 text-lime-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return 'bg-stone-300 text-stone-800 line-through'
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function ProjectDetailsSheet({ project }: Props) {
  const router = useRouter()
  
  // Fetch full project details with deliverables and service agreement
  const { data: fullProject, isLoading: isLoadingFullProject } = useProject(project.id)
  const queryClient = useQueryClient()
  const { data: customers = [] } = useCustomers()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedAssignCustomerId, setSelectedAssignCustomerId] = useState<string | null>(null)



  const [isActionLoading, setIsActionLoading] = useState(false)
  const [currentAction, setCurrentAction] = useState<string>('')
  
  // Loading states for different actions
  const [isAssigning, setIsAssigning] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  // const [isUnassigning, setIsUnassigning] = useState(false)
  // const [isUnassigningAndUnpublishing, setIsUnassigningAndUnpublishing] = useState(false)
  // const [isUnassigningFromCancelled, setIsUnassigningFromCancelled] = useState(false)
  // const [isCancelling, setIsCancelling] = useState(false)
  // const [isUnpublishing, setIsUnpublishing] = useState(false)
  // const [isUnpublishingAndUnassigning, setIsUnpublishingAndUnassigning] = useState(false)
  // const [isPublishing, setIsPublishing] = useState(false)
  // const [isRestarting, setIsRestarting] = useState(false)

  const state = (project.state ?? 'draft').toLowerCase()
  const status = (project.status ?? 'pending').toLowerCase()
  const created = project.created_at ? format(new Date(project.created_at), 'd MMMM yyyy') : 'N/A'
  const start = project.startDate ? format(new Date(project.startDate), 'd MMMM yyyy') : 'N/A'
  const end = project.endDate ? format(new Date(project.endDate), 'd MMMM yyyy') : 'N/A'
  const budget = project.budget ?? 0
  const currency = project.currency || 'USD'
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(budget)
  
  // Check if project is assigned to a customer
  const isAssigned = !!project.customerId

  const handleEditClick = () => {
    const params = new URLSearchParams(window.location.search)
    params.set('type', 'edit')
    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  const handleCopyName = async () => {
    try {
      await navigator.clipboard.writeText(project.name || '')
    } catch {}
  }

  // Progress mapping based on status
  const statusToProgress: Record<string, { percent: number; label: string }> = {
    pending: { percent: 20, label: '20%' },
    inprogress: { percent: 50, label: '50%' },
    overdue: { percent: 75, label: '75%' },
    signed: { percent: 85, label: '85%' },
    completed: { percent: 100, label: '100%' },
    cancelled: { percent: 0, label: '0%' },
  }
  const progressData = statusToProgress[status] || { percent: 0, label: '0%' }

  // Form link logic
  const isCustomer = (project.type || '').toLowerCase() === 'customer'
  const previewLink = isCustomer && project.token
    ? `${baseUrl}/p/${project.id}?token=${project.token}`
    : `${baseUrl}/p/${project.id}`

  // Reminder button logic
  const disableReminderDueToType = !isCustomer
  const disableReminderDueToState = state !== 'published'
  const disableReminderDueToStatus = ['signed', 'completed', 'cancelled'].includes(status)
  const isReminderDisabled = disableReminderDueToType || disableReminderDueToState || disableReminderDueToStatus
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)

  // --- Mutations ---
  const cancelMutation = useCancelProject()
  const unassignMutation = useUnassignProject()
  const assignMutation = useAssignProject()
  const completeMutation = useMarkProjectCompleted()
  const deleteMutation = useDeleteProject()
  const publishMutation = usePublishProject()
  const unpublishMutation = useUnpublishProject()
  const updateMutation = useUpdateProject()

  const handleAssignToCustomer = (customerId: string, emailToCustomer: boolean) => {
    setIsActionLoading(true)
    setCurrentAction(emailToCustomer ? 'Assigning and emailing...' : 'Assigning...')
    assignMutation.mutate({ projectId: project.id, customerId, emailToCustomer })
  }

  const handleUpdateAssignedCustomer = async (customerId: string, emailToCustomer: boolean) => {
    const selectedCustomer = customers.find(c => c.id === customerId)
    if (!selectedCustomer) {
      toast.error("Selected customer not found")
      return
    }

    setIsActionLoading(true)
    setCurrentAction(emailToCustomer ? 'Updating and emailing...' : 'Updating...')
    try {
      // Use the action-based approach instead of the general update
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_customer',
          customerId: customerId,
          emailToCustomer: emailToCustomer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update customer assignment');
      }

      toast.success(emailToCustomer ? "Project updated and email sent!" : "Project updated successfully!")
      // Refresh the project data
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      console.error('Error updating assigned customer:', error)
      toast.error(emailToCustomer ? "Failed to update and email customer" : "Failed to update project")
    } finally {
      setIsActionLoading(false)
      setCurrentAction('')
    }
  }

  const handlePublish = async (asPersonal: boolean, customerId?: string | null, emailToCustomer: boolean = false) => {
    setIsActionLoading(true);
    setCurrentAction('Publishing...');
    try {
      const updateData: any = {
        action: "publish",
        name: project.name || "",
        description: project.description,
        type: asPersonal ? "personal" : "customer",
        customerId: asPersonal ? null : (customerId || project.customerId || null),
        recipientEmail: asPersonal ? null : (customerId ? undefined : project.customerEmail),
        recepientName: asPersonal ? null : (customerId ? undefined : project.customerName),
        emailToCustomer: emailToCustomer && !asPersonal
      };

      await publishMutation.mutateAsync({
        projectId: project.id,
        projectData: updateData
      });

      if (emailToCustomer && !asPersonal && (customerId || project.customerId)) {
        toast.success("Project published and email sent!");
      } else {
        toast.success("Project published successfully!");
      }
    } catch (error) {
      console.error('Error publishing project:', error);
      toast.error("Failed to publish project");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handlePublishAndAssign = async (customerId: string, emailToCustomer: boolean = false) => {
    setIsActionLoading(true);
    setCurrentAction(emailToCustomer ? 'Publishing, assigning and emailing...' : 'Publishing and assigning...');

    try {
      const selectedCustomer = customers.find(c => c.id === customerId);
      if (!selectedCustomer) {
        toast.error("Selected customer not found");
        return;
      }

      const updateData: any = {
        action: "publish",
        name: project.name || "",
        description: project.description,
        type: "customer",
        customerId: customerId,
        recipientEmail: selectedCustomer.email,
        recepientName: selectedCustomer.name,
        emailToCustomer: emailToCustomer
      };

      await publishMutation.mutateAsync({
        projectId: project.id,
        projectData: updateData
      });

      toast.success(emailToCustomer ? "Project published, assigned, and email sent!" : "Project published and assigned successfully!");
    } catch (error) {
      console.error('Error publishing and assigning project:', error);
      toast.error("Failed to publish and assign project");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleUnpublish = async () => {
    setIsActionLoading(true)
    setCurrentAction('Unpublishing...')
    try {
      await unpublishMutation.mutateAsync(project.id);
      toast.success("Project unpublished successfully!");
    } catch (error) {
      console.error('Error unpublishing project:', error);
      toast.error("Failed to unpublish project");
    } finally {
      setIsActionLoading(false)
      setCurrentAction('')
    }
  };

  const handleUnpublishAndUnassign = async () => {
    setIsActionLoading(true)
    setCurrentAction('Unpublishing and unassigning...')
    try {
      await unpublishMutation.mutateAsync(project.id);
      // After unpublishing, also unassign the customer
      await unassignMutation.mutateAsync({
        projectId: project.id,
        makeDraft: true
      });
      toast.success("Project unpublished and customer unassigned successfully!");
    } catch (error) {
      console.error('Error unpublishing and unassigning project:', error);
      toast.error("Failed to unpublish and unassign project");
    } finally {
      setIsActionLoading(false)
      setCurrentAction('')
    }
  };

  const handleUnassign = async ({ makePersonal = false, makeDraft = false }: { makePersonal?: boolean; makeDraft?: boolean }) => {
    setIsActionLoading(true)
    setCurrentAction('Unassigning...')
    try {
      await unassignMutation.mutateAsync({
        projectId: project.id,
        makePersonal,
        makeDraft
      });
    } catch (error) {
      console.error('Error unassigning project:', error);
    } finally {
      setIsActionLoading(false)
      setCurrentAction('')
    }
  };

  const handleCancel = async () => {
    setIsActionLoading(true)
    setCurrentAction('Cancelling...')
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel project');
      }

      toast.success("Project cancelled successfully!");
      // Refresh the project data
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      console.error('Error cancelling project:', error);
      toast.error("Failed to cancel project");
    } finally {
      setIsActionLoading(false)
      setCurrentAction('')
    }
  };

  const handleRestart = async () => {
    setIsActionLoading(true)
    setCurrentAction('Restarting...')
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'restart'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to restart project');
      }

      toast.success("Project restarted successfully!");
      // Refresh the project data
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      console.error('Error restarting project:', error);
      toast.error("Failed to restart project");
    } finally {
      setIsActionLoading(false)
      setCurrentAction('')
    }
  };

  const handleUnassignFromCancelled = async () => {
    setIsActionLoading(true)
    setCurrentAction('Unassigning from cancelled project...')
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unassign'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unassign customer from cancelled project');
      }

      toast.success("Customer unassigned from cancelled project successfully!");
      // Refresh the project data
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      console.error('Error unassigning customer from cancelled project:', error);
      toast.error("Failed to unassign customer from cancelled project");
    } finally {
      setIsActionLoading(false)
      setCurrentAction('')
    }
  };

  // Add effect to handle assign mutation success and reset selection
  useEffect(() => {
    if (assignMutation.isSuccess) {
      setSelectedAssignCustomerId(null) // Reset selection after successful assignment
      setIsActionLoading(false)
      setCurrentAction('')
    }
  }, [assignMutation.isSuccess])

  // Add effect to handle unassign mutation success
  useEffect(() => {
    if (unassignMutation.isSuccess) {
      setIsActionLoading(false)
      setCurrentAction('')
    }
  }, [unassignMutation.isSuccess])

  // Add effect to handle cancel mutation success
  useEffect(() => {
    if (cancelMutation.isSuccess) {
      setIsActionLoading(false)
      setCurrentAction('')
    }
  }, [cancelMutation.isSuccess])

  // Add effect to handle publish mutation success
  useEffect(() => {
    if (publishMutation.isSuccess) {
      setIsActionLoading(false)
      setCurrentAction('')
    }
  }, [publishMutation.isSuccess])

  // Add effect to handle unpublish mutation success
  useEffect(() => {
    if (unpublishMutation.isSuccess) {
      setIsActionLoading(false)
      setCurrentAction('')
    }
  }, [unpublishMutation.isSuccess])

  // Add effect to handle delete mutation success and close sheet
  useEffect(() => {
    if (deleteMutation.isSuccess) {
      // Close the sheet by removing projectId from URL
      const params = new URLSearchParams(window.location.search)
      params.delete('projectId')
      params.delete('type')
      router.push(`${window.location.pathname}?${params.toString()}`)
    }
  }, [deleteMutation.isSuccess, router])

  const getAvailableActions = (state: string, status: string, type: string) => {
    const s = status.toLowerCase()
    const st = state.toLowerCase()
    
    const actions = [];
    
    // Draft state actions
    if (st === 'draft') {
      actions.push('publish_personal', 'delete');
      if (!isAssigned) {
        actions.push('publish_customer', 'assign_customer');
      } else {
        actions.push('unassign_customer', 'update_assigned_customer');
      }
    } 
    // Published state actions
    else if (st === 'published') {
      // For signed projects, only show unpublish and delete
      if (s === 'signed') {
        actions.push('unpublish', 'delete');
      } else {
        actions.push('unpublish', 'delete');
        
        if (isAssigned) {
          actions.push('unassign_customer', 'update_assigned_customer');
        } else {
          actions.push('assign_customer');
        }
      }
    }
    
    // Status-specific actions for published projects
    if (st === 'published') {
      switch (s) {
        case 'pending':
        case 'inprogress':
        case 'overdue':
          actions.push('cancel');
          break;
        case 'signed':
          actions.push('mark_completed');
          break;
      }
    }
    
    // Cancelled status actions (regardless of state)
    if (s === 'cancelled') {
      if (isAssigned) {
        actions.push('unassign_from_cancelled');
      }
      actions.push('restart');
    }
    
    return actions;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 pt-2">
        <span className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge className={getStateColor(status)}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
        </span>
        <div className='flex items-center gap-2'>
          <span className="text-sm text-muted-foreground">{project.id.slice(0, 8)}</span>
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
            <DropdownMenuContent align="end" className="w-56">
              {/* Publish options for draft projects */}
              {/* Show loading state at the top when any action is loading */}
              {isActionLoading && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground border-b">
                  {currentAction}
                </div>
              )}
              {getAvailableActions(state, status, project.type || '').includes('publish_personal') && (
                <>
                  {/* Show "Publish as is" if project has an assigned customer */}
                  {isAssigned && (
                    <DropdownMenuItem 
                      onClick={() => handlePublish(false)} 
                      disabled={isActionLoading}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Publish as is
                    </DropdownMenuItem>
                  )}
                    <DropdownMenuItem 
                      onClick={() => handlePublish(true)} 
                      disabled={isActionLoading}
                    >
                    <User className="w-4 h-4 mr-2" />
                    Publish as Personal
                  </DropdownMenuItem>
                </>
              )}
              
              {getAvailableActions(state, status, project.type || '').includes('publish_customer') && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isActionLoading}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Publish as Customer
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-72 p-0">
                    <Command>
                      <CommandInput placeholder="Search customers..." autoFocus />
                      <CommandList>
                        <CommandEmpty>No customers found.</CommandEmpty>
                        <CommandGroup>
                        {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              onSelect={() => {
                                setSelectedAssignCustomerId(customer.id)
                              }}
                              disabled={isActionLoading}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${selectedAssignCustomerId === customer.id ? "opacity-100" : "opacity-0"}`}
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
                        onClick={() => selectedAssignCustomerId && handlePublishAndAssign(selectedAssignCustomerId, false)}
                      >
                        Publish & Assign
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        disabled={!selectedAssignCustomerId || isActionLoading}
                        onClick={() => selectedAssignCustomerId && handlePublishAndAssign(selectedAssignCustomerId, true)}
                      >
                        Publish & Email
                      </Button>
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {/* Add separator between publish and other actions */}
              {(getAvailableActions(state, status, project.type || '').includes('publish_personal') || 
                getAvailableActions(state, status, project.type || '').includes('publish_customer')) && (
                <DropdownMenuSeparator />
              )}
              
              {/* Unpublish for published projects */}
              {getAvailableActions(state, status, project.type || '').includes('unpublish') && (
                <>
                  {/* For signed projects, show simple unpublish option */}
                  {status === 'signed' ? (
                    <>
                      <DropdownMenuItem onClick={handleUnpublish} disabled={isActionLoading}>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Unpublish Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  ) : (
                    /* For non-signed projects, show unpublish options with customer management */
                    <DropdownMenuSub>
                  {/* <DropdownMenuSubTrigger disabled={isActionLoading}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isAssigned ? 'Update assigned customer' : 'Assign to customer'}
                  </DropdownMenuSubTrigger> */}
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
                                    (selectedAssignCustomerId ?? project.customerId) === customer.id ? "opacity-100" : "opacity-0"
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
                          {isAssigned ? 'Update only' : 'Assign only'}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          disabled={!selectedAssignCustomerId || isActionLoading}
                          onClick={() => selectedAssignCustomerId && (isAssigned ? handleUpdateAssignedCustomer(selectedAssignCustomerId, true) : handleAssignToCustomer(selectedAssignCustomerId, true))}
                        >
                          {isAssigned ? 'Update & Email' : 'Assign & Email'}
                        </Button>
                        </div>
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                  )}
                </>
              )}

              {/* Assign to customer or update assigned customer (not for signed projects) */}
              {(getAvailableActions(state, status, project.type || '').includes('assign_customer') || 
                getAvailableActions(state, status, project.type || '').includes('update_assigned_customer')) && 
                status !== 'signed' && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isAssigning || isUpdating}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isAssigning || isUpdating ? (
                      <>
                        <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                        {isAssigned ? 'Updating...' : 'Assigning...'}
                      </>
                    ) : (
                      isAssigned ? 'Update assigned customer' : 'Assign to customer'
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64 h-[350px] p-0">
                    <div className="flex flex-col h-full">
                      <Command className="flex-1">
                        <CommandInput placeholder="Search customers..." autoFocus disabled={isAssigning || isUpdating} />
                        <CommandList className="h-full max-h-none">
                          <CommandEmpty>No customers found.</CommandEmpty>
                          <CommandGroup>
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.name}
                                onSelect={() => !isAssigning && !isUpdating && setSelectedAssignCustomerId(customer.id)}
                                disabled={isAssigning || isUpdating}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    (selectedAssignCustomerId ?? project.customerId) === customer.id ? "opacity-100" : "opacity-0"
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
                          disabled={!selectedAssignCustomerId || isAssigning || isUpdating}
                          onClick={() => selectedAssignCustomerId && (isAssigned ? handleUpdateAssignedCustomer(selectedAssignCustomerId, false) : handleAssignToCustomer(selectedAssignCustomerId, false))}
                        >
                          {isAssigning || isUpdating ? (
                            <>
                              <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                              {isAssigned ? 'Updating...' : 'Assigning...'}
                            </>
                          ) : (
                            isAssigned ? 'Update only' : 'Assign only'
                          )}
                        </Button>
                        <Button
                       
                          variant="outline"
                          className="flex-1"
                          disabled={!selectedAssignCustomerId || isAssigning || isUpdating}
                          onClick={() => selectedAssignCustomerId && (isAssigned ? handleUpdateAssignedCustomer(selectedAssignCustomerId, true) : handleAssignToCustomer(selectedAssignCustomerId, true))}
                        >
                          {isAssigning || isUpdating ? (
                            <>
                              <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                              {isAssigned ? 'Updating...' : 'Assigning...'}
                            </>
                          ) : (
                            isAssigned ? 'Update & Email' : 'Assign & Email'
                          )}
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {/* Unassign customer (not for signed projects) */}
              {getAvailableActions(state, status, project.type || '').includes('unassign_customer') && 
                status !== 'signed' && (
                  <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isActionLoading}>
                    <X className="w-4 h-4 mr-2" />
                    Unassign Customer
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem 
                      onClick={() => handleUnassign({})} 
                      disabled={isActionLoading}
                    >
                      Unassign only
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleUnassign({ makePersonal: true })} 
                      disabled={isActionLoading}
                    >
                      Unassign & Make Personal
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleUnassign({ makeDraft: true })} 
                      disabled={isActionLoading}
                    >
                      Unassign & Make Draft
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {/* Cancel project (not for signed projects) */}
              {getAvailableActions(state, status, project.type || '').includes('cancel') && 
                status !== 'signed' && (
                  <DropdownMenuItem 
                  onClick={handleCancel}
                  disabled={isActionLoading}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Cancel
                </DropdownMenuItem> 
              )}

              {/* Unassign from cancelled state */}
              {/* {getAvailableActions(state, status, project.type || '').includes('unassign_from_cancelled') && (
                 <DropdownMenuItem 
                 onClick={handleUnassignFromCancelled}
                 disabled={isActionLoading}
               >
                 <X className="w-4 h-4 mr-2" />
                 Unassign Customer
               </DropdownMenuItem>
              )} */}

              {/* Restart cancelled project */}
              {getAvailableActions(state, status, project.type || '').includes('restart') && (
                  <DropdownMenuItem 
                  onClick={handleRestart}
                  disabled={isActionLoading}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Restart Project
                </DropdownMenuItem>
              )}

              {/* Delete project (not for signed projects) */}
              {getAvailableActions(state, status, project.type || '').includes('delete') && 
                status !== 'signed' && (
                  <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2 " />
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
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Name</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{project.name || 'Untitled Project'}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 p-0" onClick={handleCopyName}>
                <ClipboardCopy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Customer</span>
            </div>
            <span className="text-sm">{project.customerName || 'N/A'}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Type</span>
            </div>
            <span className="text-sm">{project.type || 'N/A'}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Budget</span>
            </div>
            <span className="text-sm font-medium">{formattedAmount}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Start Date</span>
            </div>
            <span className="text-sm">{start}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">End Date</span>
            </div>
            <span className="text-sm">{end}</span>
          </div>
        </div>

        <Separator />

        <div className="border p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-bold">{progressData.label}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressData.percent}%` }}
            ></div>
          </div>
          {(() => {
            const now = new Date()
            const due = project.endDate ? new Date(project.endDate) : null
            let isOverdue = false
            let daysText = ''
            let estText = ''
            if (due) {
              if (isBefore(due, now)) {
                isOverdue = true
                const days = differenceInDays(now, due)
                daysText = `${days} days overdue`
              } else {
                const days = differenceInDays(due, now)
                daysText = `${days} days remaining`
                estText = `Est. ${Math.abs(days)} days`
              }
            }
            return (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{daysText}</span>
                {!isOverdue && estText && <span>{estText}</span>}
              </div>
            )
          })()}
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="font-semibold text-base">Form Link</h3>
          <div className="flex items-center gap-2 p-3 border">
            <Input
              type="text"
              value={previewLink}
              readOnly
              className="flex-1 bg-transparent text-sm border-none outline-none"
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 border-r-2 rounded-none"
              onClick={() => {
                navigator.clipboard.writeText(previewLink)
                toast.success('Link copied to clipboard!')
              }}
            >
              <ClipboardCopy className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Download Project PDF"
              onClick={async () => {
                try {
                  // Use full project data if available, otherwise fall back to basic project data
                  const projectData = fullProject || project;
                  
                  const pdfData: ProjectPDFData = {
                    id: projectData.id,
                    name: projectData.name ?? 'Project',
                    description: projectData.description ?? '',
                    type: (projectData.type ?? 'personal') as any,
                    customerName: projectData.customerName ?? undefined,
                    budget: projectData.budget ?? 0,
                    currency: projectData.currency ?? 'USD',
                    startDate: projectData.startDate ?? undefined,
                    endDate: projectData.endDate ?? undefined,
                    deliverables: (projectData as any).deliverables?.map((d: any) => ({
                      name: d.name ?? null,
                      description: d.description ?? null,
                      dueDate: d.dueDate ?? null,
                    })) || [],
                    serviceAgreement: (projectData as any).serviceAgreement ?? null,
                  }
                  await downloadProjectAsPDF(pdfData, `${(pdfData.name || 'project')}.pdf`)
                } catch (err) {
                  console.error('Download project PDF error:', err)
                  toast.error('Failed to generate project PDF')
                }
              }}
            >
              <HardDriveDownload className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full h-11 text-base" onClick={handleEditClick}>
            <FileEdit className="w-4 h-4 mr-2" />
            Edit Project
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-10 bg-transparent"
            onClick={() => window.open(previewLink, '_blank')}
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
                    disabled={isReminderDisabled}
                    onClick={() => setIsReminderModalOpen(true)}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Send Reminder
                  </Button>
                </span>
              </TooltipTrigger>
              {isReminderDisabled && (
                <TooltipContent>
                  {disableReminderDueToType
                    ? 'Reminders are not available for personal projects.'
                    : disableReminderDueToState
                      ? 'This project is still in draft mode.'
                      : 'Reminders are disabled when status is signed, completed or cancelled.'}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate(project.id)}
        title="Delete Project"
        itemName={project.name || project.id.slice(0,8)}
        itemType="project"
        description="This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />

      <ProjectConfirmModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        projectId={project.id}
        projectState={state}
        projectStatus={status}
        recipientEmail={project.customerEmail || ''}
      />
    </div>
  )
}