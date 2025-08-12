"use client"
import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bubbles, Mail } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectState: string
  projectStatus: string
  recipientEmail: string
}

export default function ProjectConfirmModal({
  isOpen,
  onClose,
  projectId,
  projectState,
  projectStatus,
  recipientEmail,
}: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const canSend = projectState.toLowerCase() === 'published' && ['pending','inprogress','overdue'].includes(projectStatus.toLowerCase())

  const handleSendReminder = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/projects/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Reminder sent successfully!')
        onClose()
      } else {
        toast.error(data.error || 'Failed to send reminder')
      }
    } catch (err) {
      toast.error('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-none bg-purple-100">
              <Mail className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <DialogTitle className="text-left">Send Reminder Email</DialogTitle>
              <DialogDescription className="text-left mt-1">
                {canSend
                  ? <>Are you sure you want to send a reminder to <span className="font-semibold">{recipientEmail}</span>?</>
                  : <>Reminders are allowed only for <b>published</b> customer projects with status <b>pending</b>, <b>inProgress</b> or <b>overdue</b>.</>
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="default" onClick={handleSendReminder} disabled={!canSend || isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.5s]" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send Reminder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

 