"use client";

import React from "react";

interface FeedbackSummaryCardProps {
  value: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string; 
}

export function FeedbackSummaryCard({
  value,
  title,
  subtitle,
  children,
  className,
}: FeedbackSummaryCardProps) {
  return (
    <div className={`border  border-primary bg-background/95 backdrop-blur-sm px-6 py-5 flex flex-col justify-between h-full min-h-[180px] ${className}`}>
      <div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-base font-medium  mb-1">{title}</div>
        {subtitle && (
          <div className="text-sm ">{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  );
}