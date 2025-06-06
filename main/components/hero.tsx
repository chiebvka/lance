"use client"
import React from 'react'
import { CheckCircle, PlayCircle } from 'lucide-react' // Assuming lucide-react for icons
import { RotatingWords } from './rotating-words';
import { Button } from './ui/button';

// Placeholder for social media icons - you might use a library or actual SVGs
const SocialIcon = ({ platform, size = 6 }: { platform: string, size?: number }) => (
  <div className={`w-${size} h-${size} bg-gray-300 rounded-full flex items-center justify-center text-xs`}>{platform.charAt(0).toUpperCase()}</div>
);

export default function Hero() {
    const heroWords = [
        'Invoices',
        'Receipts',
        'Links',
        'Projects',
        'Service Agreements',
        'Client Feedback'
    ];

  return (
    <section className="w-full border-2 border-bexoni py-12 md:py-20 lg:py-24 ">
      <div className="container mx-auto px-4">
        {/* Watch Demo Video */}
        <div className="mb-8 text-center md:text-left">
          <a href="#" className="inline-flex items-center text-primary hover:text-bexoni">
            <PlayCircle className="w-6 h-6 mr-2" />
            Watch demo video
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Column: Text Content */}
          <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
              The simplest and most powerful way to manage your{" "}
              <RotatingWords words={heroWords} className="text-bexoni" />
            </h1>
            <p className="text-lg md:text-xl">
              The simplest way to post and grow on all platforms. Built for creators and small teams without the ridiculous price tag.
            </p>
            <ul className="space-y-3">
              {[
                'Post to all major platforms in one click',
                'Schedule content for the perfect posting time',
                'Customize content for each platform',
                'Generate viral videos using our studio templates',
              ].map((item, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-bexoni flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button className="font-semibold py-3 px-8 rounded-lg text-lg shadow-md transition duration-150 ease-in-out">
              Try it for free
            </Button>
            <div className="flex items-center space-x-4 pt-4">
              <div className="flex -space-x-2">
                {/* Placeholder avatars */}
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white" src="https://via.placeholder.com/40/C4D7FE/4F46E5?text=U1" alt="User 1"/>
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white" src="https://via.placeholder.com/40/A3BFFA/4F46E5?text=U2" alt="User 2"/>
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white" src="https://via.placeholder.com/40/FBBF77/4F46E5?text=U3" alt="User 3"/>
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white" src="https://via.placeholder.com/40/D9F99D/4F46E5?text=U4" alt="User 4"/>
              </div>
              <div className="text-sm">
                <span className="font-semibold">★★★★★</span> Loved by <span className="font-bold">7643</span> creators
              </div>
            </div>
          </div>

          {/* Right Column: Image and Platform Icons */}
          <div className="relative mt-10 md:mt-0">
            <div className="relative aspect-[4/3] max-w-lg mx-auto">
              {/* Main image container - replace with actual image composition later */}
              <div className="bg-gray-100 rounded-xl shadow-2xl p-6 flex flex-wrap gap-4 items-center justify-center relative">
                {/* Placeholder social media logos - ideally these are actual logo images/SVGs */}
                <div className="absolute top-4 left-4 transform -rotate-12 bg-white p-3 rounded-lg shadow-lg"><SocialIcon platform="X" size={16}/></div>
                <div className="absolute top-1/4 right-4 transform rotate-6 bg-white p-3 rounded-lg shadow-lg"><SocialIcon platform="LI" size={16}/></div>
                <div className="absolute bottom-1/4 left-1/4 transform -rotate-3 bg-white p-3 rounded-lg shadow-lg"><SocialIcon platform="IG" size={20}/></div>
                <div className="absolute bottom-8 right-1/3 transform rotate-3 bg-white p-3 rounded-lg shadow-lg"><SocialIcon platform="BS" size={14}/></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-3 rounded-lg shadow-lg"><SocialIcon platform="TT" size={16}/></div>
                
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/3 bg-white px-6 py-3 rounded-full shadow-xl border border-gray-200 flex items-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="font-semibold text-gray-700">Scheduled to all platforms</span>
                </div>
              </div>
            </div>
             {/* Smaller platform icons */}
            <div className="mt-12 flex justify-center items-center space-x-3 md:space-x-4">
              <SocialIcon platform="X" />
              <SocialIcon platform="IG" />
              <SocialIcon platform="LI" />
              <SocialIcon platform="FB" />
              <SocialIcon platform="TT" />
              <SocialIcon platform="YT" />
              <SocialIcon platform="BS" />
              <SocialIcon platform="TH" />
              <SocialIcon platform="PI" />
            </div>
          </div>
        </div>

        {/* Featured On Section */}
        <div className="mt-16 md:mt-24 text-center">
          <p className="text-sm uppercase tracking-wider mb-6">Featured on</p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 md:gap-x-12">
            {/* Replace with actual logos */}
            <span className="font-medium ">Starter Story</span>
            <span className="font-medium ">TinyLaunch</span>
            <span className="font-medium ">Product Hunt</span>
            <span className="font-medium ">X</span>
          </div>
        </div>
      </div>
    </section>
  )
}