"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';

// Create a partial type for the organization fields we actually need
type OrganizationSubscription = Pick<
  Database["public"]["Tables"]["organization"]["Row"],
  | "id"
  | "name"
  | "subscriptionstatus"
  | "trialEndsAt"
  | "planType"
  | "billingCycle"
  | "subscriptionStartDate"
  | "subscriptionEndDate"
  | "stripeMetadata"
  | "subscriptionMetadata"
>;

type SubscriptionStatus = Database["public"]["Enums"]["subscription_status_enum"];

interface SubscriptionState {
  organization: OrganizationSubscription | null;
  isLoading: boolean;
  error: string | null;
  hasActiveSubscription: boolean;
  trialDaysRemaining: number;
  isTrialExpiringSoon: boolean;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    organization: null,
    isLoading: true,
    error: null,
    hasActiveSubscription: false,
    trialDaysRemaining: 0,
    isTrialExpiringSoon: false,
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Get user profile
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("organizationId")
          .eq("profile_id", user.id)
          .single();

        if (!userProfile?.organizationId) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Get organization details
        const { data: organization } = await supabase
          .from("organization")
          .select(`
            id,
            name,
            subscriptionstatus,
            trialEndsAt,
            planType,
            billingCycle,
            subscriptionStartDate,
            subscriptionEndDate,
            stripeMetadata,
            subscriptionMetadata
          `)
          .eq("id", userProfile.organizationId)
          .single();

        if (!organization) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Calculate subscription state
        const validStatuses: SubscriptionStatus[] = ['active', 'trial'];
        const hasActiveSubscription = validStatuses.includes(organization.subscriptionstatus || 'trial');

        // Calculate trial days remaining
        let trialDaysRemaining = 0;
        if (organization.subscriptionstatus === 'trial' && organization.trialEndsAt) {
          const trialEndDate = new Date(organization.trialEndsAt);
          const now = new Date();
          const diffTime = trialEndDate.getTime() - now.getTime();
          trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        const isTrialExpiringSoon = trialDaysRemaining <= 3 && trialDaysRemaining > 0;

        setState({
          organization,
          isLoading: false,
          error: null,
          hasActiveSubscription,
          trialDaysRemaining,
          isTrialExpiringSoon,
        });

      } catch (error) {
        console.error('Error loading subscription:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load subscription data',
        }));
      }
    }

    loadSubscription();
  }, []);

  return state;
} 