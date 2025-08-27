import React from 'react';
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { 
    SidebarInset,
    SidebarProvider,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import Breadcrumbs from '@/components/breadcrumbs';
import { MobileSidebarTrigger } from '@/components/mobile-sidebar-trigger';
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { HeaderUserDropdown } from '@/components/header-user-dropdown';

type Props = {}

export default async function ProtectedLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/login");
    }

    // Organization and subscription checks are handled by middleware
    // No need to duplicate the logic here

    // Create user data object for the header dropdown
    const userData = {
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Admin",
      email: user.email || "user@example.com",
      avatar: user.user_metadata?.avatar_url || "/avatars/shadcn.jpg"
    }

  return (
    <div className="flex-1 w-full flex flex-col h-screen">
        <SidebarProvider defaultOpen={false}>
            <AppSidebar user={user} />
            <SidebarInset>
                <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 px-4 border-b-2 border-primary bg-background/95 backdrop-blur-sm">
                  <div className="md:hidden">
                    <MobileSidebarTrigger />
                  </div>
                  <div className="flex-1">
                    <Breadcrumbs />
                  </div>
                  <div className="flex items-center gap-2">
                    <HeaderUserDropdown user={userData} />
                  </div>
                </header>
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    </div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: "Workspace",
  description:
    "Work on customers, walls, feedback, projects, invoices and receipts in your BexForte workspace.",
  path: "/protected",
  noIndex: true,
});