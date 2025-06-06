"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RotatingWordsProps {
  words: string[];
  className?: string; // For applying text styles like font size, color, weight from parent
}

export function RotatingWords({ words, className }: RotatingWordsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatingLetters, setAnimatingLetters] = useState<boolean[]>([]);

  useEffect(() => {
    if (!words || words.length === 0) return;

    const currentWord = words[currentIndex];
    setAnimatingLetters(new Array(currentWord.length).fill(false));

    currentWord.split('').forEach((_, letterIndex) => {
      setTimeout(() => {
        setAnimatingLetters(prev => {
          const newState = [...prev];
          newState[letterIndex] = true;
          return newState;
        });
      }, letterIndex * 100); // Delay for each letter to start animation
    });

    const totalAnimationTime = currentWord.length * 100 + 1500; // Animation + pause
    const timeout = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, totalAnimationTime);

    return () => clearTimeout(timeout);
  }, [currentIndex, words]);

  if (!words || words.length === 0) {
    return null; // Or some fallback UI
  }

  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, "");
  const currentWord = words[currentIndex];

  // Estimate width based on longest word. Adjust multiplier as needed for your font.
  // Using ch unit for character width might be more accurate if available/desired.
  const estimatedWidth = `${longestWord.length * 0.65}em`;

  return (
    <div
      className={cn("relative h-[1.2em] overflow-hidden inline-block align-bottom", className)} // Use 1.2em for height to contain letters
      style={{ width: estimatedWidth }}
      aria-live="polite"
      aria-atomic="true"
    >
      {currentWord.split('').map((letter, letterIndex) => (
        <span
          key={`${currentIndex}-${letterIndex}-${letter}`}
          className={cn(
            "inline-block transition-all duration-500 ease-out", // Ensure parent text styles are inherited or passed via className
            animatingLetters[letterIndex]
              ? "transform translate-y-0 opacity-100"
              : "transform -translate-y-full opacity-0" // Starts from top (above the line)
          )}
          style={{
            transitionDelay: `${letterIndex * 50}ms`, // Staggered animation for each letter
            // Fall-from-top cubic bezier
            transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" 
          }}
        >
          {letter === " " ? "\u00A0" : letter} {/* Render non-breaking space for spaces */}
        </span>
      ))}
    </div>
  );
}
