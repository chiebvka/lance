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
import { Path as PathType } from '@/hooks/paths/use-paths';
import { useCustomers, type Customer } from '@/hooks/customers/use-customers';
import { useUpdatePath, useDeletePath } from '@/hooks/paths/use-paths';
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
  } from "@/components/ui/command"
import { cn } from '@/lib/utils';

type Props = {
    path: PathType
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

export default function PathDetailsSheet({path}: Props) {

    const router = useRouter();
    const queryClient = useQueryClient();

    // Hooks for data and mutations
    const { data: customers = [] } = useCustomers();
    const updatePathMutation = useUpdatePath();
    const deletePathMutation = useDeletePath();

    // State for UI interactions
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAssignCustomerId, setSelectedAssignCustomerId] = useState<string | null>(null);

    const [isActionLoading, setIsActionLoading] = useState(false);
    const [currentAction, setCurrentAction] = useState<string>('');
      
      
  // Safety check for undefined wall
  if (!path) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground">
          Path data not available
        </div>
      </div>
    );
  }
  
  const recipient = path.recepientEmail || 'N/A'
  const created = path.created_at ? format(new Date(path.created_at), 'd MMMM yyyy') : 'N/A'
  const updated = path.updatedAt ? format(new Date(path.updatedAt), 'd MMMM yyyy') : 'N/A'
  const state = (path.state || 'draft').toLowerCase();

    // Generate wall link based on state and token
    const pathLink = path.token 
    ? `${baseUrl}/pa/${path.id}?token=${path.token}` 
    : `${baseUrl}/pa/${path.id}`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard!");
      };

  // State management functions
  const handleDeletePath = async () => {
    try {
      await deletePathMutation.mutateAsync(path.id);
      toast.success("Path deleted successfully!");
      setIsDeleteModalOpen(false);
      // Close the sheet by navigating back
      router.refresh();
    } catch (error) {
      console.error("Delete path error:", error);
      toast.error("Failed to delete path");
      // Don't close the modal on error, let user try again
    }
  };

  const handleUnassign = async ({ makePublic = false, unpublish = false }: { makePublic?: boolean; unpublish?: boolean }) => {

    setIsActionLoading(true);
    setCurrentAction(unpublish ? 'Unpublishing and unassigning...' : makePublic ? 'Unassigning and making public...' : 'Unassigning...');

    try {
      const updateData: any = {
        action: unpublish ? "unpublish" : "save_draft",
        name: path.name || "",
        description: path.description,
        content: path.content,
        protect: !makePublic && !unpublish,
        customerId: null,
        recipientEmail: null,
        recepientName: null,
      };

      await updatePathMutation.mutateAsync({
        pathId: path.id,
        pathData: updateData
      });

      toast.success("Path unassigned successfully!");
    } catch (error) {
      console.error('Error unassigning path:', error);
      toast.error("Failed to unassign path");
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
        name: path.name || "",
        description: path.description,
        content: path.content,
        protect: isPrivate,
        customerId: customerId || null,
        recipientEmail: customerId ? undefined : path.recepientEmail,
        recepientName: customerId ? undefined : path.recepientName,
      };

      await updatePathMutation.mutateAsync({
        pathId: path.id,
        pathData: updateData
      });

      if (emailToCustomer && customerId) {
        toast.success("Path published and email sent!");
      } else {
        toast.success("Path published successfully!");
      }
    } catch (error) {
      console.error('Error publishing path:', error);
      toast.error("Failed to publish path");
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
        name: path.name || "",
        description: path.description,
        content: path.content,
        protect: false,
        customerId: null,
        recipientEmail: null,
        recepientName: null,
      };

      await updatePathMutation.mutateAsync({
        pathId: path.id,
        pathData: updateData
      });

      toast.success("Path unpublished successfully!");
    } catch (error) {
      console.error('Error unpublishing path:', error);
      toast.error("Failed to unpublish path");
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
        name: path.name || "",
        description: path.description,
        content: path.content,
        protect: newPrivacy,
      };

      if (!newPrivacy) {
        updateData.customerId = null;
        updateData.recipientEmail = null;
        updateData.recepientName = null;
      }

      await updatePathMutation.mutateAsync({
        pathId: path.id,
        pathData: updateData
      });

      toast.success(`Path made ${newPrivacy ? 'private' : 'public'} successfully!`);
    } catch (error) {
      console.error('Error toggling path privacy:', error);
      toast.error("Failed to toggle path privacy");
    }   finally {
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
        action: emailToCustomer ? "send_path" : "save_draft",
        name: path.name || "",
        description: path.description,
        content: path.content,
        protect: true,
        customerId: customerId,
        recipientEmail: selectedCustomer.email,
        recepientName: selectedCustomer.name,
      };

      await updatePathMutation.mutateAsync({
        pathId: path.id,
        pathData: updateData
      });

      toast.success(emailToCustomer ? "Path assigned and email sent!" : "Path assigned to customer successfully!");
    } catch (error) {
      console.error('Error assigning path to customer:', error);
      toast.error(emailToCustomer ? "Failed to assign and email customer" : "Failed to assign path to customer");
    } finally {
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

  const availableActions = getAvailableActions(state, path.private || false);
  const isAssigned = path.customerId || path.recepientEmail;

  return (
    <div className="p-4">
    <div className="flex items-center justify-between gap-2 pt-2">
      <span className='flex items-center gap-2'>
        <span className="text-sm text-muted-foreground">State</span>
        <Badge className={getStatusColor(state)}>{state.charAt(0).toUpperCase() + state.slice(1)}</Badge>
      </span>
      <div className='flex items-center gap-2'>
        <span className="text-sm text-muted-foreground">Path-{path.id.slice(0, 4)}</span>
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


            {/* Publish options for draft paths */}
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
            
            {/* Unpublish for published paths */}
            {availableActions.includes('unpublish') && (
              <DropdownMenuItem onClick={handleUnpublish} disabled={isActionLoading}>
                <EyeOff className="w-4 h-4 mr-2" />
                Unpublish
              </DropdownMenuItem>
            )}
            
            {/* Privacy toggle for published paths */}
            {availableActions.includes('toggle_privacy') && (
              <DropdownMenuItem onClick={() => handleTogglePrivacy(!path.private)} disabled={isActionLoading}>
                {path.private ? (
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
                                    (selectedAssignCustomerId ?? path.customerId) === customer.id ? "opacity-100" : "opacity-0"
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
                            {path.customerId ? 'Update only' : 'Assign only'}
                      </Button>
                      <Button
                          variant="outline"
                          className="flex-1"
                          disabled={!selectedAssignCustomerId || isActionLoading}
                          onClick={() => selectedAssignCustomerId && handleAssignToCustomer(selectedAssignCustomerId, true)}
                      >
                          {path.customerId ? 'Update & Email' : 'Assign & Email'}
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
                                      (selectedAssignCustomerId ?? path.customerId) === customer.id ? "opacity-100" : "opacity-0"
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
                            {path.customerId ? 'Update only' : 'Assign only'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={!selectedAssignCustomerId || isActionLoading}
                      onClick={() => selectedAssignCustomerId && handleAssignToCustomer(selectedAssignCustomerId, true)}
                    >
                        {path.customerId ? 'Update & Email' : 'Assign & Email'}
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
                    disabled={isActionLoading || deletePathMutation.isPending}
                  >
                    {deletePathMutation.isPending ? (
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
          <span className="text-sm">{path.name || 'Untitled'}</span>
        </div>

        {path.recepientEmail && (
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
          <span className="text-sm">{path.private ? 'Private' : 'Public'}</span>
        </div>
      </div>

      <Separator />

      {/* Wall Link - Always show regardless of state */}
      <div className="space-y-2">
        <h3 className="font-semibold text-base">Path Link</h3>
        <div className="flex items-center gap-2 p-3 border">
          <Input
            type="text"
            value={pathLink}
            readOnly
            className="flex-1 bg-transparent text-sm border-none outline-none"
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 border-r-2 rounded-none"
            onClick={() => copyToClipboard(pathLink)}
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => window.open(pathLink, "_blank")}
            title="Open path"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button 
          className="w-full h-11 text-base"
          onClick={() => router.push(`/protected/paths/${path.id}`)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Path
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-10 bg-transparent"
            disabled={!pathLink}
            onClick={() => pathLink && window.open(pathLink, "_blank")}
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
      onClose={() => !deletePathMutation.isPending && setIsDeleteModalOpen(false)}
      onConfirm={handleDeletePath}
      title="Delete Path"
      itemName={path.name || path.id.slice(0, 8)}
      itemType="path"
      description="This action cannot be undone."
      isLoading={deletePathMutation.isPending}
    />
  </div>
  )
}