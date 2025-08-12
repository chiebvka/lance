"use client"

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CalendarDays, ClipboardCopy, DollarSign, FileEdit, FileText, User, Tag, HardDriveDownload, Bell, ExternalLink, Grip, UserPlus, X, Ban, Check } from 'lucide-react'
import { format, differenceInDays, isBefore } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { baseUrl } from '@/utils/universal'
import { downloadProjectAsPDF, type ProjectPDFData } from '@/utils/project-pdf'
import axios from 'axios'
import { useCustomers } from '@/hooks/customers/use-customers'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import ConfirmModal from '@/components/modal/confirm-modal'
import ProjectConfirmModal from './project-confirm-modal'

type ProjectDetails = {
  id: string
  name?: string | null
  description?: string | null
  type?: string | null
  customerName?: string | null
  customerEmail?: string | null
  budget?: number | null
  currency?: string | null
  state?: string | null
  status?: string | null
  startDate?: string | null
  endDate?: string | null
  created_at?: string | null
  token?: string | null
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
  const queryClient = useQueryClient()
  const { data: customers = [] } = useCustomers()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

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
  const cancelMutation = useMutation({
    mutationFn: async () => {
      return axios.patch(`/api/projects/${project.id}`, { action: 'cancel' })
    },
    onSuccess: () => {
      toast.success('Project cancelled successfully!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Failed to cancel project')
  })

  const unassignMutation = useMutation({
    mutationFn: async () => {
      return axios.patch(`/api/projects/${project.id}`, { action: 'unassign' })
    },
    onSuccess: () => {
      toast.success('Project unassigned successfully!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Failed to unassign project')
  })

  const assignMutation = useMutation({
    mutationFn: async (customerId: string) => {
      return axios.patch(`/api/projects/${project.id}`, { action: 'assign', customerId, emailToCustomer: true })
    },
    onSuccess: () => {
      toast.success('Project assigned to customer! Email sent.')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Failed to assign project')
  })

  const completeMutation = useMutation({
    mutationFn: async (completedDate: Date) => {
      return axios.patch(`/api/projects/${project.id}`, { action: 'mark_completed', completedDate: completedDate.toISOString() })
    },
    onSuccess: () => {
      toast.success('Project marked as completed!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Failed to mark as completed')
  })

  const deleteMutation = useMutation({
    mutationFn: async () => axios.delete(`/api/projects/${project.id}`),
    onSuccess: () => {
      toast.success('Project deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      // Close the sheet by removing projectId from URL
      const params = new URLSearchParams(window.location.search)
      params.delete('projectId')
      params.delete('type')
      router.push(`${window.location.pathname}?${params.toString()}`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Failed to delete project')
  })

  const handleAssignToCustomer = (customerId: string) => {
    assignMutation.mutate(customerId)
  }

  const getAvailableActions = (status: string) => {
    const s = status.toLowerCase()
    switch (s) {
      case 'pending':
        return ['assign', 'unassign', 'cancel', 'delete'] as const
      case 'inprogress':
        return ['assign', 'unassign', 'cancel', 'delete'] as const
      case 'signed':
        return ['mark_completed', 'delete'] as const
      case 'overdue':
        return ['assign', 'unassign', 'cancel', 'delete'] as const
      case 'completed':
        return ['delete'] as const
      case 'cancelled':
        return ['assign', 'unassign', 'delete'] as const
      default:
        return ['delete'] as const
    }
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
                <Grip size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {getAvailableActions(status).includes('mark_completed' as any) && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Check className="w-4 h-4 mr-2" />
                    Mark as completed
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0 h-[350px] w-auto">
                    <CalendarComponent
                      mode="single"
                      selected={new Date()}
                      onSelect={(date) => { if (date) completeMutation.mutate(date) }}
                      initialFocus
                      className="h-full"
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {getAvailableActions(status).includes('assign' as any) && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign to customer
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64 h-[350px] p-0">
                    <Command className="h-full">
                      <CommandInput placeholder="Search customers..." />
                      <CommandList className="h-full max-h-none">
                        <CommandEmpty>No customers found.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((c) => (
                            <CommandItem key={c.id} value={c.name}
                              onSelect={() => handleAssignToCustomer(c.id)}
                              className="cursor-pointer">
                              <Check className="mr-2 h-4 w-4 opacity-0" />
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {getAvailableActions(status).includes('unassign' as any) && (
                <DropdownMenuItem onClick={() => unassignMutation.mutate()}>
                  <X className="w-4 h-4 mr-2" />
                  Use personal (unassign)
                </DropdownMenuItem>
              )}

              {getAvailableActions(status).includes('cancel' as any) && (
                <DropdownMenuItem onClick={() => cancelMutation.mutate()}>
                  <Ban className="w-4 h-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
              )}

              {getAvailableActions(status).includes('delete' as any) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)} className="text-red-600">
                    <X className="w-4 h-4 mr-2 rotate-45" />
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
                  const { data } = await axios.get(`/api/projects/${project.id}`)
                  const p = data?.project || {}
                  const pdfData: ProjectPDFData = {
                    id: project.id,
                    name: p.name ?? project.name ?? 'Project',
                    description: p.description ?? project.description ?? '',
                    type: (p.type ?? project.type ?? 'personal') as any,
                    customerName: p.customer?.name ?? project.customerName ?? undefined,
                    organizationName: p.organizationName ?? undefined,
                    organizationLogoUrl: p.organizationLogoUrl ?? undefined,
                    budget: p.budget ?? project.budget ?? 0,
                    currency: p.currency ?? project.currency ?? 'USD',
                    startDate: p.startDate ?? project.startDate ?? undefined,
                    endDate: p.endDate ?? project.endDate ?? undefined,
                    deliverables: (p.deliverables || [])?.map((d: any) => ({
                      name: d.name ?? null,
                      description: d.description ?? null,
                      dueDate: d.dueDate ?? null,
                    })),
                    serviceAgreement: p.serviceAgreement ?? null,
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
        onConfirm={() => deleteMutation.mutate()}
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