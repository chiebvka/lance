"use client"

import { ChevronRight,  type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link";
import { cn } from "@/lib/utils"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  const { state } = useSidebar()
  
  const isItemActive = (itemUrl: string) => {
    if (itemUrl === "/protected") {
      return pathname === "/protected"
    }
    return pathname.startsWith(itemUrl)
  }
  
  const isCollapsed = state === "collapsed"

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = isItemActive(item.url)
          return (
            <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  tooltip={item.title} 
                  asChild
                  className={cn(
                    "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    isActive && "bg-bexoni/10"
                  )}
                >
                    <Link href={item.url}>
                        {item.icon && (
                          <item.icon 
                            className={cn(
                              "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
                              isActive && "text-primary",
                              isActive && isCollapsed && "scale-115"
                            )}
                          />
                        )}
                        <span>{item.title}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
