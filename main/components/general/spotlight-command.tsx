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

type Props = {}

export default function SpotlightCommand({}: Props) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Set formatted date
    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).replace(/\s/g, '').toLowerCase();
    setCurrentDate(formatted);

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

  const notificationItems = [
    {
      title: "Revenue vs $241 last period",
      time: "2h ago",
      type: "metric"
    },
    {
      title: "New project milestone completed",
      time: "4h ago", 
      type: "achievement"
    },
    {
      title: "Client feedback received",
      time: "1d ago",
      type: "feedback"
    },
    {
      title: "Invoice payment overdue",
      time: "2d ago",
      type: "warning"
    }
  ];

  return (
    <>
      <div className={cn("flex items-center gap-3")}>
        {/* Free Trial Badge */}
        <Badge variant="outline" className="bg-background/95 backdrop-blur-sm">
          Free Trial · {currentDate}
        </Badge>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative backdrop-blur-sm">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b flex items-center justify-between">
              <h4 className="font-medium">Notifications</h4>
              <Link href="/protected/settings/notifications">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notificationItems.map((item, index) => (
                <DropdownMenuItem key={index} className="flex flex-col items-start p-3 space-y-1">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                  <div className="w-full">
                    <Badge variant="secondary" className="text-xs">
                      {item.type}
                    </Badge>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-sm text-muted-foreground">
              View all notifications
            </DropdownMenuItem>
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