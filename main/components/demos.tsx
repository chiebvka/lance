"use client";

import React from 'react';
import { PlusCircle, FileText, Clock, ListVideo, LayoutGrid, Users, Settings, Sparkles, Eye, Flame, TrendingUp, Film, Mic2 } from 'lucide-react';
// Assuming ShadCN Button if you want to use it, otherwise style regular buttons
// import { Button } from "@/components/ui/button";

// Helper component for sidebar items
const SidebarItem = ({ icon: Icon, label, isActive = false }: { icon: React.ElementType, label: string, isActive?: boolean }) => (
  <div className={`flex items-center space-x-3 px-4 py-2.5  cursor-pointer transition-colors duration-150 ${isActive ? 'bg-gray-200 text-gray-800 font-semibold' : ' hover:bg-gray-100 hover:text-gray-700'}`}>
    <Icon className={`w-5 h-5 ${isActive ? '' : ''}`} />
    <span>{label}</span>
  </div>
);

// Helper component for template cards
const TemplateCard = ({
  icon: Icon,
  title,
  description,
  tags,
  buttonText = "Use Template",
  isMainFeature = false,
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
  tags: { text: string; icon?: React.ElementType; colorClass?: string }[];
  buttonText?: string;
  isMainFeature?: boolean;
}) => (
  <div className={`p-5 md:p-6  ${isMainFeature ? 'border-2 border-emerald-200' : ' hover:shadow-md transition-shadow'}`}>
    <div className="flex items-start mb-3">
      {Icon && <Icon className={`w-6 h-6 mr-3 ${isMainFeature ? 'text-emerald-600' : ''}`} />}
      <div>
        <h3 className={`font-semibold ${isMainFeature ? 'text-lg ' : 'text-md '}`}>{title}</h3>
        {isMainFeature && <span className="text-xs bg-emerald-200  px-2 py-0.5 rounded-full font-medium ml-1">NEW</span>}
      </div>
    </div>
    <p className={`text-sm mb-3 ${isMainFeature ? '' : ''}`}>{description}</p>
    <div className="flex items-center space-x-2 mb-4 text-xs">
      {tags.map((tag, index) => (
        <div key={index} className={`flex items-center space-x-1 px-2 py-1 rounded-full ${tag.colorClass || (isMainFeature ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700')}`}>
          {tag.icon && <tag.icon className="w-3.5 h-3.5" />}
          <span>{tag.text}</span>
        </div>
      ))}
    </div>
    <div className="flex justify-between items-center">
      <button 
        type="button"
        className={`px-4 py-2  text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isMainFeature ? 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-400'}`}
      >
        {buttonText}
      </button>
      {!isMainFeature && <Eye className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />}
    </div>
  </div>
);

export default function Demos() {
  // HSL color for the shadow: hsl(278, 29%, 45%)
  const shadowStyle = `shadow-[8px_8px_0px_0px_hsla(278,29%,45%,1),0_0_20px_hsla(278,29%,45%,0.15)]`; // Thick direct shadow + softer glow

  return (
    <section className="py-12 md:py-20 ">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold ">
            Create <span className="text-green-500">Viral Videos</span> in Seconds
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
            Stop spending hours on content creation. Use our Content Studio -packed with proven viral templates- to create engaging videos that drive <span className="font-semibold text-green-600">real results</span>.
          </p>
        </div>

        <div className={`  ${shadowStyle} overflow-hidden max-w-5xl mx-auto`}>
          <div className="flex flex-col border-2 border-bexoni  md:flex-row min-h-[600px]">
            {/* Left Sidebar */}
            <aside className="w-full md:w-64  p-5 md:p-6 border-r border-gray-200 flex flex-col">
              <div className="flex items-center space-x-2 mb-6">
                <ListVideo className="w-7 h-7 " />
                <span className="font-semibold text-xl">post bridge</span>
              </div>
              <button type="button" className="w-full flex items-center justify-center space-x-2 bg-bexoni  font-semibold py-2.5 px-4  hover:bg-bexoni/80 transition-colors duration-150 mb-6">
                <PlusCircle className="w-5 h-5" />
                <span>Create post</span>
              </button>
              
              <div className="mb-6">
                <h3 className="text-xs uppercase font-semibold mb-2 px-1 flex justify-between items-center">
                  Content
                  <PlusCircle className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                </h3>
                <nav className="space-y-1">
                  <SidebarItem icon={FileText} label="New post" />
                  <SidebarItem icon={Clock} label="Scheduled" />
                  <SidebarItem icon={ListVideo} label="Posts" />
                  <SidebarItem icon={LayoutGrid} label="Studio" isActive={true} />
                </nav>
              </div>

              <div className="mb-auto">
                <h3 className="text-xs uppercase font-semibold mb-2 px-1">Configuration</h3>
                <nav className="space-y-1">
                  <SidebarItem icon={Users} label="Accounts" />
                </nav>
              </div>

              <div className="border-t border-bexoni pt-4 mt-4 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center text-sm font-semibold text-yellow-800">
                  J
                </div>
                <div>
                  <p className="text-sm font-semibold">jack friks</p>
                  <p className="text-xs">Pro Plan</p>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-8 lg:p-10">
              <h2 className="text-2xl font-semibold mb-8">Content Studio</h2>
              
              <TemplateCard 
                title="AI UGC Video Creator"
                description="Create authentic UGC-style videos in seconds using our AI-powered templates. Perfect for product demos, testimonials, and viral marketing content."
                tags={[
                  { text: 'AI-Powered', icon: Sparkles },
                  { text: 'SUPER HOT', icon: Flame, colorClass: 'bg-red-100 text-red-700' },
                  { text: 'Infinite views', icon: TrendingUp, colorClass: 'bg-blue-100 text-blue-700' }
                ]}
                buttonText="Try AI UGC Creator →"
                isMainFeature={true}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <TemplateCard 
                  icon={LayoutGrid}
                  title="2x2 Grid Video"
                  description="Create viral videos with this 4 image grid format (tested & proven to 🔥)"
                  tags={[{ text: 'Trending', icon: TrendingUp }, { text: '20M+ views'}]}
                />
                <TemplateCard 
                  icon={Film}
                  title="Single Fade-In Video"
                  description="Simple format with billions of views - use your imagination to make a viral banger (we will do the editing)"
                  tags={[{ text: 'Trending', icon: TrendingUp }, { text: '500M+ views'}]}
                />
                <TemplateCard 
                  icon={Mic2} // Using Mic2 as a placeholder for AI UGC icon
                  title="AI UGC Creator"
                  description="Create authentic UGC-style videos in seconds using our AI-powered templates. Perfect for product demos, testimonials, and viral marketing content."
                  tags={[{ text: 'Trending', icon: TrendingUp }, { text: '1B+ views'}]}
                />
              </div>
              
              <div className="text-right mt-10">
                <button type="button" className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 ml-auto">
                  <Settings className="w-3.5 h-3.5" /> 
                  <span>Feedback</span>
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    </section>
  );
}