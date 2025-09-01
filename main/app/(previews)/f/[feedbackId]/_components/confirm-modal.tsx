'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bubbles, FileText } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  organizationName: string
  feedbackName: string
}

export default function ConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm,
    organizationName,
    feedbackName
}: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      // Error handling is done in the parent component
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
              <FileText className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <DialogTitle className="text-left">
                Confirm Feedback Submission
              </DialogTitle>
              <DialogDescription className="text-left mt-1">
                Once you submit this feedback form "{feedbackName}", you won't be able to edit your answers. Notification emails will be sent to both parties. If you need to make changes later, you'll need to contact <span className="font-semibold">{organizationName}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.5s]" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Submit Feedback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
