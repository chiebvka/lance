"use client"
import React from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Trash2, Bubbles } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  organizationName: string
  invoiceCount: number
  projectCount: number
  receiptCount: number
  feedbackCount: number
  wallCount: number
  pathCount: number
  customerCount: number
  isLoading?: boolean
}

export default function OrganizationConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  organizationName,
  invoiceCount,
  projectCount,
  receiptCount,
  feedbackCount,
  wallCount,
  pathCount,
  customerCount,
  isLoading = false
}: Props) {
  const hasConnectedItems = projectCount > 0 || invoiceCount > 0 || receiptCount > 0 || feedbackCount > 0 || wallCount > 0 || pathCount > 0 || customerCount > 0

  const getWarningMessage = () => {
    if (!hasConnectedItems) {
      return "This action will permanently delete the organization and cannot be undone."
    }

    const items = []
    if (customerCount > 0) items.push(`${customerCount} customer${customerCount !== 1 ? 's' : ''}`)
    if (projectCount > 0) items.push(`${projectCount} project${projectCount !== 1 ? 's' : ''}`)
    if (invoiceCount > 0) items.push(`${invoiceCount} invoice${invoiceCount !== 1 ? 's' : ''}`)
    if (receiptCount > 0) items.push(`${receiptCount} receipt${receiptCount !== 1 ? 's' : ''}`)
    if (feedbackCount > 0) items.push(`${feedbackCount} feedback item${feedbackCount !== 1 ? 's' : ''}`)
    if (wallCount > 0) items.push(`${wallCount} wall${wallCount !== 1 ? 's' : ''}`)
    if (pathCount > 0) items.push(`${pathCount} path${pathCount !== 1 ? 's' : ''}`)

    const itemsText = items.join(', ')
    return `This organization has ${itemsText}. Deleting this organization will permanently remove all associated data including customers, projects, invoices, receipts, feedback, walls, paths, and all uploaded files. This action cannot be undone.`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-none bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-left">Delete Organization</DialogTitle>
              <DialogDescription className="text-left mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete the organization{" "}
            <span className="font-semibold text-foreground">"{organizationName}"</span>?
          </p>
          
          {hasConnectedItems && (
            <div className="rounded-none border border-destructive/20 bg-destructive/5 p-3">
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

          {/* Statistics Grid */}
          {hasConnectedItems && (
            <div className="grid grid-cols-4 gap-3 p-3 bg-muted/30 rounded-none">
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">{customerCount}</div>
                <div className="text-xs text-muted-foreground">Customers</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">{projectCount}</div>
                <div className="text-xs text-muted-foreground">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">{invoiceCount}</div>
                <div className="text-xs text-muted-foreground">Invoices</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">{receiptCount}</div>
                <div className="text-xs text-muted-foreground">Receipts</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">{feedbackCount}</div>
                <div className="text-xs text-muted-foreground">Feedback</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">{wallCount}</div>
                <div className="text-xs text-muted-foreground">Walls</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-destructive">{pathCount}</div>
                <div className="text-xs text-muted-foreground">Paths</div>
              </div>
              <div className="text-center col-span-4">
                <div className="text-sm text-muted-foreground">
                  All uploaded files and assets will also be permanently deleted
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
                Deleting organization...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Organization
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
