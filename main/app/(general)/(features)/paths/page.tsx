import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { FeatureHero } from '../_components/feature-hero'
import { DashboardPreview } from '../_components/dashboard-preview'
import { BentoSection } from '../_components/bento-section'
import FaqAccordian from '@/components/faqs/faq-accordian'
import { pathFaqs } from '@/data/faqs'

export const metadata: Metadata = createPageMetadata({
  title: 'Learning Paths & Workflows',
  description: 'Create structured links, and one click communications and workflows that guide clients through your processes and effective communication. Standardize work processes and ensure nothing gets missed with our intuitive path builder.',
  path: '/features/paths',
  keywords: ['learning paths', 'workflows', 'process automation', 'client onboarding', 'project management']
});


type Props = {}

export default function page({}: Props) {
  // Content configuration for the paths page
  const heroContent = {
    title: "Create Learning Paths That Inspire",
    description: "Design engaging learning experiences with structured paths, progress tracking, and interactive content. Help learners achieve their goals with personalized learning journeys.",
    buttonText: "Start Creating Paths",
    buttonHref: "/signup"
  }

  const dashboardContent = {
    lightModeImage: "https://images.pexels.com/photos/30548810/pexels-photo-30548810.jpeg",
    darkModeImage: "https://images.pexels.com/photos/30548810/pexels-photo-30548810.jpeg",
    altText: "Learning path creation dashboard preview"
  }

  const bentoContent = {
    title: "Learning Paths That Drive Success",
    description: "Comprehensive tools for creating, managing, and optimizing learning experiences that engage and educate your audience.",
    cards: [
      {
        title: "Path Builder",
        description: "Create structured learning paths with our intuitive drag-and-drop path builder.",
        imageUrl: "https://images.pexels.com/photos/33596336/pexels-photo-33596336.jpeg",
        altText: "Learning path builder interface"
      },
      {
        title: "Content Management",
        description: "Organize and manage learning content with smart categorization and tagging.",
        imageUrl: "https://images.pexels.com/photos/33529180/pexels-photo-33529180.jpeg",
        altText: "Content management system"
      },
      {
        title: "Progress Tracking",
        description: "Monitor learner progress and engagement with detailed analytics and insights.",
        imageUrl: "https://images.pexels.com/photos/33588195/pexels-photo-33588195.jpeg",
        altText: "Progress tracking dashboard"
      },
      {
        title: "Interactive Elements",
        description: "Add quizzes, assessments, and interactive content to enhance learning engagement.",
        imageUrl: "https://images.pexels.com/photos/33042614/pexels-photo-33042614.jpeg",
        altText: "Interactive learning elements"
      },
      {
        title: "Personalization",
        description: "Adapt learning paths based on individual progress and preferences.",
        imageUrl: "https://images.pexels.com/photos/33543175/pexels-photo-33543175.jpeg",
        altText: "Personalized learning paths"
      },
      {
        title: "Multi-Format Support",
        description: "Support various content formats including video, text, audio, and interactive elements.",
        imageUrl: "https://images.pexels.com/photos/32878855/pexels-photo-32878855.jpeg",
        altText: "Multi-format content support"
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
                    Find answers to common questions about Bexforte Learning Paths
                    </p>
                </div>
                <FaqAccordian faqs={pathFaqs} />
                </div>
            </section>
        </div>
    </div>
  )
}