"use client"

import {
  Cog,
  LogOut,
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
import Link from "next/link"
import { useOrganization } from "@/hooks/organizations/use-organization"

interface UserDropdownProps {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function HeaderUserDropdown({ user }: UserDropdownProps) {
  const { data: organization } = useOrganization()

  const displayEmail = organization?.email || user.email
  const displayName = organization?.name || user.name
  const avatarSrc = organization?.logoUrl || undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-1 hover:bg-accent hover:text-accent-foreground transition-colors">
          <Avatar className="h-6 w-6">
            <AvatarImage src={avatarSrc} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {displayName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-6 w-6">
              <AvatarImage src={avatarSrc} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {displayName?.charAt(0) || 'U'}
              </AvatarFallback>
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
            <DropdownMenuItem className="flex items-center cursor-pointer">
              <Cog className="mr-2 size-4" />
              Reset Password
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild className="flex items-center cursor-pointer">
            <button className="w-full flex items-center">
              <LogOut className="mr-2 size-4" />
              Log out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
