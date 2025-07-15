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

import { Project } from "./columns"
import { MoreHorizontal, Copy, CheckCircle, Clock, Loader2 } from "lucide-react"
import ConfirmModal from "@/components/modal/confirm-modal"

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
  const project = row.original as Project
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleEdit = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("projectId", project.id)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return axios.delete(`/api/projects/${projectId}`)
    },
    onSuccess: () => {
      toast.success("Project deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      
      // Clear URL parameters to prevent opening edit sheet for deleted project
      const currentParams = new URLSearchParams(searchParams.toString())
      if (currentParams.has('projectId')) {
        currentParams.delete('projectId')
        const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname
        router.replace(newUrl)
      }
    },
    onError: (error: any) => {
      console.error("Delete project error:", error.response?.data)
      const errorMessage = error.response?.data?.error || "Failed to delete project"
      toast.error(errorMessage)
    },
  })

  const handleDelete = () => {
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    deleteProjectMutation.mutate(project.id)
    setIsDeleteModalOpen(false)
  }

  // Duplicate project mutation
  const duplicateProjectMutation = useMutation({
    mutationFn: async (originalProject: Project) => {
      // First, get the full project details
      const { data: fullProjectResponse } = await axios.get(`/api/projects/${originalProject.id}`)
      const fullProject = fullProjectResponse.project
      
      // Create a copy with modified name and reset certain fields
      const duplicatedProject = {
        // Basic project info
        name: `${fullProject.name} (Copy)`,
        description: fullProject.description || "",
        type: fullProject.type || "customer",
        customerId: fullProject.customerId || null,
        currency: fullProject.currency || "USD",
        currencyEnabled: fullProject.currencyEnabled || false,
        budget: fullProject.budget || 0,
        startDate: fullProject.startDate || null,
        endDate: fullProject.endDate || null,
        effectiveDate: fullProject.effectiveDate || null,
        notes: fullProject.notes || "",
        
        // Deliverables
        deliverablesEnabled: fullProject.deliverablesEnabled || false,
        deliverables: (fullProject.deliverables || []).map((d: any) => ({
          // DO NOT include id - let Supabase auto-generate it
          name: d.name || "",
          description: d.description || null,
          dueDate: d.dueDate || null,
          status: d.status || "pending",
          position: d.position || 1,
          isPublished: d.isPublished || false,
          // DO NOT include: id, projectId, createdBy, lastSaved
        })),
        
        // Payment structure
        paymentStructure: fullProject.paymentStructure || "noPayment",
        paymentMilestones: (fullProject.paymentMilestones || []).map((m: any) => ({
          // DO NOT include id - let Supabase auto-generate it
          name: m.name || null,
          description: m.description || null,
          amount: m.amount || null,
          percentage: m.percentage || null,
          dueDate: m.dueDate || null,
          status: m.status || null,
          type: m.type || "milestone",
          hasPaymentTerms: m.hasPaymentTerms || false,
          // DO NOT include: id, projectId, deliverableId, createdBy
        })),
        hasPaymentTerms: fullProject.hasPaymentTerms || false,
        
        // Service agreement
        hasServiceAgreement: fullProject.hasServiceAgreement || false,
        serviceAgreement: fullProject.serviceAgreement || "",
        agreementTemplate: fullProject.agreementTemplate || "standard",
        hasAgreedToTerms: false, // Reset for new project
        
        // Status and state - reset for new project
        isPublished: false,
        status: "pending",
        signedStatus: "not_signed",
        state: "draft",
        
        // Other fields
        documents: fullProject.documents || "",
        customFields: fullProject.customFields || { name: "", value: "" },
        emailToCustomer: false,
      }
      
      console.log("Sending duplicate project data:", duplicatedProject)
      return axios.post('/api/projects/create', duplicatedProject)
    },
    onSuccess: () => {
      toast.success("Project duplicated successfully!")
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (error: any) => {
      console.error("Duplicate project error:", error.response?.data)
      const errorMessage = error.response?.data?.error || "Failed to duplicate project"
      toast.error(errorMessage)
    },
  })

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ projectId, newStatus }: { projectId: string, newStatus: string }) => {
      // Get the current project first to ensure we have all required fields
      const { data: currentProjectResponse } = await axios.get(`/api/projects/${projectId}`)
      const currentProject = currentProjectResponse.project
      
      // Send a minimal update with only the status change
      const updateData = {
        id: projectId,
        status: newStatus,
        // Include required fields to pass validation
        name: currentProject.name,
        description: currentProject.description,
        type: currentProject.type,
        customerId: currentProject.customerId,
        currency: currentProject.currency || "USD",
        currencyEnabled: currentProject.currencyEnabled || false,
        budget: currentProject.budget || 0,
        deliverablesEnabled: currentProject.deliverablesEnabled || false,
        deliverables: currentProject.deliverables || [],
        paymentStructure: currentProject.paymentStructure || "noPayment",
        paymentMilestones: currentProject.paymentMilestones || [],
        hasPaymentTerms: currentProject.hasPaymentTerms || false,
        hasServiceAgreement: currentProject.hasServiceAgreement || false,
        serviceAgreement: currentProject.serviceAgreement || "",
        agreementTemplate: currentProject.agreementTemplate || "standard",
        hasAgreedToTerms: currentProject.hasAgreedToTerms || false,
        isPublished: currentProject.isPublished || false,
        signedStatus: currentProject.signedStatus || "not_signed",
        state: currentProject.state || "draft",
        documents: currentProject.documents || "",
        customFields: currentProject.customFields || { name: "", value: "" },
        emailToCustomer: false,
      }
      
      return axios.put(`/api/projects/${projectId}`, updateData)
    },
    onSuccess: (_, variables) => {
      const statusText = variables.newStatus === 'completed' ? 'completed' : 'in progress'
      toast.success(`Project marked as ${statusText}!`)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (error: any) => {
      console.error("Status update error:", error.response?.data)
      const errorMessage = error.response?.data?.error || "Failed to update project status"
      toast.error(errorMessage)
    },
  })

  const handleDuplicate = () => {
    duplicateProjectMutation.mutate(project)
  }

  const handleStatusToggle = () => {
    setIsUpdating(true)
    const newStatus = project.status === 'completed' ? 'pending' : 'completed'
    updateStatusMutation.mutate(
      { projectId: project.id, newStatus },
      {
        onSettled: () => setIsUpdating(false)
      }
    )
  }

  const getStatusToggleText = () => {
    if (project.status === 'completed') {
      return 'Mark as In Progress'
    }
    return 'Mark as Completed'
  }

  const getStatusToggleIcon = () => {
    if (isUpdating) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    if (project.status === 'completed') {
      return <Clock className="h-4 w-4" />
    }
    return <CheckCircle className="h-4 w-4" />
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
          <DropdownMenuItem 
            onClick={handleDuplicate}
            disabled={duplicateProjectMutation.isPending}
          >
            <Copy className="h-4 w-4 mr-2" />
            {duplicateProjectMutation.isPending ? 'Duplicating...' : 'Duplicate Project'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleStatusToggle}
            disabled={updateStatusMutation.isPending}
          >
            {getStatusToggleIcon()}
            <span className="ml-2">{getStatusToggleText()}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDelete} 
            className="text-red-600"
            disabled={deleteProjectMutation.isPending}
          >
            {deleteProjectMutation.isPending ? (
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
        itemName={project.name || "Untitled Project"}
        itemType="Project"
        isLoading={deleteProjectMutation.isPending}
      />
    </>
  )
}
