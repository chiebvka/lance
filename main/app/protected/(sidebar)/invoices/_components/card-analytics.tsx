"use client"
import React from 'react';
import { useInvoices } from "@/hooks/invoices/use-invoices";
import SegmentedBar from "@/components/segment-bar";
import { FeedbackSummaryCard } from '@/components/summary-cards';
import { format } from "date-fns";

type Props = {}

export default function CardAnalytics({}: Props) {
  const { data: invoices = [] } = useInvoices();

  // Calculate stats
  const now = new Date();

  // Paid invoices (state = 'paid')
  const paidCount = invoices.filter(inv => inv.state === "paid").length;

  // Pending invoices (state = 'sent' - these are invoices that have been sent but not paid)
  const pendingCount = invoices.filter(inv => inv.state === "sent").length;

  // Overdue invoices (dueDate < now and not paid)
  const overdueCount = invoices.filter(inv => {
    if (inv.state === "paid") return false; // Paid invoices are not overdue
    if (!inv.dueDate) return false;
    return new Date(inv.dueDate) < now;
  }).length;

  // Invoice rating calculation
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.state === "paid").length;
  
  // Calculate various metrics for rating
  let rating = 0;
  let calculationExplanation = "";

  if (totalInvoices > 0) {
    // Base score: percentage of paid invoices (60% weight)
    const paidPercentage = (paidInvoices / totalInvoices) * 60;
    
    // On-time payment score (20% weight)
    let onTimePaymentScore = 0;
    const paidInvoicesWithDates = invoices.filter(inv => 
      inv.state === "paid" && inv.paidOn && inv.dueDate
    );
    
    if (paidInvoicesWithDates.length > 0) {
      const onTimePayments = paidInvoicesWithDates.filter(inv => 
        new Date(inv.paidOn!) <= new Date(inv.dueDate!)
      ).length;
      onTimePaymentScore = (onTimePayments / paidInvoicesWithDates.length) * 20;
    }
    
    // Overdue penalty (10% weight) - deduct points for overdue invoices
    const overduePenalty = Math.min(10, (overdueCount / totalInvoices) * 10);
    
    // Collection efficiency (10% weight) - based on how quickly invoices are paid
    let collectionEfficiency = 0;
    if (paidInvoices > 0) {
      const avgPaymentDays = paidInvoicesWithDates.reduce((total, inv) => {
        const paymentDate = new Date(inv.paidOn!);
        const dueDate = new Date(inv.dueDate!);
        const daysDiff = Math.max(0, (paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return total + daysDiff;
      }, 0) / paidInvoicesWithDates.length;
      
      // Score based on average payment days (lower is better)
      collectionEfficiency = Math.max(0, 10 - (avgPaymentDays / 30) * 10);
    }
    
    rating = Math.max(0, Math.min(100, paidPercentage + onTimePaymentScore - overduePenalty + collectionEfficiency));
    
    calculationExplanation = `Based on ${totalInvoices} total invoices. ${paidInvoices} paid (${Math.round(paidPercentage)}% base score). ${onTimePaymentScore > 0 ? `On-time payments: ${Math.round(onTimePaymentScore)}%. ` : ''}${overduePenalty > 0 ? `Overdue penalty: -${Math.round(overduePenalty)}%. ` : ''}Collection efficiency: ${Math.round(collectionEfficiency)}%.`;
  } else {
    calculationExplanation = "No invoices yet.";
  }

  // Carousel cards data
  const cards = [
    {
      title: "Paid",
      value: paidCount,
      subtitle: `${paidCount} invoice${paidCount === 1 ? "" : "s"} paid`,
    },
    {
      title: "Pending",
      value: pendingCount,
      subtitle: `${pendingCount} invoice${pendingCount === 1 ? "" : "s"} pending`,
    },
    {
      title: "Overdue",
      value: overdueCount,
      subtitle: overdueCount > 0 ? `${overdueCount} overdue invoice${overdueCount === 1 ? "" : "s"}` : "No overdue invoices",
    },
    {
      title: "Invoice Rating",
      value: (
        <SegmentedBar
          score={Math.round(rating)}
          title=""
          subtitle=""
          calculationExplanation={calculationExplanation}
        />
      ),
      isRating: true,
      subtitle: totalInvoices > 0
        ? `${paidInvoices} of ${totalInvoices} paid`
        : "No invoices yet",
    },
  ];

  return (
    <div className="w-full mb-6">
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
              title="Invoice Rating"
              subtitle={
                totalInvoices > 0
                  ? `${paidInvoices} of ${totalInvoices} paid`
                  : "No invoices yet"
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