"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RotatingWordsProps {
    words: string[];
    className?: string; // For applying text styles like font size, color, weight from parent
  }
  
export function RotatingWordsSlideUp({ words, className }: RotatingWordsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
  
    useEffect(() => {
      if (!words || words.length === 0) return;
  
      const interval = setInterval(() => {
        setIsVisible(false);
        
        setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
          setIsVisible(true);
        }, 300); // Half of transition duration
      }, 3000); // Time each word is shown
  
      return () => clearInterval(interval);
    }, [words]);
  
    if (!words || words.length === 0) {
      return null;
    }
  
    const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, "");
    const estimatedWidth = `${longestWord.length * 0.65}em`;
    const currentWord = words[currentIndex];
  
    return (
      <div
        className={cn("relative inline-block align-bottom overflow-hidden", className)}
        style={{ 
          width: estimatedWidth,
          height: "1.2em"
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        <span
          className={cn(
            "inline-block transition-all duration-500 ease-in-out",
            isVisible 
              ? "transform translate-y-0 opacity-100" 
              : "transform -translate-y-full opacity-0"
          )}
        >
          {currentWord}
        </span>
      </div>
    );
  }