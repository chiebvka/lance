"use client"


import SuccessConfirmModal from '@/components/modal/success-confirm-modal';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, BarChart3, Bell, Calendar, Clock, Copy, Edit, ExternalLink, FileText, HardDriveDownload, Mail, MessageSquareShare, SquareArrowOutUpRight, User } from 'lucide-react';
import React from 'react';
import { differenceInDays, isBefore, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { baseUrl } from '@/utils/universal';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { downloadFeedbackAsCSV } from '@/utils/exportCsv';

type Feedback = {
  id: string
  recepientEmail?: string | null
  recepientName?: string | null
  name?: string | null
  created_at?: string | null
  filledOn?: string | null
  dueDate?: string | null
  questions?: any
  answers?: any
  state?: string | null
  token?: string | null
  // ... add other fields as needed
}

type Props = {
  feedback: Feedback
}



const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "draft":
      return "bg-blue-100 text-blue-800";
    case "sent":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High":
        return "text-red-600 bg-red-50"
      case "Medium":
        return "text-yellow-600 bg-yellow-50"
      case "Low":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

export default function FeedbackSheet({ feedback }: { feedback: Feedback }) {
  // Normalize fields
  const router = useRouter();
  
  const token = feedback.token;


  const recipient = feedback.recepientEmail ?? 'N/A'
  const created = feedback.created_at ? format(new Date(feedback.created_at), 'd MMMM yyyy') : 'N/A'
  const due = feedback.dueDate ? format(new Date(feedback.dueDate), 'd MMMM yyyy') : 'N/A'
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
  {/* Form Link */}
  const showFormLink = !!token && state !== "draft";

  const [showReminderModal, setShowReminderModal] = useState(false)
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

  console.log(feedback)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 pt-2">
        <span className='flex items-center gap-2'>
        <span className="text-sm text-muted-foreground">State</span>
          <Badge className={getStatusColor(state)}>{state.charAt(0).toUpperCase() + state.slice(1)}</Badge>
        </span>
        <span className='flex items-center gap-2'>
          <span className="text-sm text-muted-foreground">Form-{feedback.id.slice(0, 4)}</span>
        </span>
      </div>
      <Separator />

      <div className="space-y-6 pt-6">
        {/* Key Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sent to</span>
            </div>
            <span className="text-sm">{recipient}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Created</span>
            </div>
            <span className="text-sm">{created}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Due date</span>
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
        </div>

        <Separator />
        <div className="border p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Completion Progress</span>
            <span className="text-sm font-bold">{progressLabel}</span>
          </div>
          <Progress value={progress} className="h-2 mb-2" />
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
      <input
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
                      onClick={() => setShowReminderModal(true)}
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

            <SuccessConfirmModal
                isOpen={showReminderModal}
                onClose={() => setShowReminderModal(false)}
                feedbackId={feedback.id}
                feedbackState={state}
                recipientEmail={feedback.recepientEmail ?? ''}
            />
        </div>

      </div>
    </div>
  )
}