"use client"
import React from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Trash2, Bubbles } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  customerName: string
  invoiceCount: number
  projectCount: number
  receiptCount: number
  feedbackCount: number
  isLoading?: boolean
}

export default function CustomerConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  invoiceCount,
  projectCount,
  receiptCount,
  feedbackCount,
  isLoading = false
}: Props) {
  const hasConnectedItems = projectCount > 0 || invoiceCount > 0 || receiptCount > 0 || feedbackCount > 0

  const getWarningMessage = () => {
    if (!hasConnectedItems) {
      return "This action will permanently delete the customer and cannot be undone."
    }

    const items = []
    if (projectCount > 0) items.push(`${projectCount} project${projectCount !== 1 ? 's' : ''}`)
    if (invoiceCount > 0) items.push(`${invoiceCount} invoice${invoiceCount !== 1 ? 's' : ''}`)
    if (receiptCount > 0) items.push(`${receiptCount} receipt${receiptCount !== 1 ? 's' : ''}`)
    if (feedbackCount > 0) items.push(`${feedbackCount} feedback item${feedbackCount !== 1 ? 's' : ''}`)

    const itemsText = items.join(', ')
    return `This customer has ${itemsText}. Deleting this customer will permanently remove all associated projects, invoices, receipts, feedback, walls, and paths. This action cannot be undone.`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-none bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-left">Delete Customer</DialogTitle>
              <DialogDescription className="text-left mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete the customer{" "}
            <span className="font-semibold text-foreground">"{customerName}"</span>?
          </p>
          
          {hasConnectedItems && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">
                    Warning: Connected items found
                  </p>
                  <p className="text-xs text-destructive/80">
                    {getWarningMessage()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.5s]" />
                Deleting customer...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Customer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

 