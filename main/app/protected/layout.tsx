import React from 'react';
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { 
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
 } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import Breadcrumbs from '@/components/breadcrumbs';

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

  return (
    <div className="flex-1 w-full flex flex-col h-screen">
        <SidebarProvider>
            <AppSidebar user={user} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center  gap-2 px-4 border-b-2 border-primary">
                    <SidebarTrigger className="-ml-1" />
                    <Breadcrumbs />
                    </header>
                {children}
            </SidebarInset>
        </SidebarProvider>
    </div>
  )
}