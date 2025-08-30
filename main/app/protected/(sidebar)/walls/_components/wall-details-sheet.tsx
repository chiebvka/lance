"use client"

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Copy, Edit, ExternalLink, FileText, Mail, MessageSquareShare, User, Grip, Trash2, UserPlus, X, Check, Ban, Globe, Lock, Eye, EyeOff, Loader2, Bubbles } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { baseUrl } from '@/utils/universal';
import { Wall as WallType } from '@/hooks/walls/use-walls';
import { useCustomers, type Customer } from '@/hooks/customers/use-customers';
import { useUpdateWall, useDeleteWall } from '@/hooks/walls/use-walls';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import ConfirmModal from '@/components/modal/confirm-modal';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from '@/lib/utils';

type Props = {
    wall: WallType
}

const getStatusColor = (state: string) => {
  switch (state.toLowerCase()) {
    case "draft":
      return "bg-blue-100 text-blue-800";
    case "published":
      return "bg-green-100 text-green-800";
    case "sent":
      return "bg-yellow-100 text-yellow-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function WallDetailsSheet({ wall  }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Hooks for data and mutations
  const { data: customers = [] } = useCustomers();
  const updateWallMutation = useUpdateWall();
  const deleteWallMutation = useDeleteWall();

  // State for UI interactions
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssignCustomerId, setSelectedAssignCustomerId] = useState<string | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  
  
  // Safety check for undefined wall
  if (!wall) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground">
          Wall data not available
        </div>
      </div>
    );
  }
  
  const recipient = wall.recepientEmail || 'N/A'
  const created = wall.created_at ? format(new Date(wall.created_at), 'd MMMM yyyy') : 'N/A'
  const updated = wall.updatedAt ? format(new Date(wall.updatedAt), 'd MMMM yyyy') : 'N/A'
  const state = (wall.state || 'draft').toLowerCase();
  
  // Generate wall link based on state and token
  const wallLink = wall.token 
    ? `${baseUrl}/w/${wall.id}?token=${wall.token}` 
    : wall.slug 
    ? `${baseUrl}/w/${wall.slug}` 
    : `${baseUrl}/w/${wall.id}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard!");
  };

  // State management functions
  const handleDeleteWall = async () => {
    try {
      await deleteWallMutation.mutateAsync(wall.id);
      toast.success("Wall deleted successfully!");
      setIsDeleteModalOpen(false);
      // Close the sheet by navigating back
      router.refresh();
    } catch (error) {
      console.error("Delete wall error:", error);
      toast.error("Failed to delete wall");
      // Don't close the modal on error, let user try again
    }
  };

  const handleUnassign = async ({ makePublic = false, unpublish = false }: { makePublic?: boolean; unpublish?: boolean }) => {
    setIsActionLoading(true);
    setCurrentAction(unpublish ? 'Unpublishing and unassigning...' : makePublic ? 'Unassigning and making public...' : 'Unassigning...');
    try {
      const updateData: any = {
        action: unpublish ? "unpublish" : "save_draft",
        name: wall.name || "",
        description: wall.description,
        notes: wall.notes,
        content: wall.content,
        protect: !makePublic && !unpublish,
        customerId: null,
        recipientEmail: null,
        recepientName: null,
      };

      await updateWallMutation.mutateAsync({
        wallId: wall.id,
        wallData: updateData
      });

      toast.success("Wall unassigned successfully!");
    } catch (error) {
      console.error('Error unassigning wall:', error);
      toast.error("Failed to unassign wall");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handlePublish = async (isPrivate: boolean, customerId?: string | null, emailToCustomer: boolean = false) => {
    setIsActionLoading(true);
    setCurrentAction(emailToCustomer ? 'Publishing and emailing...' : 'Publishing...');
    try {
      const updateData: any = {
        action: "publish",
        name: wall.name || "",
        description: wall.description,
        notes: wall.notes,
        content: wall.content,
        protect: isPrivate,
        customerId: customerId || null,
        recipientEmail: customerId ? undefined : wall.recepientEmail,
        recepientName: customerId ? undefined : wall.recepientName,
      };

      await updateWallMutation.mutateAsync({
        wallId: wall.id,
        wallData: updateData
      });

      if (emailToCustomer && customerId) {
        toast.success("Wall published and email sent!");
      } else {
        toast.success("Wall published successfully!");
      }
    } catch (error) {
      console.error('Error publishing wall:', error);
      toast.error("Failed to publish wall");
    }  finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleUnpublish = async () => {
    setIsActionLoading(true);
    setCurrentAction('Unpublishing...');
    try {
      const updateData: any = {
        action: "unpublish",
        name: wall.name || "",
        description: wall.description,
        notes: wall.notes,
        content: wall.content,
        protect: false,
      };

      await updateWallMutation.mutateAsync({
        wallId: wall.id,
        wallData: updateData
      });

      toast.success("Wall unpublished successfully!");
    } catch (error) {
      console.error('Error unpublishing wall:', error);
      toast.error("Failed to unpublish wall");
    }  finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleTogglePrivacy = async (newPrivacy: boolean) => {
    setIsActionLoading(true);
    setCurrentAction(`Making ${newPrivacy ? 'private' : 'public'}...`);
    try {
      const updateData: any = {
        action: "save_draft",
        name: wall.name || "",
        description: wall.description,
        notes: wall.notes,
        content: wall.content,
        protect: newPrivacy,
      };

      if (!newPrivacy) {
        updateData.customerId = null;
        updateData.recipientEmail = null;
        updateData.recepientName = null;
      }

      await updateWallMutation.mutateAsync({
        wallId: wall.id,
        wallData: updateData
      });

      toast.success(`Wall made ${newPrivacy ? 'private' : 'public'} successfully!`);
    } catch (error) {
      console.error('Error toggling wall privacy:', error);
      toast.error("Failed to toggle wall privacy");
    } finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  const handleAssignToCustomer = async (customerId: string, emailToCustomer: boolean) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (!selectedCustomer) {
      toast.error("Selected customer not found");
      return;
    }


    setIsActionLoading(true);
    setCurrentAction(emailToCustomer ? 'Assigning and emailing...' : 'Assigning...');
    try {
      const updateData: any = {
        action: emailToCustomer ? "send_wall" : "save_draft",
        name: wall.name || "",
        description: wall.description,
        notes: wall.notes,
        content: wall.content,
        protect: true,
        customerId: customerId,
        recipientEmail: selectedCustomer.email,
        recepientName: selectedCustomer.name,
      };

      await updateWallMutation.mutateAsync({
        wallId: wall.id,
        wallData: updateData
      });

      toast.success(emailToCustomer ? "Wall assigned and email sent!" : "Wall assigned to customer successfully!");
    } catch (error) {
      console.error('Error assigning wall to customer:', error);
      toast.error(emailToCustomer ? "Failed to assign and email customer" : "Failed to assign wall to customer");
    }  finally {
      setIsActionLoading(false);
      setCurrentAction('');
    }
  };

  // Helper function to get available actions based on state and privacy
  const getAvailableActions = (state: string, isPrivate: boolean) => {
    const actions = [];
    
    if (state === 'draft') {
      actions.push('publish_public', 'publish_private', 'delete');
    } else if (state === 'published') {
      actions.push('unpublish', 'toggle_privacy', 'delete');
    }
    
    return actions;
  };

  const availableActions = getAvailableActions(state, wall.private || false);
  const isAssigned = wall.customerId || wall.recepientEmail;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 pt-2">
        <span className='flex items-center gap-2'>
          <span className="text-sm text-muted-foreground">State</span>
          <Badge className={getStatusColor(state)}>{state.charAt(0).toUpperCase() + state.slice(1)}</Badge>
        </span>
        <div className='flex items-center gap-2'>
          <span className="text-sm text-muted-foreground">Wall-{wall.id.slice(0, 4)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border rounded-none">
                {isActionLoading ? (
                  <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s]" />
                ) : (
                  <Grip size={12} />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
            {/* Show loading state at the top when any action is loading */}
              {isActionLoading && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground border-b">
                  {currentAction}
                </div>
              )}
              {/* Publish options for draft walls */}
              {availableActions.includes('publish_public') && (
                <DropdownMenuItem onClick={() => handlePublish(false)} disabled={isActionLoading}>
                  <Globe className="w-4 h-4 mr-2" />
                  Publish as Public
                </DropdownMenuItem>
              )}
              
              {availableActions.includes('publish_private') && (
                <DropdownMenuItem onClick={() => handlePublish(true)} disabled={isActionLoading}>
                  <Lock className="w-4 h-4 mr-2" />
                  Publish as Private
                </DropdownMenuItem>
              )}
              
              {/* Unpublish for published walls */}
              {availableActions.includes('unpublish') && (
                <DropdownMenuItem onClick={handleUnpublish} disabled={isActionLoading}>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Unpublish
                </DropdownMenuItem>
              )}
              
              
              {/* Privacy toggle for published walls */}
              {availableActions.includes('toggle_privacy') && (
                <DropdownMenuItem onClick={() => handleTogglePrivacy(!wall.private)} disabled={isActionLoading}>
                  {wall.private ? (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Make Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Make Private
                    </>
                  )}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {isAssigned ? (
                <>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger disabled={isActionLoading}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Update assigned customer
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-72 p-0">
                    <Command>
                        <CommandInput placeholder="Search customers..." autoFocus disabled={isActionLoading} />
                        <CommandList>
                          <CommandEmpty>No customers found.</CommandEmpty>
                          <CommandGroup>
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.name}
                                onSelect={() => {
                                  setSelectedAssignCustomerId(customer.id)
                                }}
                                disabled={isActionLoading}
                              >
                                       <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    (selectedAssignCustomerId ?? wall.customerId) === customer.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {customer.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      <div className="p-2 pt-1 flex gap-2 border-t">
                      <Button
                          className="flex-1"
                          disabled={!selectedAssignCustomerId || isActionLoading}
                          onClick={() => selectedAssignCustomerId && handleAssignToCustomer(selectedAssignCustomerId, false)}
                        >
                          {wall.customerId ? 'Update only' : 'Assign only'}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          disabled={!selectedAssignCustomerId || isActionLoading}
                          onClick={() => selectedAssignCustomerId && handleAssignToCustomer(selectedAssignCustomerId, true)}
                        >
                          {wall.customerId ? 'Update & Email' : 'Assign & Email'}
                        </Button>
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger disabled={isActionLoading}>
                          <X className="w-4 h-4 mr-2" />
                          Unassign Customer
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleUnassign({})} disabled={isActionLoading}>
                            Unassign (keep private)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUnassign({ makePublic: true })} disabled={isActionLoading}>
                            Unassign & Make Public
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUnassign({ unpublish: true })} disabled={isActionLoading}>
                            Unassign & Unpublish
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </>
              ) : (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isActionLoading}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign to customer
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-72 p-0">
                  <Command>
                      <CommandInput placeholder="Search customers..." autoFocus disabled={isActionLoading} />
                      <CommandList>
                        <CommandEmpty>No customers found.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              onSelect={() => {
                                setSelectedAssignCustomerId(customer.id)
                              }}
                              disabled={isActionLoading}
                            >
                                          <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  (selectedAssignCustomerId ?? wall.customerId) === customer.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {customer.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    <div className="p-2 pt-1 flex gap-2 border-t">
                    <Button
                        className="flex-1"
                        disabled={!selectedAssignCustomerId || isActionLoading}
                        onClick={() => selectedAssignCustomerId && handleAssignToCustomer(selectedAssignCustomerId, false)}
                      >
                        {wall.customerId ? 'Update only' : 'Assign only'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        disabled={!selectedAssignCustomerId || isActionLoading}
                        onClick={() => selectedAssignCustomerId && handleAssignToCustomer(selectedAssignCustomerId, true)}
                      >
                        {wall.customerId ? 'Update & Email' : 'Assign & Email'}
                      </Button>
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              
              {/* Delete with separator */}
              {availableActions.includes('delete') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="text-red-600"
                    disabled={isActionLoading || deleteWallMutation.isPending}
                  >
                    {deleteWallMutation.isPending ? (
                      <Bubbles className="w-4 h-4 mr-2 animate-spin [animation-duration:0.5s]" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator />

      <div className="space-y-6 pt-6">
        {/* Key Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Name</span>
            </div>
            <span className="text-sm">{wall.name || 'Untitled'}</span>
          </div>

          {wall.recepientEmail && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recipient</span>
              </div>
              <span className="text-sm">{recipient}</span>
            </div>
          )}
          
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
              <span className="text-sm font-medium">Updated</span>
            </div>
            <span className="text-sm">{updated}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Privacy</span>
            </div>
            <span className="text-sm">{wall.private ? 'Private' : 'Public'}</span>
          </div>
        </div>

        <Separator />

        {/* Wall Link - Always show regardless of state */}
        <div className="space-y-2">
          <h3 className="font-semibold text-base">Wall Link</h3>
          <div className="flex items-center gap-2 p-3 border">
            <Input
              type="text"
              value={wallLink}
              readOnly
              className="flex-1 bg-transparent text-sm border-none outline-none"
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 border-r-2 rounded-none"
              onClick={() => copyToClipboard(wallLink)}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => window.open(wallLink, "_blank")}
              title="Open wall"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            className="w-full h-11 text-base"
            onClick={() => router.push(`/protected/walls/${wall.id}`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Wall
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-10 bg-transparent"
              disabled={!wallLink}
              onClick={() => wallLink && window.open(wallLink, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              className="h-10 bg-transparent"
              onClick={() => {
                // Add share functionality here
                toast.success("Share functionality coming soon!");
              }}
            >
              <MessageSquareShare className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => !deleteWallMutation.isPending && setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteWall}
        title="Delete Wall"
        itemName={wall.name || wall.id.slice(0, 8)}
        itemType="wall"
        description="This action cannot be undone."
        isLoading={deleteWallMutation.isPending}
      />
    </div>
  )
}