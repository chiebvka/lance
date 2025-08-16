"use client"

import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SubscriptionNoticeProps {
  reason?: string | null;
}

export default function SubscriptionNotice({ reason }: SubscriptionNoticeProps) {
  const friendlyReason = (() => {
    const r = (reason || '').toLowerCase();
    if (r === 'trial_expired') return 'trial expired';
    if (r === 'past_due') return 'payment past due';
    if (r === 'unpaid') return 'unpaid';
    if (r === 'canceled' || r === 'cancelled') return 'cancelled';
    if (r === 'incomplete_expired') return 'subscription incomplete and expired';
    if (!r || r === 'unknown') return 'inactive';
    return r;
  })();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-xl w-full p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h1 className="text-lg md:text-2xl font-semibold text-primary mb-2">
          This link is currently unavailable
        </h1>
        <p className="text-sm md:text-base ">
          The sender’s Bexforte subscription is <span className="font-medium">{friendlyReason}</span>. Please ask them to
          review and renew their subscription in order to make this link viewable again.
        </p>
      </Card>
    </div>
  );
}


