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
  path: '/walls',
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
    lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalGQ709r4G6vKMBc7jnSCz2dEZpQtOghsaDqX9",
    darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalMnN9bVmd7PZECBwRWjxVT0t6hYMS4po2kLbi",
    altText: "Collaborative walls and canvas interface"
  }

  const bentoContent = {
    title: "Walls That Transform Collaboration",
    description: "Powerful tools for creating organized, collaborative spaces that streamline communication and keep projects moving forward.",
    cards: [
      {
        title: "Due Walls Calendar & Analytics",
        description: "Manage your walls due dates and get analytics on your invoices.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalJYWsKdcVAgnJOSDTGi0a721q8PwEr39xjMNy",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdals84WGrgF0bT8wYz5iGdZ4u6vc1egp97rmtlP",
        altText: "Due walls calendar and analytics"
      },
      {
        title: "Quick Reminders",
        description: "Send out quick reminders about your walls to your customers.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalUPgcXs1xo83NBPKislcvQEqaT7nYWruI0A64",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdaleZFYzbUsY31vlpytouB8rVH6mA9DQjC4nFzR",
        altText: "quick project reminders"
      },
      {
        title: "Recent Activities",
        description: "See recent activities on your walls sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalr9uNrlb169hY57pVFn2ABom0RXGCZjWJLuSQ",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalWkgb2PSkoYzVLWgHt3GDZfaM8seAhrw49NJS",
        altText: "Custom survey builder interface"
      },
      {
        title: "Quick Previews",
        description: "Preview your walls sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalL8i3Uz7Qeags4wEbTGImBp0SUc3yMjvnxH9k",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalz5seXh9Kb2ZVmS0XDQyx1pMYUfg6CrdsaGB5",
        altText: "Quick previews dashboard"
      },
      {
        title: "Quick Actions",
        description: "Perform quick actions on your walls sent out to customers and clients.",
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