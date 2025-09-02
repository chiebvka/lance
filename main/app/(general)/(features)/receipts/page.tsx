import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { FeatureHero } from '../_components/feature-hero'
import { DashboardPreview } from '../_components/dashboard-preview'
import { BentoSection } from '../_components/bento-section'
import FaqAccordian from '@/components/faqs/faq-accordian'
import { receiptFaqs } from '@/data/faqs'

export const metadata: Metadata = createPageMetadata({
  title: 'Receipt Management',
  description: 'Capture, categorize, and store receipts automatically with AI-powered expense tracking. Never lose a receipt again and simplify your expense management.',
  path: '/features/receipts',
  keywords: ['receipt management', 'expense tracking', 'OCR scanning', 'expense reports']
});


type Props = {}

export default function page({}: Props) {
  // Content configuration for the receipts page
  const heroContent = {
    title: "Organize Receipts Like Never Before",
    description: "Capture, categorize, and store receipts automatically with AI-powered expense tracking. Never lose a receipt again and simplify your expense management.",
    buttonText: "Start Organizing Receipts",
    buttonHref: "/signup"
  }

  const dashboardContent = {
    lightModeImage: "https://images.pexels.com/photos/33611917/pexels-photo-33611917.jpeg",
    darkModeImage: "https://images.pexels.com/photos/13517407/pexels-photo-13517407.jpeg",
    altText: "Receipt management dashboard preview"
  }

  const bentoContent = {
    title: "Receipt Management Made Simple",
    description: "Transform how you handle receipts with intelligent automation, smart categorization, and seamless expense tracking.",
    cards: [
      {
        title: "Smart Receipt Scanning",
        description: "Use your phone camera to instantly capture and digitize receipts with OCR technology.",
        imageUrl: "https://images.pexels.com/photos/33596336/pexels-photo-33596336.jpeg",
        altText: "Smart receipt scanning with mobile camera"
      },
      {
        title: "Automatic Categorization",
        description: "AI-powered categorization that learns your spending patterns and organizes receipts automatically.",
        imageUrl: "https://images.pexels.com/photos/33529180/pexels-photo-33529180.jpeg",
        altText: "Automatic receipt categorization system"
      },
      {
        title: "Expense Tracking & Reports",
        description: "Generate detailed expense reports and track spending across categories and time periods.",
        imageUrl: "https://images.pexels.com/photos/33588195/pexels-photo-33588195.jpeg",
        altText: "Expense tracking and reporting dashboard"
      },
      {
        title: "Cloud Storage & Backup",
        description: "Secure cloud storage ensures your receipts are safe and accessible from anywhere.",
        imageUrl: "https://images.pexels.com/photos/33042614/pexels-photo-33042614.jpeg",
        altText: "Cloud storage and backup system"
      },
      {
        title: "Tax Preparation Ready",
        description: "Export organized data in formats ready for tax preparation and accounting software.",
        imageUrl: "https://images.pexels.com/photos/33543175/pexels-photo-33543175.jpeg",
        altText: "Tax preparation and export tools"
      },
      {
        title: "Team Expense Management",
        description: "Manage team expenses with role-based access and approval workflows.",
        imageUrl: "https://images.pexels.com/photos/32878855/pexels-photo-32878855.jpeg",
        altText: "Team expense management interface"
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
                    Find answers to common questions about Bexforte Receipts
                    </p>
                </div>
                <FaqAccordian faqs={receiptFaqs} />
                </div>
            </section>
        </div>
    </div>
  )
}