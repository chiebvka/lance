"use client"
import React from 'react';
// ... existing code ...
import { useFeedbacks } from "@/hooks/feedbacks/use-feedbacks";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import SegmentedBar from "@/components/segment-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { FeedbackSummaryCard } from '@/components/summary-cards';
import { ScrollArea } from '@/components/ui/scroll-area';


type Props = {}

export default function CardAnalytics({}: Props) {
    const { data: feedbacks = [] } = useFeedbacks();

  // Calculate stats
  const now = new Date();

  const openCount = feedbacks.filter(fb => fb.state === "draft").length;
  const sentCount = feedbacks.filter(fb => fb.state === "sent").length;

  // Overdue: not completed or draft, dueDate < now
  const overdueCount = feedbacks.filter(fb => {
    if (["completed", "draft"].includes(fb.state ?? "")) return false;
    if (!fb.dueDate) return false;
    return new Date(fb.dueDate) < now;
  }).length;

  // Performance rating calculation
  const completedCount = feedbacks.filter(fb => fb.state === "completed").length;
  const totalNonDraft = feedbacks.filter(fb => fb.state !== "draft").length;
  let rating = totalNonDraft > 0 ? (completedCount / totalNonDraft) * 100 : 0;
  // Deduct 10 points per overdue, but don't go below 0
  rating = Math.max(0, rating - overdueCount * 10);

  // Create calculation explanation
  const calculationExplanation = totalNonDraft > 0 
    ? `Based on ${completedCount} completed out of ${totalNonDraft} sent feedbacks. ${overdueCount > 0 ? `Deducted ${overdueCount * 10} points for ${overdueCount} overdue form${overdueCount > 1 ? 's' : ''}.` : 'No overdue forms.'}`
    : 'No feedbacks sent yet.';

  // Carousel cards data
  const cards = [
    {
      title: "Open",
      value: openCount,
      subtitle: `${openCount} form${openCount === 1 ? "" : "s"} in draft`,
    },
    {
      title: "Pending",
      value: sentCount,
      subtitle: `${sentCount} form${sentCount === 1 ? "" : "s"} pending`,
    },
    {
        title: "Overdue",
        value: overdueCount,
        subtitle: overdueCount > 0 ? `${overdueCount} overdue forms` : "No overdue forms",
      },
      {
        title: "Performance Rating",
        value:  (
            <SegmentedBar
              score={Math.round(rating)}
              title=""
              subtitle=""
              calculationExplanation={calculationExplanation}
            />
          ),
        isRating: true,
        subtitle: totalNonDraft > 0
          ? `${completedCount} of ${totalNonDraft} completed`
          : "No feedbacks yet",
      },
    ];

  return (
    <div className="w-full">
      {/* Desktop: all cards in a row, no scroll, no carousel */}
      <div className="hidden md:flex gap-4 items-stretch">
        {cards.map((card) => (
          <div key={card.title} className="flex-1 min-w-[220px] h-full">
            <FeedbackSummaryCard
              value={card.value}
              title={card.title}
              subtitle={card.subtitle}
            />
          </div>
        ))}
      </div>
      {/* Mobile: carousel with scroll area */}
      <div className="md:hidden">
      <FeedbackSummaryCard
          value={
            <SegmentedBar
              score={Math.round(rating)}
              title="Performance Rating"
              subtitle={
                totalNonDraft > 0
                  ? `${completedCount} of ${totalNonDraft} completed`
                  : "No feedbacks yet"
              }
              calculationExplanation={calculationExplanation}
            />
          }
          title=""
          subtitle=""
        />
      </div>
    </div>
  )
}