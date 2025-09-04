"use client"
import React, { useState, useEffect } from 'react'
import { CheckCircle, PlayCircle } from 'lucide-react' // Assuming lucide-react for icons
import { RotatingWords } from './rotating-words';
import { Button } from './ui/button';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { RotatingWordsSlideUp } from './rotating-words-slideup';
import { RotatingWord } from './rotating-word';

// Placeholder for social media icons - you might use a library or actual SVGs
const SocialIcon = ({ platform, size = 6 }: { platform: string, size?: number }) => (
  <div className={`w-${size} h-${size} bg-gray-300 rounded-full flex items-center justify-center text-xs`}>{platform.charAt(0).toUpperCase()}</div>
);

export default function Hero() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState<boolean>(false);

    const heroWords = [
      'Freelancers',
      'Entrepreneurs',
      'Consultants',
      'Influencers',
      'Contractors',
      'Small Teams',
      'Creative Agencies',
      'Service Providers',
      'Solo Entrepreneurs',
      'Digital Creators',
      'Independent Workers',
      'Small Businesses',
      'Creative Studios'
    ];

    useEffect(() => {
        setMounted(true);
    }, []);

    const heroImage = mounted 
        ? (resolvedTheme === 'dark' ? '/herodark.png' : '/herolight.png')
        : '/herolight.png'; // Default to light for SSR

  return (
    <section className="w-full pb-12 md:pb-20 lg:pb-24 overflow-hidden">
      <div className=" mx-auto px-4">
        {/* Watch Demo Video */}
        <div className="mb-8 text-left">
          <a href="#" className="inline-flex items-center text-primary hover:text-bexoni">
            <PlayCircle className="w-6 h-6 mr-2" />
            Watch demo video
          </a>
        </div>

        {/* Desktop Layout: Text Left, Image Right */}
        <div className="hidden md:grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Column: Text Content */}
          <div className="space-y-6">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold tracking-tight">
            From initial inquiry to lasting relationships -  manage invoicing, tracking, agreements, and continous client engagement for {" "}        
              <RotatingWordsSlideUp words={heroWords} className="text-primary" />
            </h1>
            <p className="text-xs md:text-sm lg:text-base">
            Stop switching between multiple tools. Everything you need to run your business professionally, from invoicing to client relationships.
            </p>
            <Button asChild>
              <Link href="/login">   
                Try it for free
               </Link>
            </Button>
            <div className="flex items-center space-x-4 pt-4">
              <div className="flex -space-x-2">
                {/* Placeholder avatars */}
                <img className="inline-block h-10 w-10 rounded-full object-contain ring-2 ring-primary" src="https://www.bexoni.com/favicon.ico" alt="User 1"/>
                <img className="inline-block h-10 w-10 rounded-full object-contain ring-2 ring-primary" src="https://www.ndienuguscotland.org/favicon.ico" alt="User 2"/>
                <img className="inline-block h-10 w-10 rounded-full object-contain ring-2 ring-primary" src="https://www.lancefortes.com/favicon.ico" alt="User 4"/>
                <img className="inline-block h-10 w-10 rounded-full object-contain ring-2 ring-primary" src="https://www.foreversake.com/favicon.ico" alt="User 3"/>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-yellow-400">★★★★★</span> Loved by <span className="font-bold text-primary">100+</span> businesses
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image */}
          <div className="relative">
            <div className="relative transform rotate-12  hover:rotate-5 transition-transform duration-300 ease-in-out">
              <img
                src={heroImage}
                alt="Hero Dashboard"
                className="w-full h-auto border rounded-none shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))',
                  transform: 'perspective(1000px) rotateX(8deg) rotateY(-8deg) scale(1.4)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Mobile Layout: Text Top, Image Bottom */}
        <div className="md:hidden space-y-8">
          {/* Top Section: Text Content */}
          <div className="space-y-6 ">
            <h1 className="text-lg font-bold tracking-tight">
              From initial inquiry to lasting relationships -  manage invoicing, tracking, agreements, and continous client engagement for {" "}        
              <RotatingWordsSlideUp words={heroWords} className="text-primary" />
            </h1>
            <p className="text-sm">
            Stop switching between multiple tools. Everything you need to run your business professionally, from invoicing to client relationships.
            </p>
            <Button asChild>
              <Link href="/login">   
                Try it for free
               </Link>
            </Button>
            <div className="flex items-center justify-center space-x-4 pt-4">
              <div className="flex -space-x-2">
                {/* Placeholder avatars */}
                <img className="inline-block h-6 w-6 rounded-full object-contain ring-2 ring-primary" src="https://www.bexoni.com/favicon.ico" alt="User 1"/>
                <img className="inline-block h-6 w-6 rounded-full object-contain ring-2 ring-primary" src="https://www.ndienuguscotland.org/favicon.ico" alt="User 2"/>
                <img className="inline-block h-6 w-6 rounded-full object-contain ring-2 ring-primary" src="https://www.lancefortes.com/favicon.ico" alt="User 4"/>
                <img className="inline-block h-6 w-6 rounded-full object-contain ring-2 ring-primary" src="https://www.foreversake.com/favicon.ico" alt="User 3"/>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-yellow-400">★★★★★</span> Loved by <span className="font-bold text-primary">100+</span> businesses
              </div>
            </div>
          </div>

          {/* Bottom Section: Hero Image */}
          <div className="relative">
            <div className="relative transform rotate-6 hover:rotate-1 transition-transform duration-300 ease-in-out">
              <img
                src={heroImage}
                alt="Hero Dashboard"
                className="w-full h-auto rounded-none border border-primary shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))',
                  transform: 'perspective(1000px) rotateX(3deg) rotateY(-3deg)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Featured On Section */}
        <div className="mt-16 flex flex-col md:flex-row space-x-3 md:mt-24">
          <p className="text-sm text-center md:text-left items-center justify-center md:py-4 mb-4 md:mb-0 uppercase md:border-r-2 md:border-r-primary pr-3">Featured on</p>
          <div className="flex flex-wrap justify-center md:justify-left items-center gap-x-8 gap-y-4 md:gap-x-12">
            {/* Replace with actual logos */}
            <Button asChild variant="outline" className="font-medium border-y-2 border-y-primary">
              <Link href="https://starterstory.com" target="_blank">Wall Story</Link>
              </Button>
            <Button asChild variant="outline" className="font-medium border-y-2 border-y-primary">
              <Link href="https://tinylaunch.com" target="_blank">TinyLaunch</Link>
              </Button>
            <Button asChild variant="outline" className="font-medium border-y-2 border-y-primary">
              <Link href="https://producthunt.com" target="_blank">Product Hunt</Link>
              </Button>
          </div>
        </div>
      </div>
    </section>
  )
}