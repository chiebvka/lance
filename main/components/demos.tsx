"use client";

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Demos() {
  const { resolvedTheme } = useTheme();
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  const mediaUrlLight = 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalvZQ7tg0PNqaV5zUDX7I06FbjMkvcBdEnmu8S';
  const mediaUrlDark = 'https://fwixzks0fh.ufs.sh/f/g1CtryXUYdalvZQ7tg0PNqaV5zUDX7I06FbjMkvcBdEnmu8S';

  const activeUrl = resolvedTheme === 'dark' ? mediaUrlDark : mediaUrlLight;

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

        <div className=" mx-auto border border-gray-200 bg-background">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="relative w-full h-[320px] sm:h-[420px] lg:h-[520px] flex items-center justify-center bg-muted/20">
              {(!isVideoUrl(activeUrl) && !imageFailed) || isGifUrl(activeUrl) ? (
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
              <h3 className="font-medium text-xl md:text-2xl mb-3">Financial overview</h3>
              <p className="text-muted-foreground mb-6 md:mb-8 max-w-prose">
                Bring your own bank. We connect to over 20 000+ banks in 33 countries across US, Canada, UK and Europe. Keep tabs on your expenses and income, and gain a clearer picture of your business's financial track record and current situation.
              </p>
              <ul className="space-y-3 text-sm md:text-base">
                {['Revenue', 'Burnrate', 'Expenses', 'Unified currency overview across all your accounts'].map((item) => (
                  <li key={item} className="flex items-center gap-3">
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