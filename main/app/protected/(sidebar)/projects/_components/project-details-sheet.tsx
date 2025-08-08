"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CalendarDays, ClipboardCopy, DollarSign, FileEdit, FileText, User, Tag, HardDriveDownload, Bell, ExternalLink } from 'lucide-react'
import { format, differenceInDays, isBefore } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { baseUrl } from '@/utils/universal'
import { downloadProjectAsPDF, type ProjectPDFData } from '@/utils/project-pdf'
import axios from 'axios'

type ProjectDetails = {
  id: string
  name?: string | null
  description?: string | null
  type?: string | null
  customerName?: string | null
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

const getStateColor = (state: string) => {
  switch (state.toLowerCase()) {
    case 'draft':
      return 'bg-blue-100 text-blue-800'
    case 'published':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function ProjectDetailsSheet({ project }: Props) {
  const router = useRouter()

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

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 pt-2">
        <span className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">State</span>
          <Badge className={getStateColor(state)}>{state.charAt(0).toUpperCase() + state.slice(1)}</Badge>
        </span>
        <span className="text-sm text-muted-foreground">{project.id.slice(0, 8)}</span>
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
    </div>
  )
}