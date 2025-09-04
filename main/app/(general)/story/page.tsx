import React from 'react'
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'
import Image from 'next/image'
import Logofull from '@/components/logofull'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <div className="text-center mb-10 md:mb-16 max-w-2xl mx-auto">
          <h1 className="text-lg md:text-3xl lg:text-4xl font-bold">
            This is why we're building <br />
            <span className="text-primary"> BexForte.</span>
          </h1>
      </div>

      {/* Problem Section */}
      <div className=" pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg md:text-3xl lg:text-4xl text-primary font-bold">Problem</h2>
          <p className="mt-4 text-xs md:text-sm lg:text-base text-muted-foreground leading-relaxed">
            After years of building MVPs and software solutions for our clients at Bexoni, we found ourselves repeatedly asking the same questions before starting each project and struggling with the same challenges after delivery. We were constantly juggling multiple platforms - Google Forms for client feedback, Zoho for invoices and receipts, Linktree for quick contact information, and endless meetings to train clients on how to operate their new software. We realized we were spending more time on administrative tasks and client management than on what we do best - building great software.
          </p>
        </div>
      </div>

      {/* Solution Section */}
      <div className=" pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg md:text-3xl text-primary font-bold">Solution</h2>
          <p className="mt-4 text-xs md:text-sm lg:text-base text-muted-foreground leading-relaxed">
            So we asked ourselves, why not create one comprehensive platform that handles all these repetitive tasks? BexForte was born from this need - a unified solution that streamlines client onboarding, feedback collection, invoicing, project documentation, and client training. What started as an internal tool to solve our own workflow challenges has evolved into something much bigger. We've discovered that our contractors, including social media influencers, are finding innovative ways to use BexForte that we never envisioned, proving that great tools adapt to their users' needs.
          </p>
        </div>
      </div>

      {/* Vision Section */}
      <div className="pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg md:text-3xl text-primary font-bold">Our Vision</h2>
          <p className="mt-4 text-xs md:text-sm lg:text-base text-muted-foreground leading-relaxed">
            We believe that every business, from startups to established companies, deserves access to professional-grade tools that simplify their operations. BexForte isn't just about solving our own problems - it's about empowering businesses to focus on what they do best while we handle the complexity of client management, feedback collection, and project delivery. As we continue to grow and learn from our diverse user base, we're committed to building features that truly matter to real businesses facing real challenges.
          </p>
        </div>
      </div>

      {/* Team Section */}
      <div className="pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Logofull />
          </div>
          <p className="text-lg text-gray-700 mb-4">Best regards,</p>
          <p className="text-2xl font-semibold text-primary mb-8" style={{ fontFamily: '' }}>
            Bexoni Team
          </p>
        </div>
      </div>


    </div>
  )
}

export const metadata: Metadata = createPageMetadata({
  title: 'Our Story - BexForte',
  description: 'Learn about why we built BexForte and how it evolved from solving our own business challenges into a comprehensive client management platform.',
  path: '/story',
});