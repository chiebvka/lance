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
import { Wall as WallType } from '@/hooks/walls/use-walls';

type Props = {
    wall: WallType
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
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

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 pt-2">
        <span className='flex items-center gap-2'>
          <span className="text-sm text-muted-foreground">State</span>
          <Badge className={getStatusColor(state)}>{state.charAt(0).toUpperCase() + state.slice(1)}</Badge>
        </span>
        <span className='flex items-center gap-2'>
          <span className="text-sm text-muted-foreground">Wall-{wall.id.slice(0, 4)}</span>
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
    </div>
  )
}