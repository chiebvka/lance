"use client"

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Copy, Edit, ExternalLink, FileText, Mail, MessageSquareShare, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { baseUrl } from '@/utils/universal';
import { Path as PathType } from '@/hooks/paths/use-paths';

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

  return (
    <div className="p-4">
    <div className="flex items-center justify-between gap-2 pt-2">
      <span className='flex items-center gap-2'>
        <span className="text-sm text-muted-foreground">State</span>
        <Badge className={getStatusColor(state)}>{state.charAt(0).toUpperCase() + state.slice(1)}</Badge>
      </span>
      <span className='flex items-center gap-2'>
        <span className="text-sm text-muted-foreground">Path-{path.id.slice(0, 4)}</span>
      </span>
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
        <h3 className="font-semibold text-base">Wall Link</h3>
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
          onClick={() => router.push(`/protected/walls/${path.id}`)}
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
  </div>
  )
}