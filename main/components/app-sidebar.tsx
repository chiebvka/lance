"use client"

import * as React from "react"
import {
  BadgeHelp,
  BookOpen,
  ChartNoAxesCombined,
  Frame,
  GalleryVerticalEnd,
  Home,
  Image,
  Logs,
  Map,
  Newspaper,
  PieChart,
  Siren,
  StopCircle,
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

// This is sample data.
const data = {

  teams: [
    {
      name: "Ndi Enugu Scotland",
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
    //   items: [
    //     {
    //       title: "Home",
    //       url: "/protected",
    //     },
    //   ],
    },
    {
      title: "Customers",
      url: "/protected/customers",
      icon: Logs,
      isActive: true,
    },
    {
      title: "Projects & News",
      url: "/protected/projects",
      icon: Newspaper,
    //   items: [
    //     {
    //       title: "Add Project and News",
    //       url: "/protected/blogs/create",
    //     },
    //     {
    //       title: "Project & News Posts",
    //       url: "/protected/blogs",
    //     },
      
    //   ],
    },
    {
      title: "Tags",
      url: "/protected/tags",
      icon: Newspaper,
    //   items: [
    //     {
    //       title: "Blogs & Events Tags",
    //       url: "/protected/tags",
    //     },
  
    //   ],
    },
    {
      title: "Events",
      url: "/protected/events",
      icon: BookOpen,
    //   items: [
    //     {
    //       title: "Upcoming Events",
    //       url: "/protected/events",
    //     },
    //     {
    //       title: "Events Tags",
    //       url: "/protected/tags",
    //     },
    //   ],
    },
    {
      title: "Gallery",
      url: "/protected/gallery",
      icon: Image,
    //   items: [
    //     {
    //       title: "Media Gallery",
    //       url: "/protected/gallery",
    //     },
    //     {
    //       title: "Add Gallery",
    //       url: "/protected/gallery/add",
    //     },
    //   ],
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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="">
            <Logo height={30} width={30} />
        </div>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} userEmail={userData.email} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
