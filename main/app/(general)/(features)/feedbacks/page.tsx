import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { FeatureHero } from '../_components/feature-hero'
import { DashboardPreview } from '../_components/dashboard-preview'
import { BentoSection } from '../_components/bento-section'
import FaqAccordian from '@/components/faqs/faq-accordian'
import { feedbackFaqs } from '@/data/faqs'

export const metadata: Metadata = createPageMetadata({
  title: 'Customer Feedback Management',
  description: 'Build better products and services with comprehensive feedback collection, analysis, and actionable insights. Turn customer feedback into business growth.',
  path: '/features/feedbacks',
  keywords: ['customer feedback', 'feedback collection', 'sentiment analysis', 'survey builder']
});


type Props = {}

export default function page({}: Props) {
  // Content configuration for the feedbacks page
  const heroContent = {
    title: "Collect & Manage Customer Feedback",
    description: "Build better products and services with comprehensive feedback collection, analysis, and actionable insights. Turn customer feedback into business growth.",
    buttonText: "Start Collecting Feedback",
    buttonHref: "/signup"
  }

  const dashboardContent = {
    lightModeImage: "https://images.pexels.com/photos/29912663/pexels-photo-29912663.jpeg",
    darkModeImage: "https://images.pexels.com/photos/3285472/pexels-photo-3285472.jpeg",
    altText: "Customer feedback management dashboard preview"
  }

  const bentoContent = {
    title: "Feedback Tools That Drive Growth",
    description: "Comprehensive feedback solutions that help you understand your customers, improve your offerings, and build lasting relationships.",
    cards: [
      {
        title: "Multi-Channel Collection",
        description: "Collect feedback from surveys, reviews, social media, and customer support interactions.",
        imageUrl: "https://images.pexels.com/photos/33596336/pexels-photo-33596336.jpeg",
        altText: "Multi-channel feedback collection system"
      },
      {
        title: "Sentiment Analysis",
        description: "AI-powered sentiment analysis to understand customer emotions and satisfaction levels.",
        imageUrl: "https://images.pexels.com/photos/33529180/pexels-photo-33529180.jpeg",
        altText: "AI sentiment analysis dashboard"
      },
      {
        title: "Custom Survey Builder",
        description: "Create beautiful, engaging surveys with our drag-and-drop survey builder.",
        imageUrl: "https://images.pexels.com/photos/33588195/pexels-photo-33588195.jpeg",
        altText: "Custom survey builder interface"
      },
      {
        title: "Real-Time Analytics",
        description: "Monitor feedback trends and customer satisfaction in real-time dashboards.",
        imageUrl: "https://images.pexels.com/photos/33042614/pexels-photo-33042614.jpeg",
        altText: "Real-time feedback analytics"
      },
      {
        title: "Actionable Insights",
        description: "Transform raw feedback into actionable business insights and improvement plans.",
        imageUrl: "https://images.pexels.com/photos/33543175/pexels-photo-33543175.jpeg",
        altText: "Actionable insights dashboard"
      },
      {
        title: "Team Collaboration",
        description: "Share feedback insights across teams and departments for better decision-making.",
        imageUrl: "https://images.pexels.com/photos/32878855/pexels-photo-32878855.jpeg",
        altText: "Team collaboration on feedback insights"
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
                <div className="content-center max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">
                    Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-muted-foreground">
                    Find answers to common questions about Bexforte Feedback
                    </p>
                </div>
                <FaqAccordian faqs={feedbackFaqs} />
                </div>
            </section>
        </div>
    </div>
  )
}