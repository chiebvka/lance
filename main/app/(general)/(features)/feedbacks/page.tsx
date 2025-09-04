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
  path: '/feedbacks',
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
    lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalzdU88V9Kb2ZVmS0XDQyx1pMYUfg6CrdsaGB5",
    darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdala6YSWwe5bDN6EOxVYX0m2feFkncBs7j3Lpug",
    altText: "Customer feedback management dashboard preview"
  }

  const bentoContent = {
    title: "Feedback Tools That Drive Growth",
    description: "Comprehensive feedback solutions that help you understand your customers, improve your offerings, and build lasting relationships.",
    cards: [
      {
        title: "Due Feedbacks Calendar & Analytics",
        description: "Manage your feedback due dates and get analytics on your feedback.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdal75Gv3KBPJuIDkjWN8giKMpbyqrdCQHaLUxYA",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdal9v85zIaqswE6goNW3AxvPBaDkcUQyZ2pnrSC",
        altText: "Due feedbacks calendar and analytics"
      },
      {
        title: "Quick Reminders",
        description: "Send out quick reminders to collect feedback from your customers.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalUPgcXs1xo83NBPKislcvQEqaT7nYWruI0A64",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdaleZFYzbUsY31vlpytouB8rVH6mA9DQjC4nFzR",
        altText: "AI sentiment analysis dashboard"
      },
      {
        title: "Recent Activities",
        description: "See recent activities on your feedbacks, surveys sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalr9uNrlb169hY57pVFn2ABom0RXGCZjWJLuSQ",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalWkgb2PSkoYzVLWgHt3GDZfaM8seAhrw49NJS",
        altText: "Custom survey builder interface"
      },
      {
        title: "Quick Previews",
        description: "Preview your feedbacks, surveys sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalYfgU2QnpgWhBi1qLy9fIQn56FvuPDU3Txr0j",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdal49roieLODUXVSarR32P9n5uL6pFygxtKBMwI",
        altText: "Quick previews dashboard"
      },
      {
        title: "Quick Actions",
        description: "Perform quick actions on your feedbacks, surveys sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdaldsHIvbD3z9vTNenx26LV1yjRE8mHPGQ4bKil",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdal99RqbMaqswE6goNW3AxvPBaDkcUQyZ2pnrSC",
        altText: "Quick actions dashboard"
      },
      {
        title: "Peronalized emails ",
        description: "Share feedback insights across teams and departments for better decision-making.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalbP9hjElplS6xJwfnDrFWdsIHeh7XLYzK42T0",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalbP9hjElplS6xJwfnDrFWdsIHeh7XLYzK42T0",
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