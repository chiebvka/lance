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
  path: '/invoices',
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
    lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdaloqdIcUtNS4VUITP3CrtpHjw5yDhg7G8Knfi9",
    darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalFGOQfEyO0PCjZfaWMUiLY2oz4h8ENslA9bSB",
    altText: "Invoice management dashboard preview"
  }

  const bentoContent = {
    title: "Invoice Features That Drive Results",
    description: "Everything you need to manage invoices efficiently, track payments, and maintain professional client relationships.",
    cards: [
      {
        title: "Due Invoices Calendar & Analytics",
        description: "Manage your invoices due dates and get analytics on your invoices.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdal0YEEwGPD8ZOnksMh6KA45pc9rUEGH1YfdoiL",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalKliJnhweYwSMUFm16DjdW394icZxaO5sJVNH",
        altText: "Due invoices calendar and analytics"
      },
      {
        title: "Quick Reminders",
        description: "Send out quick reminders about your invoices to your customers.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalUPgcXs1xo83NBPKislcvQEqaT7nYWruI0A64",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdaleZFYzbUsY31vlpytouB8rVH6mA9DQjC4nFzR",
        altText: "quick project reminders"
      },
      {
        title: "Recent Activities",
        description: "See recent activities on your invoices sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalr9uNrlb169hY57pVFn2ABom0RXGCZjWJLuSQ",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalWkgb2PSkoYzVLWgHt3GDZfaM8seAhrw49NJS",
        altText: "Custom survey builder interface"
      },
      {
        title: "Quick Previews",
        description: "Preview your invoices sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalvmvlkk0PNqaV5zUDX7I06FbjMkvcBdEnmu8S",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalyCwoJuHQhceKxZzqp6UWYbsARv4PTwiC2uan",
        altText: "Quick previews dashboard"
      },
      {
        title: "Quick Actions",
        description: "Perform quick actions on your invoices sent out to customers and clients.",
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