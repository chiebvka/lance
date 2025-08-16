import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react'
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

type Props = {}

export default  async function ProtectedLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return redirect("/login");
    }

  return (
    <div  className='w-full h-full'>
        <div className='w-full h-full'>
            <div className='w-full h-full'>
                {children}
            </div>
        </div>
    </div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: "Dashboard",
  description:
    "Your BexForte dashboard for managing customers, walls, projects, feedback, invoices and receipts.",
  path: "/protected",
  noIndex: true,
});