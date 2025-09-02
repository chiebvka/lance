"use client";

import React, { useState } from 'react';
import { CheckCircle, FileText, Users, Briefcase, MessageSquare, RefreshCw, Clock, Rocket, BarChart2 } from 'lucide-react'; // Assuming lucide-react for icons

interface FeatureItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  gifPlaceholder: string; // Text for the GIF placeholder
  mediaUrl?: string; // CDN URL for GIF/video
}

const features: FeatureItem[] = [
  {
    id: 'invoices',
    name: 'Invoices',
    description: 'Manage and send professional invoices to your clients with ease and track payment status.',
    icon: FileText,
    gifPlaceholder: 'Invoice Management GIF/Video'
  },
  {
    id: 'receipts',
    name: 'Receipts',
    description: 'Generate and store digital receipts for all transactions, keeping your records organized.',
    icon: FileText,
    gifPlaceholder: 'Receipt Generation GIF/Video',
    mediaUrl: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalvZQ7tg0PNqaV5zUDX7I06FbjMkvcBdEnmu8S'
  },
  {
    id: 'feedback',
    name: 'Feedback Form',
    description: 'Collect valuable client feedback through customizable forms to improve your services.',
    icon: MessageSquare,
    gifPlaceholder: 'Feedback Form Showcase GIF/Video'
  },
  {
    id: 'clientMgmt',
    name: 'Client Management',
    description: 'Keep all client information, communication logs, and project details in one central place.',
    icon: Users,
    gifPlaceholder: 'Client Management System GIF/Video'
  },
  {
    id: 'serviceAgreements',
    name: 'Service Agreements',
    description: 'Create, send, and manage digital service agreements and contracts efficiently.',
    icon: Briefcase,
    gifPlaceholder: 'Service Agreements Workflow GIF/Video'
  },
  {
    id: 'projectUpdates',
    name: 'Project Updates',
    description: 'Share progress updates with clients and your team, ensuring everyone is on the same page.',
    icon: RefreshCw,
    gifPlaceholder: 'Project Updates Showcase GIF/Video'
  },
];

const StatCard = ({ icon: Icon, value, label, subLabel, colorClass }: {
  icon: React.ElementType;
  value: string;
  label: string;
  subLabel: string;
  colorClass: string;
}) => (
  <div className={`flex-1 p-4 md:p-6 rounded-lg shadow-lg flex items-center space-x-3 md:space-x-4 ${colorClass}`}>
    <Icon className="w-8 h-8 md:w-10 md:h-10 text-opacity-80" />
    <div>
      <p className="text-2xl md:text-3xl font-bold">{value}</p>
      <p className="text-sm text-gray-700 text-opacity-90">{label}</p>
      <p className="text-xs text-gray-500 text-opacity-80">{subLabel}</p>
    </div>
  </div>
);

export default function Preview() {
  const [activeFeature, setActiveFeature] = useState<FeatureItem>(features[0]);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  const isGifUrl = (url: string) => /\.gif($|\?)/i.test(url);
  const isVideoUrl = (url: string) => /\.(mp4|webm|mov)($|\?)/i.test(url);

  React.useEffect(() => {
    setImageFailed(false);
  }, [activeFeature]);

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-10 md:mb-16 max-w-2xl mx-auto">
          <h1 className="text-lg md:text-3xl lg:text-4xl font-bold ">
            Grow your social reach with <span className="text-bexoni">less effort</span> for <span className="text-bexoni">less money</span>
          </h1>
          <p className="mt-4 text-xs md:text-sm lg:text-base text-muted-foreground">
            Using our advanced features to streamline your workflow...
          </p>
        </div>

        {/* Main Content: Tabs and GIF Display */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 min-h-[400px] md:min-h-[500px]">
          {/* Left Column: Feature List (Tabs) */}
          <div className="md:col-span-1 space-y-2 pr-4 md:border-r md:border-bexoni">
            {features.map((feature) => {
              const isActive = activeFeature.id === feature.id;
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature)}
                  className={`w-full text-left p-4  transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 group ${
                    isActive
                      ? 'bg-purple-50 border-2 border-bexoni shadow-md'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    {isActive ? 
                      <CheckCircle className="w-5 h-5 mr-3 text-bexoni flex-shrink-0" /> : 
                      <feature.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-bexoni' : 'text-primary group-hover:text-gray-700'} flex-shrink-0`} />
                    }
                    <h3 className={`font-semibold ${isActive ? 'text-bexoni' : 'text-primary group-hover:text-gray-800'}`}>{feature.name}</h3>
                  </div>
                  {isActive && (
                    <p className="mt-2 text-sm text-gray-600 pl-8">
                      {feature.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column: GIF/Video Display */}
          <div className="md:col-span-2 bg-gray-100 rounded-xl shadow-inner flex items-center justify-center p-8 min-h-[300px] md:min-h-full">
            {activeFeature.mediaUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                {(!isVideoUrl(activeFeature.mediaUrl) && !imageFailed) || isGifUrl(activeFeature.mediaUrl) ? (
                  <img
                    src={activeFeature.mediaUrl}
                    alt={`${activeFeature.name} media`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full rounded-lg shadow-lg object-contain"
                    style={{ maxHeight: '400px' }}
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <video
                    key={activeFeature.id}
                    src={activeFeature.mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    crossOrigin="anonymous"
                    className="max-w-full max-h-full rounded-lg shadow-lg object-contain"
                    style={{ maxHeight: '400px' }}
                  />
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xl font-semibold text-gray-700">{activeFeature.gifPlaceholder}</p>
                <p className="text-sm text-gray-500 mt-2">Content for {activeFeature.name} will be displayed here.</p>
                <div className="mt-6 w-full h-64 bg-gray-300 rounded-lg flex items-center justify-center animate-pulse">
                  <p className="text-gray-500">Loading GIF/Video...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Stats Section */}
        <div className="mt-16 md:mt-24 pt-10 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <StatCard 
              icon={Clock} 
              value="3h 4m" 
              label="Weekly Time Saved" 
              subLabel="Per active user" 
              colorClass="bg-green-50 text-green-700"
            />
            <StatCard 
              icon={Rocket} 
              value="13 entire days" 
              label="Yearly Time Saved" 
              subLabel="Based on weekly average" 
              colorClass="bg-blue-50 text-blue-700"
            />
            <StatCard 
              icon={BarChart2} 
              value="202,851" 
              label="Posts Published" 
              subLabel="+69% engagement" 
              colorClass="bg-red-50 text-red-700"
            />
          </div>
        </div>
      </div>
    </section>
  );
}