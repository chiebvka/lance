"use client"

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import CommandFilter from '../filtering/command-filter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, StickyNote, Search, Command, Settings, ScanSearch } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useTrialCountdown } from '@/hooks/use-trial-countdown'
import { useNotifications } from '@/hooks/use-notifications'

type Props = {}

export default function SpotlightCommand({}: Props) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const trialStatus = useTrialCountdown();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    // Add keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format notification time
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Get notification type badge color
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'trial_reminder': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'success': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getBadgeContent = () => {
    if (trialStatus.isLoading) {
      return "Loading...";
    }
    
    return trialStatus.displayText || "Unknown status";
  };

  const getBadgeVariant = () => {
    if (trialStatus.isExpired) {
      return "destructive";
    }
    if (trialStatus.subscriptionStatus === 'active') {
      return "default";
    }
    return "outline";
  };

  return (
    <>
      <div className={cn("flex items-center gap-3")}>
        {/* Trial Status Badge */}
        <Badge 
          variant={getBadgeVariant()} 
          className={cn(
            "bg-background/95 backdrop-blur-sm",
            trialStatus.isExpired && "bg-destructive/10 text-destructive border-destructive",
            trialStatus.subscriptionStatus === 'active' && "bg-green-50 text-green-700 border-green-200"
          )}
        >
          {getBadgeContent()}
        </Badge>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative backdrop-blur-sm">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-red-500">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b flex items-center justify-between">
              <h4 className="font-medium">Notifications</h4>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-6"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </Button>
                )}
                <Link href="/protected/settings/notifications">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className="flex flex-col items-start p-3 space-y-1 cursor-pointer"
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={cn(
                        "text-sm",
                        !notification.isRead ? "font-medium" : "font-normal"
                      )}>
                        {notification.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground line-clamp-2 w-full">
                        {notification.message}
                      </p>
                    )}
                    <div className="flex items-center justify-between w-full">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs",
                          getNotificationTypeColor(notification.type),
                          "text-white"
                        )}
                      >
                        {notification.type.replace('_', ' ')}
                      </Badge>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-sm text-muted-foreground">
                  <Link href="/protected/notifications" className="w-full">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notes/Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background/95 backdrop-blur-sm">
              <StickyNote className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <Link href="/protected">
              <DropdownMenuItem className="flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                Changelog
              </DropdownMenuItem>
            </Link>
            <Link href="/protected">
              <DropdownMenuItem className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                Help
              </DropdownMenuItem>
            </Link>
            <Link href="/protected">
              <DropdownMenuItem className="flex items-center gap-2">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                Upcoming
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Command - Made to look like an actual search input */}
        <div 
          className="relative min-w-[200px] cursor-pointer"
          onClick={() => setIsCommandOpen(true)}
        >
          <div className="flex items-center w-full h-9 px-3 py-2 border border-input bg-background/95 backdrop-blur-sm rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent/50 transition-colors">
            <ScanSearch className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground flex-1">Search...</span>
            <Badge variant="outline" className="ml-2 font-mono text-xs">
              ⌘K
            </Badge>
          </div>
        </div>
      </div>

      <CommandFilter 
        placeholder="Search projects, customers, invoices..."
        isOpen={isCommandOpen}
        onOpenChange={setIsCommandOpen}
      />
    </>
  )
}