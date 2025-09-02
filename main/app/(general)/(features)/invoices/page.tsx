import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import { FeatureHero } from '../_components/feature-hero'
import { AnimatedSection } from '../_components/animated-section'
import { DashboardPreview } from '../_components/dashboard-preview'
import { BentoSection } from '../_components/bento-section'
import FaqAccordian from '@/components/faqs/faq-accordian'
import { invoiceFaqs } from '@/data/faqs'

export const metadata: Metadata = createPageMetadata({
  title: 'Invoice Management',
  description: 'Create, send, and track professional invoices with automated reminders and seamless payment processing. Save time and get paid faster with Bexforte Invoices.',
  path: '/features/invoices',
  keywords: ['invoice management', 'payment processing', 'automated reminders', 'professional invoices']
});


type Props = {}

export default function page({}: Props) {
  // Content configuration for the page
  const heroContent = {
    title: "Streamline Your Invoice Management",
    description: "Create, send, and track professional invoices with automated reminders and seamless payment processing. Save time and get paid faster with Bexforte Invoices.",
    buttonText: "Start Creating Invoices",
    buttonHref: "/signup"
  }

  const dashboardContent = {
    lightModeImage: "https://images.pexels.com/photos/7512566/pexels-photo-7512566.jpeg",
    darkModeImage: "https://images.pexels.com/photos/7512566/pexels-photo-7512566.jpeg",
    altText: "Invoice management dashboard preview"
  }

  const bentoContent = {
    title: "Invoice Features That Drive Results",
    description: "Everything you need to manage invoices efficiently, track payments, and maintain professional client relationships.",
    cards: [
      {
        title: "Professional Invoice Templates",
        description: "Beautiful, customizable templates that reflect your brand and impress clients.",
        imageUrl: "https://images.pexels.com/photos/33596336/pexels-photo-33596336.jpeg",
        altText: "Professional invoice template design"
      },
      {
        title: "Automated Payment Reminders",
        description: "Never chase payments again with smart, automated reminder systems.",
        imageUrl: "https://images.pexels.com/photos/33529180/pexels-photo-33529180.jpeg",
        altText: "Automated payment reminder system"
      },
      {
        title: "Multi-Currency Support",
        description: "Accept payments in any currency with real-time exchange rate calculations.",
        imageUrl: "https://images.pexels.com/photos/33588195/pexels-photo-33588195.jpeg",
        altText: "Multi-currency payment support"
      },
      {
        title: "Client Portal Access",
        description: "Give clients secure access to view and pay invoices online.",
        imageUrl: "https://images.pexels.com/photos/33042614/pexels-photo-33042614.jpeg",
        altText: "Secure client portal interface"
      },
      {
        title: "Advanced Analytics & Reporting",
        description: "Track cash flow, payment trends, and business performance insights.",
        imageUrl: "https://images.pexels.com/photos/33543175/pexels-photo-33543175.jpeg",
        altText: "Analytics and reporting dashboard"
      },
      {
        title: "Mobile-First Design",
        description: "Create and manage invoices on the go with our responsive mobile app.",
        imageUrl: "https://images.pexels.com/photos/32878855/pexels-photo-32878855.jpeg",
        altText: "Mobile invoice management app"
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
                    Find answers to common questions about Bexforte Invoices
                    </p>
                </div>
                <FaqAccordian faqs={invoiceFaqs} />
                </div>
            </section>
        </div>
    </div>
  )
}