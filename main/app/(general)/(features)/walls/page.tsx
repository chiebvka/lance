import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { FeatureHero } from '../_components/feature-hero'
import { DashboardPreview } from '../_components/dashboard-preview'
import { BentoSection } from '../_components/bento-section'
import FaqAccordian from '@/components/faqs/faq-accordian'
import { wallFaqs } from '@/data/faqs'

export const metadata: Metadata = createPageMetadata({
  title: 'Collaborative Walls & Canvas',
  description: 'Create collaborative digital spaces where you can organize and share project-related content, documents, and updates with clients and team members.',
  path: '/features/walls',
  keywords: ['collaborative walls', 'digital canvas', 'project collaboration', 'content organization', 'team workspace']
});

type Props = {}

export default function page({}: Props) {
  // Content configuration for the walls page
  const heroContent = {
    title: "Collaborative Walls That Bring Teams Together",
    description: "Create digital spaces where you can organize, share, and collaborate on project content. Keep everyone on the same page with visual organization and real-time updates.",
    buttonText: "Start Building Walls",
    buttonHref: "/signup"
  }

  const dashboardContent = {
    lightModeImage: "https://images.pexels.com/photos/33611917/pexels-photo-33611917.jpeg",
    darkModeImage: "https://images.pexels.com/photos/13517407/pexels-photo-13517407.jpeg",
    altText: "Collaborative walls and canvas interface"
  }

  const bentoContent = {
    title: "Walls That Transform Collaboration",
    description: "Powerful tools for creating organized, collaborative spaces that streamline communication and keep projects moving forward.",
    cards: [
      {
        title: "Visual Organization",
        description: "Organize content visually with drag-and-drop layouts, categories, and custom sections for intuitive navigation.",
        imageUrl: "https://images.pexels.com/photos/33596336/pexels-photo-33596336.jpeg",
        altText: "Visual content organization interface"
      },
      {
        title: "Real-Time Collaboration",
        description: "Work together in real-time with live updates, comments, and collaborative editing capabilities.",
        imageUrl: "https://images.pexels.com/photos/33529180/pexels-photo-33529180.jpeg",
        altText: "Real-time collaboration features"
      },
      {
        title: "Content Management",
        description: "Easily add, organize, and manage various content types including documents, images, links, and notes.",
        imageUrl: "https://images.pexels.com/photos/33588195/pexels-photo-33588195.jpeg",
        altText: "Content management system"
      },
      {
        title: "Permission Control",
        description: "Set granular permissions to control who can view, edit, or comment on specific content and sections.",
        imageUrl: "https://images.pexels.com/photos/33042614/pexels-photo-33042614.jpeg",
        altText: "Permission and access control"
      },
      {
        title: "Client Collaboration",
        description: "Invite clients to contribute to walls with controlled access levels and professional presentation.",
        imageUrl: "https://images.pexels.com/photos/33543175/pexels-photo-33543175.jpeg",
        altText: "Client collaboration interface"
      },
      {
        title: "Mobile Accessibility",
        description: "Access and contribute to walls from anywhere with our responsive mobile interface and app.",
        imageUrl: "https://images.pexels.com/photos/32878855/pexels-photo-32878855.jpeg",
        altText: "Mobile wall access interface"
      },
    ]
  }

  return (
    <div className="w-full">
        <div className="relative">
            {/* Hero Section */}
            <FeatureHero {...heroContent} />
            
            {/* Dashboard Preview Section */}
            <section className="relative z-20 -mt-16 md:-mt-28 lg:-mt-36 mb-16 md:mb-24">
                <DashboardPreview {...dashboardContent} />
            </section>
            
            {/* Features Section */}
            <section className="relative z-10">
                <BentoSection {...bentoContent} />
            </section>
            
            {/* FAQ Section */}
            <section className="py-16 px-4" id="faqs">
                <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">
                    Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-muted-foreground">
                    Find answers to common questions about Bexforte Collaborative Walls
                    </p>
                </div>
                <FaqAccordian faqs={wallFaqs} />
                </div>
            </section>
        </div>
    </div>
  )
}