"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

interface SegmentedBarProps {
  score: number
  title: string
  subtitle?: string
  calculationExplanation?: string
}

export default function SegmentedBar({
  score = 73,
  title = "Performance Rating",
  subtitle = "Above average",
  calculationExplanation = "Rating calculation explanation"
}: SegmentedBarProps) {
  const segments = 10
  const filledSegments = Math.floor((score / 100) * segments)
  const partialFill = ((score / 100) * segments) % 1

  const getSegmentColor = (index: number, score: number) => {
    const segmentScore = ((index + 1) / segments) * 100
    
    if (segmentScore <= score) {
      // Gradient color scheme: Red -> Orange -> Yellow -> Light Green -> Green
      if (score < 20) return "bg-red-500"
      if (score < 40) return "bg-orange-500"
      if (score < 60) return "bg-yellow-500"
      if (score < 80) return "bg-lime-500"
      return "bg-green-500"
    }
    return "bg-muted-foreground/20"
  }

  const getTextColor = (score: number) => {
    if (score < 20) return "text-red-500"
    if (score < 40) return "text-orange-500"
    if (score < 60) return "text-yellow-500"
    if (score < 80) return "text-lime-500"
    return "text-green-500"
  }

  const getRatingLabel = (score: number) => {
    if (score < 20) return "Very Poor"
    if (score < 40) return "Poor"
    if (score < 60) return "Fair"
    if (score < 80) return "Good"
    return "Excellent"
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <span className={`text-2xl font-bold ${getTextColor(score)}`}>{score}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium">Rating Calculation</p>
                <p className="text-sm">{calculationExplanation}</p>
                <div className="text-xs space-y-1">
                  <p><span className="font-medium">0-19:</span> Very Poor (Red)</p>
                  <p><span className="font-medium">20-39:</span> Poor (Orange)</p>
                  <p><span className="font-medium">40-59:</span> Fair (Yellow)</p>
                  <p><span className="font-medium">60-79:</span> Good (Light Green)</p>
                  <p><span className="font-medium">80-100:</span> Excellent (Green)</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex gap-1 my-1">
        {Array.from({ length: segments }, (_, index) => (
          <div
            key={index}
            className={`h-3 flex-1 rounded-sm transition-all duration-300 ${getSegmentColor(index, score)}`}
            style={{
              opacity: index === filledSegments && partialFill > 0 ? partialFill : 1,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Very Poor</span>
        <span>Excellent</span>
      </div>
      <div className="text-xs text-center mt-1">
        <span className={`font-medium ${getTextColor(score)}`}>
          {getRatingLabel(score)}
        </span>
      </div>
    </div>
  )
}
