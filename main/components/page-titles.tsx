"use client"

import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Lightbulb, Sparkles, Clock, Plus } from "lucide-react"
import React, { useState } from 'react'

type Props = {
  title: string;
  description: string;
  tips?: {
    title: string;
    items: string[];
  };
}

export default function PageTitles({ title, description, tips }: Props) {

  const [showTips, setShowTips] = useState(false)
  return (
    <div className="mb-8 ">
      <div className="relative overflow-hidden border border-bexoni p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50/80 to-violet-50/80 dark:from-purple-950/30 dark:to-violet-950/30" />
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8  bg-gradient-to-br from-purple-200/60 to-violet-300/60 dark:from-purple-800/40 dark:to-violet-800/40 opacity-70 dark:opacity-50 blur-2xl" />

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100/80 dark:bg-purple-900/60 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:text-purple-200">
              <Sparkles className="h-3 w-3" />
              New
            </div>

            {tips && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTips(!showTips)}
                className="gap-1 text-purple-700 bg-purple-100/80 dark:bg-purple-900/60 hover:text-purple-900 hover:bg-purple-100/50 dark:text-purple-300 dark:hover:text-purple-100 dark:hover:bg-purple-900/30 group"
              >
                <Lightbulb className="h-4 w-4 animate-[shake_0.5s_ease-in-out_infinite] group-hover:animate-none" />
                  <span
                    className="animate-[shake_0.5s_ease-in-out_infinite] group-hover:animate-none"
                   
                  >
                    Tips
                  </span>
                {showTips ? <ChevronUp className="h-3 w-3"  /> : <ChevronDown className="h-3 w-3  animate-[shake_0.5s_ease-in-out_infinite] group-hover:animate-none"   />}
              </Button>
            )}
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100  sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {description}
          </p>
        </div>
      </div>

      {showTips && tips && (
        <div className="mt-4 rounded-lgbg-purple-50/80 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/60 p-4">
          <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">{tips.title}</h3>
          <ul className="space-y-1 text-xs text-purple-800 dark:text-purple-300">
            {tips.items.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Average setup time: 2 minutes</span>
        </div>
      </div>
    </div>
  )
}