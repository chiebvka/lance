import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { FeatureHero } from '../_components/feature-hero'
import { DashboardPreview } from '../_components/dashboard-preview'
import { BentoSection } from '../_components/bento-section'
import FaqAccordian from '@/components/faqs/faq-accordian'
import { projectFaqs } from '@/data/faqs'

export const metadata: Metadata = createPageMetadata({
  title: 'Project Management',
  description: 'Plan, track, and deliver projects on time with intuitive project management tools. Collaborate seamlessly with your team and keep stakeholders informed.',
  path: '/features/projects',
  keywords: ['project management', 'task tracking', 'team collaboration', 'time tracking', 'resource management']
});


type Props = {}

export default function page({}: Props) {
  // Content configuration for the projects page
  const heroContent = {
    title: "Project Management That Actually Works",
    description: "Plan, track, and deliver projects on time with intuitive project management tools. Collaborate seamlessly with your team and keep stakeholders informed.",
    buttonText: "Start Managing Projects",
    buttonHref: "/signup"
  }

  const dashboardContent = {
    lightModeImage: "https://images.pexels.com/photos/32515533/pexels-photo-32515533.jpeg",
    darkModeImage: "https://images.pexels.com/photos/32515533/pexels-photo-32515533.jpeg",
    altText: "Project management dashboard preview"
  }

  const bentoContent = {
    title: "Project Tools for Modern Teams",
    description: "Comprehensive project management solutions that adapt to your workflow and help you deliver exceptional results.",
    cards: [
      {
        title: "Task Management & Tracking",
        description: "Organize tasks with kanban boards, timelines, and priority-based workflows.",
        imageUrl: "https://images.pexels.com/photos/33596336/pexels-photo-33596336.jpeg",
        altText: "Task management and tracking interface"
      },
      {
        title: "Team Collaboration",
        description: "Real-time collaboration with comments, file sharing, and team communication tools.",
        imageUrl: "https://images.pexels.com/photos/33529180/pexels-photo-33529180.jpeg",
        altText: "Team collaboration workspace"
      },
      {
        title: "Time Tracking & Reporting",
        description: "Monitor project progress and team productivity with detailed time tracking.",
        imageUrl: "https://images.pexels.com/photos/33588195/pexels-photo-33588195.jpeg",
        altText: "Time tracking and reporting dashboard"
      },
      {
        title: "Resource Management",
        description: "Optimize resource allocation and manage team workload effectively.",
        imageUrl: "https://images.pexels.com/photos/33042614/pexels-photo-33042614.jpeg",
        altText: "Resource management system"
      },
      {
        title: "Gantt Charts & Timelines",
        description: "Visualize project schedules and dependencies with interactive Gantt charts.",
        imageUrl: "https://images.pexels.com/photos/33543175/pexels-photo-33543175.jpeg",
        altText: "Gantt charts and timeline visualization"
      },
      {
        title: "Client Portal",
        description: "Keep clients updated with secure access to project progress and deliverables.",
        imageUrl: "https://images.pexels.com/photos/32878855/pexels-photo-32878855.jpeg",
        altText: "Client portal interface"
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
                    Find answers to common questions about Bexforte Projects
                    </p>
                </div>
                <FaqAccordian faqs={projectFaqs} />
                </div>
            </section>
        </div>
    </div>
  )
}