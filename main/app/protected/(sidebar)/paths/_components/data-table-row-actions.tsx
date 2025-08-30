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

import { MoreHorizontal, Loader2, Edit, Copy, ExternalLink, Trash, Bubbles } from "lucide-react"
import ConfirmModal from "@/components/modal/confirm-modal"
import { Path } from "@/hooks/paths/use-paths"


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

  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const path = row.original as Path

  const handleEdit = () => {
    router.push(`/protected/paths/${path.id}`)
  }

  // Delete path mutation
  const deletePathMutation = useMutation({
    mutationFn: async (pathId: string) => {
      return axios.delete(`/api/paths/${pathId}`);
    },
    onSuccess: () => {
      toast.success("Path deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['paths'] });
    },
    onError: (error: any) => {
      console.error("Delete path error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to delete path";
      toast.error(errorMessage);
    },
  })

  const handleDelete = () => {
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (path.id) {
      deletePathMutation.mutate(path.id)
    }
    setIsDeleteModalOpen(false)
  }

  // Duplicate path mutation
  const duplicatePathMutation = useMutation({
    mutationFn: async (pathData: any) => {
      // Show loading toast with bubbles icon
      const loadingToastId = toast.loading(
        <div className="flex items-center gap-3">
          <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s]" />
          <span>Duplicating Path...</span>
        </div>,
        { duration: Infinity }
      );

      try {
        const { data } = await axios.post('/api/paths/create', {
          ...pathData,
          name: `${pathData.name} (Copy)`,
        })
        toast.dismiss(loadingToastId);
        return data
        
      } catch (error) {
        toast.dismiss(loadingToastId);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Path duplicated successfully!");
      queryClient.invalidateQueries({ queryKey: ['paths'] });
    },
    onError: (error: any) => {
      console.error("Duplicate path error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to duplicate path";
      toast.error(errorMessage);
    },
  })

  const handleDuplicate = () => {
    if (path) {
      duplicatePathMutation.mutate({
        name: path.name,
        description: path.description,
        content: path.content,
        private: path.private,
      })
    }
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
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDuplicate}
            disabled={duplicatePathMutation.isPending}
          >
            <Copy className="h-4 w-4 mr-2" />
            {duplicatePathMutation.isPending ? 'Duplicating...' : 'Duplicate Path'}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDelete} 
            className="text-red-600"
            disabled={deletePathMutation.isPending}
          >
            {deletePathMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash className="h-4 w-4 mr-2" />
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
        itemName={path.name || "Untitled Path"}
        itemType="Path"
        isLoading={deletePathMutation.isPending}
      />
    </>
  )
}