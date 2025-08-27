"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  Cog,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"
import { signOutAction } from "@/app/actions"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"

export function NavUser({
  user,
  organization,
  showDropdown = true,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  organization?: {
    name?: string | null
    email?: string | null
    logoUrl?: string | null
  }
  showDropdown?: boolean
}) {
  const { isMobile } = useSidebar()

  const displayEmail = organization?.email || user.email
  const displayName = organization?.name || user.name
  const avatarSrc = organization?.logoUrl || undefined

  // If showDropdown is false, render a simple display without dropdown functionality
  if (!showDropdown) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="cursor-default"
            // disabled
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarSrc} alt={displayName} />
              <AvatarFallback className="">{displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{displayName}</span>
              {/* <span className="truncate text-xs">{displayEmail}</span> */}
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Original dropdown functionality
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback className="">{displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 "
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 ">
                  <AvatarImage src={avatarSrc} alt={displayName} />
                  <AvatarFallback className="">{displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div> 
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <Link href="/protected/reset">
                    <DropdownMenuItem className="flex items-center cursor-pointer space-x-4">
                        <Cog className="mr-2 size-4" />
                        Reset Password
                    </DropdownMenuItem>
                </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator  className="mr-2 size-4" />
            <form action={signOutAction}>
              <DropdownMenuItem asChild className="flex items-center cursor-pointer space-x-4">
                <button className="w-full flex items-center">
                  <LogOut className="mr-2 size-4" />
                  Log out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
