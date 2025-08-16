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

import { MoreHorizontal, Loader2, Edit, Copy, ExternalLink, Trash } from "lucide-react"
import ConfirmModal from "@/components/modal/confirm-modal"
import { Wall } from "@/hooks/walls/use-walls"

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

  const wall = row.original as Wall

  const handleEdit = () => {
    router.push(`/protected/walls/${wall.id}`)
  }

  // Delete wall mutation
  const deleteWallMutation = useMutation({
    mutationFn: async (wallId: string) => {
      return axios.delete(`/api/walls/${wallId}`);
    },
    onSuccess: () => {
      toast.success("Wall deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['walls'] });
    },
    onError: (error: any) => {
      console.error("Delete wall error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to delete wall";
      toast.error(errorMessage);
    },
  })

  const handleDelete = () => {
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (wall.id) {
      deleteWallMutation.mutate(wall.id)
    }
    setIsDeleteModalOpen(false)
  }

  // Duplicate wall mutation
  const duplicateWallMutation = useMutation({
    mutationFn: async (wallData: any) => {
      const { data } = await axios.post('/api/walls/create', {
        ...wallData,
        name: `${wallData.name} (Copy)`,
      })
      return data
    },
    onSuccess: () => {
      toast.success("Wall duplicated successfully!");
      queryClient.invalidateQueries({ queryKey: ['walls'] });
    },
    onError: (error: any) => {
      console.error("Duplicate wall error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to duplicate wall";
      toast.error(errorMessage);
    },
  })

  const handleDuplicate = () => {
    if (wall) {
      duplicateWallMutation.mutate({
        name: wall.name,
        description: wall.description,
        content: wall.content,
        notes: wall.notes,
        private: wall.private,
      })
    }
  }

  const handlePreview = () => {
    if (wall.slug) {
      window.open(`/w/${wall.slug}`, '_blank')
    } else {
      toast.error("Wall must be published to preview")
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
          <DropdownMenuItem onClick={handlePreview}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview Wall
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDuplicate}
            disabled={duplicateWallMutation.isPending}
          >
            <Copy className="h-4 w-4 mr-2" />
            {duplicateWallMutation.isPending ? 'Duplicating...' : 'Duplicate Wall'}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDelete} 
            className="text-red-600"
            disabled={deleteWallMutation.isPending}
          >
            {deleteWallMutation.isPending ? (
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
        itemName={wall.name || "Untitled Wall"}
        itemType="Wall"
        isLoading={deleteWallMutation.isPending}
      />
    </>
  )
}