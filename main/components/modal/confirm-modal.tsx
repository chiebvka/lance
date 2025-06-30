"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  itemName: string
  itemType: string
  description?: string
  isLoading?: boolean
  hasConnectedItems?: boolean
  connectedItemsCount?: number
  connectedItemsType?: string
  warningMessage?: string
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  description,
  isLoading = false,
  hasConnectedItems = false,
  connectedItemsCount = 0,
  connectedItemsType = "items",
  warningMessage
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-left">
                {title || `Delete ${itemType}`}
              </DialogTitle>
              <DialogDescription className="text-left mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {description || (
              <>
                Are you sure you want to permanently delete the {itemType.toLowerCase()}{" "}
                <span className="font-semibold text-foreground">"{itemName}"</span>?
              </>
            )}
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
                    {warningMessage || (
                      <>
                        This {itemType.toLowerCase()} has {connectedItemsCount} connected {connectedItemsType}.
                        You must delete all connected {connectedItemsType} before deleting this {itemType.toLowerCase()}.
                      </>
                    )}
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
            disabled={isLoading || hasConnectedItems}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete {itemType}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}