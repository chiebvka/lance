"use client"
import { Row } from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Copy, Loader2, HardDriveDownload, Bubbles } from "lucide-react"
import ConfirmModal from "@/components/modal/confirm-modal"
import Feedback from "@/validation/forms/feedback"
import { downloadFeedbackAsCSV } from '@/utils/exportCsv';
import { baseUrl } from '@/utils/universal';

interface DataTableRowActionsProps<TData> {
    row: Row<TData>
  }
  
  export function DataTableRowActions<TData>({
    row,
  }: DataTableRowActionsProps<TData>) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const queryClient = useQueryClient()
    const feedback = row.original as Feedback
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
    const handleEdit = () => {
      // Redirect to the dedicated feedback edit page
      router.push(`/protected/feedback/${feedback.id}`)
    }

    const handlePreviewForm = () => {
      if (feedback.token) {
        const formUrl = `${baseUrl}/f/${feedback.id}?token=${feedback.token}`
        window.open(formUrl, '_blank')
      } else {
        toast.error("Form link not available for this feedback")
      }
    }
  
    // Delete feedback mutation
    const deleteFeedbackMutation = useMutation({
      mutationFn: async (feedbackId: string) => {
        return axios.delete(`/api/feedback/${feedbackId}`)
      },
      onSuccess: () => {
        toast.success("Feedback deleted successfully!")
        queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
        
        // Remove feedbackId from URL and refresh
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.delete('feedbackId');
        const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
        router.replace(newUrl);

        // Refresh the page to update the list
        router.refresh && router.refresh();
      },
      onError: (error: any) => {
        console.error("Delete feedback error:", error.response?.data)
        const errorMessage = error.response?.data?.error || "Failed to delete feedback"
        toast.error(errorMessage)
      },
    })
  
    const handleDelete = () => {
      setIsDeleteModalOpen(true)
    }
  
    const handleConfirmDelete = () => {
      deleteFeedbackMutation.mutate(feedback.id)
      setIsDeleteModalOpen(false)
    }
  
    // Duplicate feedback mutation
    const duplicateFeedbackMutation = useMutation({
      mutationFn: async (originalFeedback: Feedback) => {

                // Show loading toast with bubbles icon
      const loadingToastId = toast.loading(
        <div className="flex items-center gap-3">
          <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s]" />
          <span>Duplicating Feedback...</span>
        </div>,
        { duration: Infinity }
      );

        try {
          // Get the full feedback details
          const { data: fullFeedbackResponse } = await axios.get(`/api/feedback/${originalFeedback.id}`)
          const fullFeedback = fullFeedbackResponse.project
  
          // Prepare the duplicated feedback
          const isCompleted = fullFeedback.state === "completed"
          const isSent = fullFeedback.state === "sent"
          const hasRecipient = !!fullFeedback.recepientName && !!fullFeedback.recepientEmail
  
          // Generate a new token if duplicating a sent feedback with recipient info
          const newToken = (isSent && hasRecipient) ? (window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) : undefined
  
          const duplicatedFeedback = {
            name: getDuplicateName(fullFeedback.name),
            customerId: fullFeedback.customerId || null,
            dueDate: fullFeedback.dueDate || null,
            recepientName: fullFeedback.recepientName || null,
            recepientEmail: fullFeedback.recepientEmail || null,
            state: "draft", // Always duplicate as draft
            projectId: fullFeedback.projectId || null,
            templateId: fullFeedback.templateId || null,
            organizationName: fullFeedback.organizationName || null,
            organizationLogoUrl: fullFeedback.organizationLogoUrl || null,
            organizationEmail: fullFeedback.organizationEmail || null,
            questions: fullFeedback.questions,
            // Only include answers if not completed
            answers: isCompleted ? [] : fullFeedback.answers || [],
            token: newToken,
            action: "save_draft"
          }
  
          const result = await axios.post('/api/feedback/create', duplicatedFeedback)
          toast.dismiss(loadingToastId);
          return result
        } catch (error) {
              // Dismiss loading toast on error
         toast.dismiss(loadingToastId);
         throw error;
        }
      },
      onSuccess: () => {
        toast.success("Feedback duplicated successfully!")
        queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
        // Refresh the page to show the new feedback
        router.refresh && router.refresh(); // Next.js 13+ app router
        // If using older Next.js, use: router.replace(router.asPath)
      },
      onError: (error: any) => {
        console.error("Duplicate feedback error:", error.response?.data)
        const errorMessage = error.response?.data?.error || "Failed to duplicate feedback"
        toast.error(errorMessage)
      },
    })
  
    const handleDuplicate = () => {
      duplicateFeedbackMutation.mutate(feedback)
    }

    function getDuplicateName(originalName: string) {
      const copyPattern = /( \(Copy( Copy)*\))$/;
      if (copyPattern.test(originalName)) {
        // Already ends with (Copy) or (Copy Copy), add another Copy
        return originalName.replace(copyPattern, match => match.replace(')', ' Copy)'));
      }
      return `${originalName} (Copy)`;
    }
  
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuItem onClick={handleEdit}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePreviewForm}>
              Preview form
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDuplicate}
              disabled={duplicateFeedbackMutation.isPending}
            >
              {duplicateFeedbackMutation.isPending ? 'Duplicating...' : 'Duplicate Feedback'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const mappedFeedback = {
                  name: feedback.name ?? `Feedback ${feedback.id}`,
                  projectName: '', // You can enhance this if you have project name elsewhere
                  recepientName: feedback.recepientName ?? '',
                  recepientEmail: feedback.recepientEmail ?? '',
                  state: feedback.state ?? '',
                  created_at: feedback.created_at ?? '',
                  dueDate: feedback.dueDate ?? '',
                  filledOn: feedback.filledOn ?? '',
                  questions: feedback.questions ?? [],
                  answers: feedback.answers ?? [],
                };
                downloadFeedbackAsCSV(mappedFeedback, `feedback-${feedback.id}.csv`)
              }}
            >
              Download CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete} 
              className="text-red-600"
              disabled={deleteFeedbackMutation.isPending}
            >
              {deleteFeedbackMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  Delete
                  <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
  
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          itemName={feedback.name || "Untitled Feedback"}
          itemType="Feedback"
          isLoading={deleteFeedbackMutation.isPending}
        />
      </>
    )
  }

