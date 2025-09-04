
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RotatingWordsProps {
  words: string[];
  className?: string;
}

export function RotatingWord({ words, className }: RotatingWordsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;

    const currentWord = words[currentIndex];
    let timeout: NodeJS.Timeout;

    if (isDeleting) {
      // Deleting characters
      timeout = setTimeout(() => {
        setDisplayText(currentWord.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
        
        if (charIndex === 0) {
          setIsDeleting(false);
          setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
        }
      }, 50); // Fast deletion speed
    } else {
      // Typing characters
      timeout = setTimeout(() => {
        setDisplayText(currentWord.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
        
        if (charIndex === currentWord.length - 1) {
          setIsComplete(true);
          // Pause before starting to delete
          setTimeout(() => {
            setIsComplete(false);
            setIsDeleting(true);
          }, 2000); // Pause duration
        }
      }, 100); // Typing speed
    }

    return () => clearTimeout(timeout);
  }, [currentIndex, charIndex, isDeleting, words]);

  // Reset char index when switching words
  useEffect(() => {
    setCharIndex(0);
    setDisplayText("");
  }, [currentIndex]);

  if (!words || words.length === 0) {
    return null;
  }

  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, "");
  const estimatedWidth = `${longestWord.length * 0.65}em`;

  return (
    <div
      className={cn("relative inline-block align-bottom", className)}
      style={{ 
        width: estimatedWidth,
        minHeight: "1.2em"
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="inline-block">
        {displayText}
        <span 
          className={cn(
            "inline-block w-0.5 h-[1em] bg-current ml-1 animate-pulse",
            isComplete && "opacity-100",
            !isComplete && "opacity-60"
          )}
          style={{
            animation: isComplete ? "none" : "pulse 1.5s infinite"
          }}
        />
      </span>
    </div>
  );
}