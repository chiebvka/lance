"use client";

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Demos() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  const mediaUrlLight = 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalr1Dqipb169hY57pVFn2ABom0RXGCZjWJLuSQ';
  const mediaUrlDark = 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalGtmDjs4G6vKMBc7jnSCz2dEZpQtOghsaDqX9';

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeUrl = mounted ? (resolvedTheme === 'dark' ? mediaUrlDark : mediaUrlLight) : undefined;

  const isGifUrl = (url: string) => /\.gif($|\?)/i.test(url);
  const isVideoUrl = (url: string) => /\.(mp4|webm|mov)($|\?)/i.test(url);

  useEffect(() => {
    setImageFailed(false);
  }, [activeUrl]);

  return (
    <section className="py-12 md:py-20 ">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-lg md:text-3xl lg:text-4xl font-bold ">
            Quick <span className="text-bexoni">actions</span> in Seconds
          </h1>
          <p className="mt-4 text-xs md:text-sm lg:text-base max-w-2xl mx-auto">
            Perform quick actions on existing content, tasks and projects and have customers and clients updated <span className="font-semibold text-bexoni">in seconds</span>.
          </p>
        </div>

        <div className=" mx-auto border shadow-md bg-lightCard dark:bg-darkCard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="relative w-full h-[320px] sm:h-[420px] lg:h-[520px] flex items-center justify-center bg-muted/20">
              {!activeUrl ? (
                <div className="w-full h-full flex items-center justify-center animate-pulse">
                  <div className="w-3/4 h-3/4 bg-muted rounded" />
                </div>
              ) : ((!isVideoUrl(activeUrl) && !imageFailed) || isGifUrl(activeUrl)) ? (
                <img
                  src={activeUrl}
                  alt="Demo media"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain"
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
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
              <h3 className="font-medium text-xl md:text-2xl text-primary mb-3">Dashboard overview</h3>
              <p className="text-muted-foreground mb-6 md:mb-8 max-w-prose">
                Gain quick insights and perform quick actions on existing content, tasks and projects and have customers and clients updated in seconds.
              </p>
              <ul className="space-y-3 text-sm md:text-base">
                {['Upcoming due dates', 'Invoice Ratings', 'Feedback Ratings', 'Recent customer Activities'].map((item) => (
                  <li key={item} className="flex text-primary items-center gap-3">
                    <Check className="w-5 h-5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}