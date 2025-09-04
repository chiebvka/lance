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
  path: '/paths',
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
    lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalUMrPwEp1xo83NBPKislcvQEqaT7nYWruI0A6",
    darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalGZkkEO4G6vKMBc7jnSCz2dEZpQtOghsaDqX9",
    altText: "Learning path creation dashboard preview"
  }

  const bentoContent = {
    title: "Learning Paths That Drive Success",
    description: "Comprehensive tools for creating, managing, and optimizing learning experiences that engage and educate your audience.",
    cards: [
      {
        title: "Due Paths Calendar & Analytics",
        description: "Manage your paths due dates and get analytics on your paths.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalJYWsKdcVAgnJOSDTGi0a721q8PwEr39xjMNy",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdals84WGrgF0bT8wYz5iGdZ4u6vc1egp97rmtlP",
        altText: "Due paths calendar and analytics"
      },
      {
        title: "Quick Reminders",
        description: "Send out quick reminders about your paths to your customers.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalUPgcXs1xo83NBPKislcvQEqaT7nYWruI0A64",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdaleZFYzbUsY31vlpytouB8rVH6mA9DQjC4nFzR",
        altText: "quick project reminders"
      },
      {
        title: "Recent Activities",
        description: "See recent activities on your paths sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalr9uNrlb169hY57pVFn2ABom0RXGCZjWJLuSQ",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalWkgb2PSkoYzVLWgHt3GDZfaM8seAhrw49NJS",
        altText: "Custom survey builder interface"
      },
      {
        title: "Quick Previews",
        description: "Preview your paths sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalk3aOfuJW3L1NhVRJAFUTpBvkS4IiC0saD8fd",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdal1y7fXth3T2JhikX8DazNcpKP9SFxB46fvq5o",
        altText: "Quick previews dashboard"
      },
      {
        title: "Quick Actions",
        description: "Perform quick actions on your paths sent out to customers and clients.",
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