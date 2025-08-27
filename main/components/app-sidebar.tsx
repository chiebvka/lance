"use client"

import * as React from "react"
import {
  BadgeHelp,
  BookOpen,
  BrickWall,
  ChartNoAxesCombined,
  Cog,
  Contact,
  FolderKanban,
  Frame,
  GalleryVerticalEnd,
  Home,
  Image,
  LinkIcon,
  Logs,
  Map,
  MessagesSquare,
  Newspaper,
  PieChart,
  Receipt,
  ReceiptText,
  Siren,
  Split,
  StopCircle,
  Vault,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import Link from "next/link"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import Logo from "./logo"
import { useOrganization } from "@/hooks/organizations/use-organization"

// This is sample data.
const data = {

  teams: [
    {
      name: "Bexforte",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "/protected",
      icon: ChartNoAxesCombined,
      isActive: true,
    },
    {
      title: "Customers",
      url: "/protected/customers",
      icon: Contact,
      isActive: true,
    },
    {
      title: "Projects",
      url: "/protected/projects",
      icon: FolderKanban,
    },
    {
      title: "Invoices",
      url: "/protected/invoices",
      icon: Receipt,
    },
    {
      title: "Receipts",
      url: "/protected/receipts",
      icon: ReceiptText,
    },
    {
      title: "Feedbacks",
      url: "/protected/feedback",
      icon: MessagesSquare,
    },
    {
      title: "Walls",
      url: "/protected/walls",
      icon: BrickWall ,
    },
    {
      title: "Path",
      url: "/protected/paths",
      icon: Split ,
    },
    {
      title: "Settings",
      url: "/protected/settings",
      icon: Cog,
    },
  ],
  projects: [
    {
      name: "Error Message?",
      url: "#",
      icon: Siren,
    },
    {
      name: "Need Support?",
      url: "#",
      icon: BadgeHelp,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: any; // You can replace 'any' with your Supabase User type if available
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  // Create a user object that matches the NavUser component's expected format
  const userData = {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Admin",
    email: user.email,
    avatar: user.user_metadata?.avatar_url || "/avatars/shadcn.jpg"
  }

  const { data: organization } = useOrganization()
  const supportEmail = organization?.email || userData.email

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <div className="">
            <Logo height={30} width={30} />
        </div>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} userEmail={supportEmail} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser 
          user={userData} 
          organization={organization}
          showDropdown={false}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
