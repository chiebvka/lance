"use client";

import React from 'react';
import { Button } from './ui/button';
// If you use ShadCN Button, you might import it like this:
// import { Button } from "@/components/ui/button"; 

export default function StartTrial() {
  // HSL color for the shadow: hsl(278, 29%, 45%)
  // We'll use this directly in the Tailwind arbitrary shadow utility with an alpha value.

  return (
    <section className="py-20 md:py-32 border-2 border-bexoni">
      <div className="container mx-auto px-4">
        <div 
          className={` p-10 md:p-16  text-center border border-bexoni mx-auto box-shadow-lg shadow-[0_10px_30px_-5px_hsla(278,29%,45%,0.25),0_5px_15px_-5px_hsla(278,29%,45%,0.2)]`}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold  mb-6">
            Stress free by Deluccis.
          </h1>
          <p className="text-lg md:text-xl  mb-10 max-w-xl mx-auto">
            Invoicing, Receipting, Service Agreements, Client Management, Financial Overview & your own Assistant.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {/* Using regular button tags, style as needed or replace with ShadCN Button if preferred */}
            <Button 
              variant="outline"
              className=""
            >
              Talk to founders
            </Button>
            <Button 
              className=""
            >
              Start free trial
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}