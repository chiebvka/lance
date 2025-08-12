"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { format, parseISO } from 'date-fns';

interface TrialStatus {
  isLoading: boolean;
  hasOrganization: boolean;
  trialEndsAt: string | null;
  subscriptionStatus: string | null;
  timeRemaining: string;
  isExpired: boolean;
  formattedEndDate: string | null;
  nextBillingDate: string | null;
  formattedNextBilling: string | null;
  displayText: string | null;
}

export function useTrialCountdown(): TrialStatus {
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isLoading: true,
    hasOrganization: false,
    trialEndsAt: null,
    subscriptionStatus: null,
    timeRemaining: '',
    isExpired: false,
    formattedEndDate: null,
    nextBillingDate: null,
    formattedNextBilling: null,
    displayText: null,
  });

  const calculateTimeRemaining = (trialEndsAt: string): { timeRemaining: string; isExpired: boolean } => {
    const now = new Date().getTime();
    const trialEnd = new Date(trialEndsAt).getTime();
    const difference = trialEnd - now;

    if (difference <= 0) {
      return { timeRemaining: 'Expired', isExpired: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return { timeRemaining: `${days}d ${hours}h`, isExpired: false };
    } else if (hours > 0) {
      return { timeRemaining: `${hours}h ${minutes}m`, isExpired: false };
    } else {
      return { timeRemaining: `${minutes}m`, isExpired: false };
    }
  };

  useEffect(() => {
    const fetchTrialStatus = async () => {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setTrialStatus(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Get user profile and organization
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("organizationId")
          .eq("profile_id", user.id)
          .single();

        if (!userProfile?.organizationId) {
          setTrialStatus(prev => ({
            ...prev,
            isLoading: false,
            hasOrganization: false,
            timeRemaining: 'Pending activation',
            displayText: 'Pending activation',
            formattedEndDate: null,
            nextBillingDate: null,
            formattedNextBilling: null,
          }));
          return;
        }

        // Get organization details
        const { data: organization } = await supabase
          .from("organization")
          .select("trialEndsAt, subscriptionstatus, subscriptionEndDate, planType")
          .eq("id", userProfile.organizationId)
          .single();

        if (!organization) {
          setTrialStatus(prev => ({
            ...prev,
            isLoading: false,
            hasOrganization: false,
            timeRemaining: 'Pending activation',
            displayText: 'Pending activation',
            formattedEndDate: null,
            nextBillingDate: null,
            formattedNextBilling: null,
          }));
          return;
        }

        // Calculate time remaining if on trial
        let timeRemaining = '';
        let isExpired = false;
        let formattedEndDate = null;
        let nextBillingDate = null;
        let formattedNextBilling = null;
        let displayText = null;

        if (organization.subscriptionstatus === 'trial' && organization.trialEndsAt) {
          const result = calculateTimeRemaining(organization.trialEndsAt);
          timeRemaining = result.timeRemaining;
          isExpired = result.isExpired;
          
          // Format trial end date
          try {
            const endDate = parseISO(organization.trialEndsAt);
            formattedEndDate = format(endDate, 'MMMM d');
            displayText = isExpired ? 'Trial expired' : `Trial - ${formattedEndDate}`;
          } catch (error) {
            console.error('Error formatting trial end date:', error);
            formattedEndDate = 'Invalid date';
            displayText = isExpired ? 'Trial expired' : `Trial - ${formattedEndDate}`;
          }
        } else if (organization.subscriptionstatus === 'active' && organization.subscriptionEndDate) {
          timeRemaining = 'Active subscription';
          nextBillingDate = organization.subscriptionEndDate;
          
          // Format next billing date
          try {
            const billingDate = parseISO(organization.subscriptionEndDate);
            formattedNextBilling = format(billingDate, 'MMMM d');
            displayText = `Subscribed - ${formattedNextBilling}`;
          } catch (error) {
            console.error('Error formatting billing date:', error);
            formattedNextBilling = 'Invalid date';
            displayText = `Subscribed - ${formattedNextBilling}`;
          }
        } else if (organization.subscriptionstatus === 'active') {
          timeRemaining = 'Active subscription';
          displayText = 'Active subscription';
        } else {
          timeRemaining = organization.subscriptionstatus || 'Unknown';
          displayText = organization.subscriptionstatus || 'Unknown status';
        }

        setTrialStatus({
          isLoading: false,
          hasOrganization: true,
          trialEndsAt: organization.trialEndsAt,
          subscriptionStatus: organization.subscriptionstatus,
          timeRemaining,
          isExpired,
          formattedEndDate,
          nextBillingDate,
          formattedNextBilling,
          displayText,
        });

      } catch (error) {
        console.error('Error fetching trial status:', error);
        setTrialStatus(prev => ({
          ...prev,
          isLoading: false,
          timeRemaining: 'Error loading',
          displayText: 'Error loading',
        }));
      }
    };

    fetchTrialStatus();

    // Set up interval to update countdown every minute
    const interval = setInterval(() => {
      if (trialStatus.trialEndsAt && trialStatus.subscriptionStatus === 'trial') {
        const result = calculateTimeRemaining(trialStatus.trialEndsAt);
        
        // Update display text if trial status changes
        let newDisplayText = trialStatus.displayText;
        if (result.isExpired !== trialStatus.isExpired) {
          newDisplayText = result.isExpired ? 'Trial expired' : `Trial - ${trialStatus.formattedEndDate}`;
        }
        
        setTrialStatus(prev => ({
          ...prev,
          timeRemaining: result.timeRemaining,
          isExpired: result.isExpired,
          displayText: newDisplayText,
        }));
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [trialStatus.trialEndsAt, trialStatus.subscriptionStatus]);

  return trialStatus;
}