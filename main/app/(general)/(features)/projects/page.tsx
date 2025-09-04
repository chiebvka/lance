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
  path: '/projects',
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
    lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalEFk5MFWz1tQwX0JNF6KcaSlyfbP3LCsve8g7",
    darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalb6AtmWlplS6xJwfnDrFWdsIHeh7XLYzK42T0",
    altText: "Project management dashboard preview"
  }

  const bentoContent = {
    title: "Project Tools for Modern Teams",
    description: "Comprehensive project management solutions that adapt to your workflow and help you deliver exceptional results.",
    cards: [
      {
        title: "Due Projects Calendar & Analytics",
        description: "Manage your projects due dates and get analytics on your projects.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalhXbmeyMaxo6yjW4Y9LTnczgpIvH7mJSRPAbk",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalzhVjI9Kb2ZVmS0XDQyx1pMYUfg6CrdsaGB5k",
        altText: "Due projects calendar and analytics"
      },
      {
        title: "Quick Reminders",
        description: "Send out quick reminders about your projects to your customers.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalUPgcXs1xo83NBPKislcvQEqaT7nYWruI0A64",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdaleZFYzbUsY31vlpytouB8rVH6mA9DQjC4nFzR",
        altText: "quick project reminders"
      },
      {
        title: "Recent Activities",
        description: "See recent activities on your projects sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalr9uNrlb169hY57pVFn2ABom0RXGCZjWJLuSQ",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalWkgb2PSkoYzVLWgHt3GDZfaM8seAhrw49NJS",
        altText: "Custom survey builder interface"
      },
      {
        title: "Quick Previews",
        description: "Preview your projects sent out to customers and clients.",
        lightModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalN35H9alpnDvIXpPQzyA1lrGTk67iF3KVs8xW",
        darkModeImage: "https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalbi7rp0lplS6xJwfnDrFWdsIHeh7XLYzK42T0",
        altText: "Quick previews dashboard"
      },
      {
        title: "Quick Actions",
        description: "Perform quick actions on your projects sent out to customers and clients.",
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