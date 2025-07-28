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

    // Check if user has an organization
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("profile_id, organizationId")
      .eq("profile_id", user?.id)
      .single();

    console.log("User profile:", userProfile);

    // If user doesn't have an organization, redirect to team creation
    if (!userProfile?.organizationId) {
      return redirect("/protected/team/create");
    }

    // Check if organization exists and is active
    const { data: organization } = await supabase
      .from("organization")
      .select("id, name, subscriptionStatus, trialEndsAt")
      .eq("id", userProfile.organizationId)
      .single();

    console.log("Organization:", organization);

    // If organization doesn't exist, redirect to team creation
    if (!organization) {
      return redirect("/protected/team/create");
    }

    // Optional: Check if trial has expired and redirect to billing
    if (organization.subscriptionStatus === 'trial' && organization.trialEndsAt) {
      const trialEndDate = new Date(organization.trialEndsAt);
      const now = new Date();
      
      if (now > trialEndDate) {
        // Trial has expired, redirect to billing page
        return redirect("/protected/account/billing");
      }
    }

    // Optional: Check if subscription is expired/cancelled and redirect to billing
    if (['expired', 'cancelled', 'suspended'].includes(organization.subscriptionStatus || '')) {
      return redirect("/protected/account/billing");
    }

  return (
    <div className="flex-1 w-full flex flex-col h-screen">
        <SidebarProvider>
            <AppSidebar user={user} />
            <SidebarInset>
                <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 px-4 border-b-2 border-primary bg-background/95 backdrop-blur-sm">
                  <SidebarTrigger className="-ml-1" />
                  <Breadcrumbs />
                </header>
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    </div>
  )
}