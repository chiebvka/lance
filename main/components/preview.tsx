"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Rocket, 
  BarChart2,
  FolderKanban,
  Receipt,
  ReceiptText,
  MessagesSquare,
  BrickWall,
  Split,
  CalendarCheck,
} from 'lucide-react'; // Assuming lucide-react for icons
import { useTheme } from 'next-themes';

interface FeatureItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  gifPlaceholder: string; // Text for the GIF placeholder
  mediaUrlLight?: string; // CDN URL for light mode GIF/video
  mediaUrlDark?: string; // CDN URL for dark mode GIF/video
}

const features: FeatureItem[] = [
  {
    id: 'invoices',
    name: 'Invoices',
    description: 'Manage and send professional invoices to your clients with ease and track payment status.',
    icon: Receipt,
    gifPlaceholder: 'Invoice Management GIF/Video',
    mediaUrlLight: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdaloqdIcUtNS4VUITP3CrtpHjw5yDhg7G8Knfi9',
    mediaUrlDark: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalFGOQfEyO0PCjZfaWMUiLY2oz4h8ENslA9bSB'
  },
  {
    id: 'receipts',
    name: 'Receipts',
    description: 'Generate and store digital receipts for all transactions, keeping your records organized.',
    icon: ReceiptText,
    gifPlaceholder: 'Receipt Generation GIF/Video',
    mediaUrlLight: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalGZDH5A4G6vKMBc7jnSCz2dEZpQtOghsaDqX9',
    mediaUrlDark: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalvZQ7tg0PNqaV5zUDX7I06FbjMkvcBdEnmu8S'
  },
  {
    id: 'feedback',
    name: 'Feedback Form',
    description: 'Collect valuable client feedback through customizable forms to improve your services.',
    icon: MessagesSquare,
    gifPlaceholder: 'Feedback Form Showcase GIF/Video',
    mediaUrlLight: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalzdU88V9Kb2ZVmS0XDQyx1pMYUfg6CrdsaGB5',
    mediaUrlDark: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdala6YSWwe5bDN6EOxVYX0m2feFkncBs7j3Lpug'
  },
  {
    id: 'wall',
    name: 'Walls',
    description: 'Create, send, and manage digital service agreements and contracts efficiently.',
    icon: BrickWall,
    gifPlaceholder: 'Service Agreements Workflow GIF/Video',
    mediaUrlLight: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalGQ709r4G6vKMBc7jnSCz2dEZpQtOghsaDqX9',
    mediaUrlDark: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalMnN9bVmd7PZECBwRWjxVT0t6hYMS4po2kLbi'
  },
  {
    id: 'paths',
    name: 'Paths',
    description: 'Create, send, and manage digital service agreements and contracts efficiently.',
    icon: Split,
    gifPlaceholder: 'Paths Workflow GIF/Video',
    mediaUrlLight: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalUMrPwEp1xo83NBPKislcvQEqaT7nYWruI0A6',
    mediaUrlDark: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalGZkkEO4G6vKMBc7jnSCz2dEZpQtOghsaDqX9'
  },
  {
    id: 'projectUpdates',
    name: 'Project Updates',
    description: 'Share progress updates with clients and your team, ensuring everyone is on the same page.',
    icon: FolderKanban,
    gifPlaceholder: 'Project Updates Showcase GIF/Video',
    mediaUrlLight: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalEFk5MFWz1tQwX0JNF6KcaSlyfbP3LCsve8g7',
    mediaUrlDark: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalb6AtmWlplS6xJwfnDrFWdsIHeh7XLYzK42T0'
  },
  // {
  //   id: 'clientMgmt',
  //   name: 'Client Management',
  //   description: 'Keep all client information, communication logs, and project details in one central place.',
  //   icon: Users,
  //   gifPlaceholder: 'Client Management System GIF/Video',
  //   mediaUrlLight: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalvZQ7tg0PNqaV5zUDX7I06FbjMkvcBdEnmu8S',
  //   mediaUrlDark: 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalvZQ7tg0PNqaV5zUDX7I06FbjMkvcBdEnmu8S'
  // },
];

const StatCard = ({ icon: Icon, value, label, subLabel, colorClass }: {
  icon: React.ElementType;
  value: string;
  label: string;
  subLabel: string;
  colorClass: string;
}) => (
  <div className={`flex-1 p-4 md:p-6 rounded-none shadow-lg flex items-center space-x-3 md:space-x-4 ${colorClass}`}>
    <Icon className="w-8 h-8 md:w-10 md:h-10 text-opacity-80" />
    <div>
      <p className="text-lg md:text-3xl font-bold">{value}</p>
      <p className="text-xs md:text-sm text-gray-700 text-opacity-90">{label}</p>
      <p className="text-xs md:text-sm text-gray-500 text-opacity-80">{subLabel}</p>
    </div>
  </div>
);

export default function Preview() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeFeature, setActiveFeature] = useState<FeatureItem>(features[0]);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  const isGifUrl = (url: string) => /\.gif($|\?)/i.test(url);
  const isVideoUrl = (url: string) => /\.(mp4|webm|mov)($|\?)/i.test(url);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeUrl = mounted
    ? (resolvedTheme === 'dark'
        ? (activeFeature.mediaUrlDark || activeFeature.mediaUrlLight)
        : (activeFeature.mediaUrlLight || activeFeature.mediaUrlDark))
    : undefined;

  React.useEffect(() => {
    setImageFailed(false);
  }, [activeFeature, activeUrl]);

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
          <div className="md:col-span-2 bg-lightCard dark:bg-darkCard rounded-none shadow-inner flex items-center justify-center p-8 min-h-[300px] md:min-h-full">
            {!activeUrl ? (
              <div className="w-full h-full flex items-center justify-center animate-pulse">
                <div className="w-3/4 h-3/4 bg-muted rounded" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {(!isVideoUrl(activeUrl) && !imageFailed) || isGifUrl(activeUrl) ? (
                  <img
                    key={activeUrl}
                    src={activeUrl}
                    alt={`${activeFeature.name} media`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full rounded-none shadow-lg object-contain"
                    style={{ maxHeight: '400px' }}
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <video
                    key={activeUrl}
                    src={activeUrl}
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
            )}
          </div>
        </div>

        {/* Bottom Stats Section */}
        <div className="mt-16 md:mt-24 pt-10 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <StatCard 
              icon={Clock} 
              value="4h 27m" 
              label="Weekly Time Saved" 
              subLabel="Per active user" 
              colorClass="bg-green-50 text-green-700"
            />
            <StatCard 
              icon={CalendarCheck} 
              value="10 entire days" 
              label="Yearly Time Saved" 
              subLabel="Based on weekly average" 
              colorClass="bg-blue-50 text-blue-700"
            />
            <StatCard 
              icon={BarChart2} 
              value="8,851" 
              label="Operations Managed" 
              subLabel="+69% Increased Productivity" 
              colorClass="bg-red-50 text-red-700"
            />
          </div>
        </div>
      </div>
    </section>
  );
}