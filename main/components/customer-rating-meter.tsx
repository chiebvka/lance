"use client"

import React from 'react';
import { getRatingCategory } from '@/logic/customer-rating';

interface CustomerRatingMeterProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function CustomerRatingMeter({ 
  rating, 
  size = 'sm', 
  showLabel = false 
}: CustomerRatingMeterProps) {
  const ratingInfo = getRatingCategory(rating);
  
  // Size configurations for gauge-style meter
  const sizeConfig = {
    sm: {
      width: 70,
      height: 50,
      fontSize: 'text-xs',
      labelText: 'text-xs'
    },
    md: {
      width: 100,
      height: 75,
      fontSize: 'text-sm',
      labelText: 'text-sm'
    },
    lg: {
      width: 120,
      height: 90,
      fontSize: 'text-base',
      labelText: 'text-base'
    }
  };

  const config = sizeConfig[size];
  const centerX = config.width / 2;
  const centerY = config.height - 10;
  const radius = (config.width - 20) / 2;
  
  // Calculate needle position based on rating (0-100)
  const needleAngle = (rating / 100) * Math.PI; // 0 to PI radians
  const needleX = centerX + Math.cos(Math.PI - needleAngle) * radius;
  const needleY = centerY - Math.sin(Math.PI - needleAngle) * radius;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width={config.width}
          height={config.height}
          viewBox={`0 0 ${config.width} ${config.height}`}
          className="overflow-visible"
        >
          {/* Background arc */}
          <path
            d={`M10,${centerY} A ${radius},${radius} 0 0,1 ${config.width - 10},${centerY}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={size === 'sm' ? "6" : "8"}
            strokeLinecap="round"
          />
          
          {/* Colored progress arc */}
          <path
            d={`M10,${centerY} A ${radius},${radius} 0 0,1 ${needleX},${needleY}`}
            fill="none"
            stroke={ratingInfo.color}
            strokeWidth={size === 'sm' ? "6" : "8"}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
          />
          
          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke="#334155"
            strokeWidth="2"
            className="transition-all duration-500 ease-in-out"
          />
          
          {/* Center point */}
          <circle 
            cx={centerX} 
            cy={centerY} 
            r="4" 
            fill="#334155" 
          />
        </svg>
        
        {/* Percentage text positioned below the gauge */}
        <div className="absolute inset-x-0 -bottom-2 flex flex-col items-center">
          <span className={`font-bold ${config.fontSize}`} style={{ color: ratingInfo.color }}>
            {rating}%
          </span>
          {showLabel && (
            <span className={`text-muted-foreground ${config.labelText}`}>
              {ratingInfo.description}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Alternative horizontal bar meter (if you prefer this style)
export function CustomerRatingBar({ 
  rating, 
  showLabel = true,
  className = ""
}: CustomerRatingMeterProps & { className?: string }) {
  const ratingInfo = getRatingCategory(rating);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900">{rating}%</span>
          {showLabel && (
            <span className="text-xs text-muted-foreground">{ratingInfo.category}</span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500 ease-in-out"
            style={{
              width: `${rating}%`,
              backgroundColor: ratingInfo.color
            }}
          />
        </div>
        {showLabel && (
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">{ratingInfo.description}</span>
          </div>
        )}
      </div>
    </div>
  );
} 