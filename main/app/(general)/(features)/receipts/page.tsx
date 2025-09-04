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
  path: '/receipts',
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
    lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalGZDH5A4G6vKMBc7jnSCz2dEZpQtOghsaDqX9",
    darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalvZQ7tg0PNqaV5zUDX7I06FbjMkvcBdEnmu8S",
    altText: "Receipt management dashboard preview"
  }

  const bentoContent = {
    title: "Receipt Management Made Simple",
    description: "Transform how you handle receipts with intelligent automation, smart categorization, and seamless expense tracking.",
    cards: [
      {
        title: "Due Receipts Calendar & Analytics",
        description: "Manage your invoices due dates and get analytics on your invoices.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalJYWsKdcVAgnJOSDTGi0a721q8PwEr39xjMNy",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdals84WGrgF0bT8wYz5iGdZ4u6vc1egp97rmtlP",
        altText: "Due receipts calendar and analytics"
      },
      {
        title: "Quick Reminders",
        description: "Send out quick reminders about your receipts to your customers.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalUPgcXs1xo83NBPKislcvQEqaT7nYWruI0A64",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdaleZFYzbUsY31vlpytouB8rVH6mA9DQjC4nFzR",
        altText: "quick project reminders"
      },
      {
        title: "Recent Activities",
        description: "See recent activities on your receipts sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalr9uNrlb169hY57pVFn2ABom0RXGCZjWJLuSQ",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalWkgb2PSkoYzVLWgHt3GDZfaM8seAhrw49NJS",
        altText: "Custom survey builder interface"
      },
      {
        title: "Quick Previews",
        description: "Preview your receipts sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalvmvlkk0PNqaV5zUDX7I06FbjMkvcBdEnmu8S",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalyCwoJuHQhceKxZzqp6UWYbsARv4PTwiC2uan",
        altText: "Quick previews dashboard"
      },
      {
        title: "Quick Actions",
        description: "Perform quick actions on your receipts sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdaldsHIvbD3z9vTNenx26LV1yjRE8mHPGQ4bKil",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdal99RqbMaqswE6goNW3AxvPBaDkcUQyZ2pnrSC",
        altText: "Quick actions dashboard"
      },
      {
        title: "Peronalized emails ",
        description: "Share project insights across teams and departments for better decision-making.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalbP9hjElplS6xJwfnDrFWdsIHeh7XLYzK42T0",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalbP9hjElplS6xJwfnDrFWdsIHeh7XLYzK42T0",
        altText: "Team collaboration on project insights"
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