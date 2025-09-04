import React from 'react';
import { createPageMetadata } from '@/lib/seo';
import { FileSignature, Notebook, Receipt, ReceiptText, TicketCheck, BellElectric, Cog, ScanLine, Tangent, UtilityPole, Link, FileCheck, FileText, Rocket, Zap, Sparkles, Lightbulb, SkipForward, MessagesSquare, BrickWall, Split, FolderKanban, Handshake } from "lucide-react";

import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = createPageMetadata({
    title: 'Features',
    description: 'Features of BexForte, why choose BexForte, BexForte features',
    path: '/features',
    keywords: ['features', 'features of BexForte', 'why choose BexForte', 'BexForte features']
  });

type Props = {}

const upcomingFeatures = [
  { icon: SkipForward, title: "Feature Vote", description: "Vote on the next feature to be added along with other users of Lancefortes" },
//   { icon: Link, title: "Link Shortener", description: "Create custom short links for your projects and invoices" },
  { icon: Sparkles, title: "AI-Powered Insights", description: "Get intelligent suggestions for pricing and project management" },
  { icon: Zap, title: "Instant Notifications", description: "Real-time updates on project status and client actions" },
  { icon: Lightbulb, title: "Idea Board", description: "Collaborative space to brainstorm and plan new projects" },
];



export default function page({}: Props) {
  return (
    <div className='w-10/12 mx-auto'>
      <div className="mt-12 mb-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="relative group overflow-hidden p-4 my-3 rounded-none bg-lightCard dark:bg-darkCard hover:border-sky-200 -mt-2  space-x-2 bg-gradient-to-br  border-2 border-primary ">
            <div aria-hidden="true" className="inset-0 absolute aspect-video border rounded-full -translate-y-1/2 group-hover:-translate-y-1/4 duration-300 bg-gradient-to-b from-purple-500 to-lightCard dark:to-darkCard  blur-2xl opacity-25 "></div>
            <div className="relative">
                <div className="border border-yellow-500/10 flex relative *:relative *:size-6 *:m-auto size-12 rounded-lg  before:rounded-[7px] before:absolute before:inset-0 before:border-t before:border-white before:from-purple-100  before:bg-gradient-to-b  ">
                  <Receipt className="text-primary" />
                </div>

                <div className="mt-6 group pb-6 rounded-b-[--card-border-radius]">
                  <h2 className="text-xl text-primary font-medium transition group-hover:text-bexoni/60">Invoices</h2>
                </div>

                <div className="mt-2 pb-6 rounded-b-[--card-border-radius]">
                    <p className="text-muted-foreground text-sm ">Manage and send professional invoices to your clients with ease and track payment status.</p>
                </div>
            </div>
        </div>
        <div className="relative group overflow-hidden p-4 my-3 rounded-none bg-lightCard dark:bg-darkCard hover:border-sky-200 -mt-2  space-x-2 bg-gradient-to-br  border-2 border-rose-600 ">
            <div aria-hidden="true" className="inset-0 absolute aspect-video border rounded-full -translate-y-1/2 group-hover:-translate-y-1/4 duration-300 bg-gradient-to-b from-rose-500 to-lightCard dark:to-darkCard  blur-2xl opacity-25 "></div>
            <div className="relative">
                <div className="border border-rose-500/10 flex relative *:relative *:size-6 *:m-auto size-12 rounded-lg  before:rounded-[7px] before:absolute before:inset-0 before:border-t before:border-white before:from-rose-100  before:bg-gradient-to-b  ">
                  <ReceiptText className="text-rose-600" />
                </div>

                <div className="mt-6 group pb-6 rounded-b-[--card-border-radius]">
                  <h2 className="text-xl text-rose-600 font-medium transition group-hover:text-rose-800">Receipts</h2>
                </div>

                <div className="mt-6 pb-6 rounded-b-[--card-border-radius]">
                    <p className="text-muted-foreground text-sm">Trigger receipts online through your invoice or create one to send to your clients for offline payments</p>
                </div>
            </div>
        </div>
        <div className="relative group overflow-hidden p-4 my-3 rounded-none bg-lightCard dark:bg-darkCard hover:border-sky-200 -mt-2  space-x-2 bg-gradient-to-br  border-2 border-primary ">
            <div aria-hidden="true" className="inset-0 absolute aspect-video border rounded-full -translate-y-1/2 group-hover:-translate-y-1/4 duration-300 bg-gradient-to-b from-purple-500 to-lightCard dark:to-darkCard  blur-2xl opacity-25 "></div>
            <div className="relative">
                <div className="border border-yellow-500/10 flex relative *:relative *:size-6 *:m-auto size-12 rounded-lg  before:rounded-[7px] before:absolute before:inset-0 before:border-t before:border-white before:from-purple-100  before:bg-gradient-to-b  ">
                  <FolderKanban className="text-primary" />
                </div>

                <div className="mt-6 group pb-6 rounded-b-[--card-border-radius]">
                  <h2 className="text-xl text-primary font-medium transition group-hover:text-purple-800">Projects</h2>
                </div>

                <div className="mt-2 pb-6 rounded-b-[--card-border-radius]">
                    <p className="text-muted-foreground text-sm">Give your clients a link to get project details, a contract to sign off on an avenue to track project progress</p>
                </div>
            </div>
        </div>
        <div className="relative group overflow-hidden p-4 my-3 rounded-none bg-lightCard dark:bg-darkCard hover:border-sky-200 -mt-2  space-x-2 bg-gradient-to-br  border-2 border-rose-600 ">
            <div aria-hidden="true" className="inset-0 absolute aspect-video border rounded-full -translate-y-1/2 group-hover:-translate-y-1/4 duration-300 bg-gradient-to-b from-rose-500 to-lightCard dark:to-darkCard  blur-2xl opacity-25 "></div>
            <div className="relative">
                <div className="border border-rose-500/10 flex relative *:relative *:size-6 *:m-auto size-12 rounded-lg  before:rounded-[7px] before:absolute before:inset-0 before:border-t before:border-white before:from-rose-100  before:bg-gradient-to-b  ">
                  <Notebook className="text-rose-600" />
                </div>
                <div className="mt-6 group pb-6 rounded-b-[--card-border-radius]">
                  <h2 className="text-xl text-rose-600 font-medium transition group-hover:text-rose-800">Client Management</h2>
                </div>

                <div className="mt-6 pb-6 rounded-b-[--card-border-radius]">
                    <p className="text-muted-foreground text-sm">Keep all client information, communication logs, and project details in one central place.</p>
                </div>
            </div>
        </div>
        <div className="relative group overflow-hidden p-4 my-3 rounded-none bg-lightCard dark:bg-darkCard hover:border-sky-200 -mt-2  space-x-2 bg-gradient-to-br  border-2 border-primary ">
            <div aria-hidden="true" className="inset-0 absolute aspect-video border rounded-full -translate-y-1/2 group-hover:-translate-y-1/4 duration-300 bg-gradient-to-b from-purple-500 to-lightCard dark:to-darkCard  blur-2xl opacity-25 "></div>
            <div className="relative">
                <div className="border border-yellow-500/10 flex relative *:relative *:size-6 *:m-auto size-12 rounded-lg  before:rounded-[7px] before:absolute before:inset-0 before:border-t before:border-white before:from-purple-100  before:bg-gradient-to-b  ">
                  <Split className="text-primary" />
                </div>

                <div className="mt-6 group pb-6 rounded-b-[--card-border-radius]">
                  <h2 className="text-xl text-primary font-medium transition group-hover:text-bexoni/60">Paths</h2>
                </div>

                <div className="mt-2 pb-6 rounded-b-[--card-border-radius]">
                    <p className="text-muted-foreground text-sm ">Create structured links, and one click communications and workflows that guide clients through your processes and effective communication. Standardize work processes and ensure nothing gets missed with our intuitive path builder.</p>
                </div>
            </div>
        </div>
        <div className="relative group overflow-hidden p-4 my-3 rounded-none bg-lightCard dark:bg-darkCard hover:border-sky-200 -mt-2  space-x-2 bg-gradient-to-br  border-2 border-rose-600 ">
            <div aria-hidden="true" className="inset-0 absolute aspect-video border rounded-full -translate-y-1/2 group-hover:-translate-y-1/4 duration-300 bg-gradient-to-b from-rose-500 to-lightCard dark:to-darkCard  blur-2xl opacity-25 "></div>
            <div className="relative">
                <div className="border border-rose-500/10 flex relative *:relative *:size-6 *:m-auto size-12 rounded-lg  before:rounded-[7px] before:absolute before:inset-0 before:border-t before:border-white before:from-rose-100  before:bg-gradient-to-b  ">
                  <BrickWall className="text-rose-600" />
                </div>

                <div className="mt-6 group pb-6 rounded-b-[--card-border-radius]">
                  <h2 className="text-xl text-rose-600 font-medium transition group-hover:text-rose-800">Walls</h2>
                </div>

                <div className="mt-6 pb-6 rounded-b-[--card-border-radius]">
                    <p className="text-muted-foreground text-sm">Create collaborative digital spaces where you can organize and share project-related content, documents, and updates with clients and team members.</p>
                </div>
            </div>
        </div>
        <div className="relative group overflow-hidden p-4 my-3 rounded-none bg-lightCard dark:bg-darkCard hover:border-sky-200 -mt-2  space-x-2 bg-gradient-to-br  border-2 border-primary ">
            <div aria-hidden="true" className="inset-0 absolute aspect-video border rounded-full -translate-y-1/2 group-hover:-translate-y-1/4 duration-300 bg-gradient-to-b from-purple-500 to-lightCard dark:to-darkCard  blur-2xl opacity-25 "></div>
            <div className="relative">
                <div className="border border-yellow-500/10 flex relative *:relative *:size-6 *:m-auto size-12 rounded-lg  before:rounded-[7px] before:absolute before:inset-0 before:border-t before:border-white before:from-purple-100  before:bg-gradient-to-b  ">
                  <MessagesSquare className="text-primary" />
                </div>

                <div className="mt-6 group pb-6 rounded-b-[--card-border-radius]">
                  <h2 className="text-xl text-primary font-medium transition group-hover:text-purple-800">Feedbacks</h2>
                </div>

                <div className="mt-2 pb-6 rounded-b-[--card-border-radius]">
                    <p className="text-muted-foreground text-sm">Collect and analyze pre and post project feedback from clients to improve your services and build better relationships.</p>
                </div>
            </div>
        </div>
        <div className="relative group overflow-hidden p-4 my-3 rounded-none bg-lightCard dark:bg-darkCard hover:border-sky-200 -mt-2  space-x-2 bg-gradient-to-br  border-2 border-rose-600 ">
            <div aria-hidden="true" className="inset-0 absolute aspect-video border rounded-full -translate-y-1/2 group-hover:-translate-y-1/4 duration-300 bg-gradient-to-b from-rose-500 to-lightCard dark:to-darkCard  blur-2xl opacity-25 "></div>
            <div className="relative">
                <div className="border border-rose-500/10 flex relative *:relative *:size-6 *:m-auto size-12 rounded-lg  before:rounded-[7px] before:absolute before:inset-0 before:border-t before:border-white before:from-rose-100  before:bg-gradient-to-b  ">
                  <Handshake className="text-rose-600" />
                </div>
                <div className="mt-6 group pb-6 rounded-b-[--card-border-radius]">
                  <h2 className="text-xl text-rose-600 font-medium transition group-hover:text-rose-800">Service Agreements</h2>
                </div>

                <div className="mt-6 pb-6 rounded-b-[--card-border-radius]">
                    <p className="text-muted-foreground text-sm">Create and manage digital service agreements and contracts efficiently to streamline your workflow.</p>
                </div>
            </div>
        </div>

      </div>
      <div className="mt-16 mb-8">
        <h2 className="text-lg md:text-3xl lg:text-4xl font-bold text-center mb-8">Upcoming Features</h2>
        <div className="space-y-8">
          {upcomingFeatures.map((feature, index) => (
            <div key={index} className="flex p-4 items-start border-2 border-primary bg-lightCard dark:bg-darkCard shadow-md rounded-none overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex-shrink-0 w-12 h-12 rounded-none bg-lightCard dark:bg-darkCard flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="md:text-lg text-sm font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground md:text-base text-xs mt-1">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}