"use client";

import React, { useEffect, useRef, useState } from 'react';

// Placeholder for UI cards. In a real app, these would be more detailed.
const UICard = ({
  type,
  title,
  timestamp,
  content,
  bgColorClass = "bg-white",
  accentColor = "#CCCCCC",
  className = "",
  rotation = 0,
  zIndex = 0,
  scale = 1,
  width = "w-48", // Default width for smaller cards
  height = "h-auto",
  isLargeImage = false,
}: {
  type: string;
  title?: string; // For card type e.g. IMAGE, LINK, TEXT
  timestamp?: string;
  content: React.ReactNode;
  bgColorClass?: string;
  accentColor?: string;
  className?: string;
  rotation?: number;
  zIndex?: number;
  scale?: number;
  width?: string;
  height?: string;
  isLargeImage?: boolean;
}) => (
  <div
    className={`absolute p-3 md:p-4 rounded-lg shadow-xl ${bgColorClass} ${width} ${height} ${className}`}
    style={{
      transform: `rotate(${rotation}deg) scale(${scale})`,
      zIndex: zIndex,
      borderLeft: `4px solid ${accentColor}`,
    }}
  >
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs font-bold uppercase" style={{ color: accentColor }}>
        {title || type}
      </span>
      {timestamp && <span className="text-xs text-gray-400">{timestamp}</span>}
    </div>
    {isLargeImage ? (
      <div className="w-full h-40 md:h-56 bg-gray-200 rounded overflow-hidden">
        {content}
      </div>
    ) : (
      <div className="text-sm text-gray-700 leading-tight">{content}</div>
    )}
    {type === "TEXT" && typeof content === 'string' && (
      <span className="text-xs text-gray-400 mt-1 block">{content.length} characters</span>
    )}
  </div>
);

// Basic Phone Mockup
const PhoneMockup = ({ className = "", screenContent }: { className?: string, screenContent?: React.ReactNode }) => (
  <div
    className={`relative mx-auto border-gray-700 bg-gray-800 border-[8px] md:border-[10px] rounded-[2rem] md:rounded-[2.5rem] h-[400px] w-[200px] md:h-[480px] md:w-[240px] shadow-2xl ${className}`}
  >
    <div className="w-[100px] md:w-[130px] h-[10px] md:h-[12px] bg-gray-700 top-0 rounded-b-[0.8rem] md:rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
    <div className="h-[28px] md:h-[32px] w-[2px] bg-gray-700 absolute -left-[10px] md:-left-[12px] top-[60px] md:top-[72px] rounded-l-lg"></div>
    <div className="h-[28px] md:h-[32px] w-[2px] bg-gray-700 absolute -left-[10px] md:-left-[12px] top-[100px] md:top-[124px] rounded-l-lg"></div>
    <div className="h-[40px] md:h-[46px] w-[2px] bg-gray-700 absolute -right-[10px] md:-right-[12px] top-[80px] md:top-[100px] rounded-r-lg"></div>
    <div className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden w-full h-full bg-white">
      {screenContent || <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">Screen</div>}
    </div>
  </div>
);

// Main Galleria Component
export default function Galleria() {
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const [isVisible1, setIsVisible1] = useState(false);
  const [isVisible2, setIsVisible2] = useState(false);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15, // Trigger when 15% of the element is visible
    };

    const observers: IntersectionObserver[] = [];

    const createObserver = (ref: React.RefObject<HTMLDivElement | null>, setIsVisible: React.Dispatch<React.SetStateAction<boolean>>) => {
      const currentElement = ref.current;
      if (!currentElement) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);
      observer.observe(currentElement);
      observers.push(observer);
    };

    createObserver(section1Ref, setIsVisible1);
    createObserver(section2Ref, setIsVisible2);

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  const baseTransition = "transition-all duration-1000 ease-out";
  const initialStyle = "opacity-0 translate-y-10";
  const visibleStyle = "opacity-100 translate-y-0";

  return (
    <div className=" py-10 md:py-16 overflow-x-hidden">
      {/* Section 1: Limitless Clipboard */}
      <section
        ref={section1Ref}
        className={`container mx-auto px-4 py-12 md:py-20 ${baseTransition} ${
          isVisible1 ? visibleStyle : initialStyle
        }`}
      >
        <div className="relative max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto aspect-[16/10] rounded-lg shadow-2xl overflow-hidden">
          <img 
            src="/display.jpeg" 
            alt="Limitless Clipboard Display Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 p-6 md:p-10 flex flex-col justify-center items-start text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 shadow-sm">
              Limitless clipboard
            </h2>
            <p className="text-md sm:text-lg md:text-xl text-gray-200 max-w-md md:max-w-lg shadow-sm">
              No matter how much you copy, Paste keeps every item safe, organized, and ready when you need it.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Peak Performance */}
      <section
        ref={section2Ref}
        className={`container mx-auto px-4 py-12 md:py-20 ${baseTransition} ${
          isVisible2 ? visibleStyle : initialStyle
        }`}
      >
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left: Phone Mockup and Text */}
          <div className={`order-2 md:order-1 ${baseTransition} delay-200 ${isVisible2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <PhoneMockup 
              className="mb-8" 
              screenContent={
                <img 
                  src="/phone.jpeg" 
                  alt="Phone Screen Display"
                  className="w-full h-full object-cover"
                />
              } 
            />
            <p className="text-md md:text-lg max-w-md mx-auto md:mx-0 text-center md:text-left">
              With improved performance and stability across every device, Paste helps you work faster and stay focused on what matters.
            </p>
          </div>

          {/* Right: Text and Large Image Card */}
          <div className={`order-1 md:order-2 text-center md:text-left ${baseTransition} delay-200 ${isVisible2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="relative w-full max-w-sm md:max-w-md mx-auto md:mx-0 rounded-xl shadow-2xl overflow-hidden aspect-[4/3]">
              <img 
                src="/screen.jpeg" 
                alt="Peak Performance Screen Background" 
                className="w-full h-full object-cover transform rotate-3 scale-110" // scale-110 to ensure coverage with rotation
              />
              <div className="absolute inset-0 bg-black bg-opacity-10 p-6 md:p-8 flex flex-col justify-start items-start text-left transform -rotate-3">
                 {/* Counter-rotate text if image is rotated, or style text to appear straight */}
                <div className="transform rotate-3 w-full">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 md:mb-3 shadow-sm">
                    Peak performance
                  </h2>
                  <p className="text-xl md:text-2xl text-blue-300 font-medium shadow-sm">
                    Less disk space
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}