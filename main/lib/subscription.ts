import { createClient } from "@/utils/supabase/server";
import { Database } from "@/types/supabase";

type Organization = Database["public"]["Tables"]["organization"]["Row"];
type SubscriptionStatus = Database["public"]["Enums"]["subscription_status_enum"];
type PlanType = Database["public"]["Enums"]["plan_type_enum"];

export class SubscriptionManager {
  /**
   * Get user's organization and subscription details
   */
  async getUserSubscription(userId: string) {
    const supabase = await createClient();
    
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("organizationId")
      .eq("profile_id", userId)
      .single();

    if (!userProfile?.organizationId) {
      return null;
    }

    const { data: organization } = await supabase
      .from("organization")
      .select(`
        id,
        name,
        subscriptionStatus,
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

    return organization;
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) return false;

    const validStatuses: SubscriptionStatus[] = ['active', 'trial'];
    
    if (!validStatuses.includes(subscription.subscriptionStatus || 'trial')) {
      return false;
    }

    // Check if trial has expired
    if (subscription.subscriptionStatus === 'trial' && subscription.trialEndsAt) {
      const trialEndDate = new Date(subscription.trialEndsAt);
      const now = new Date();
      
      if (now > trialEndDate) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if user can access a specific feature
   */
  async canAccessFeature(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) return false;

    // Feature access matrix
    const featureAccess: Record<string, PlanType[]> = {
      'unlimited_projects': ['pro', 'corporate'],
      'advanced_analytics': ['pro', 'corporate'],
      'api_access': ['corporate'],
      'priority_support': ['pro', 'corporate'],
      'custom_branding': ['pro', 'corporate'],
      'team_members': ['pro', 'corporate'],
      'export_data': ['pro', 'corporate'],
    };

    const requiredPlan = featureAccess[feature];
    if (!requiredPlan) return true; // Feature available to all plans

    return requiredPlan.includes(subscription.planType || 'starter');
  }

  /**
   * Get trial days remaining
   */
  async getTrialDaysRemaining(userId: string): Promise<number> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription?.trialEndsAt) return 0;

    const trialEndDate = new Date(subscription.trialEndsAt);
    const now = new Date();
    const diffTime = trialEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Check if trial is expiring soon (within 3 days)
   */
  async isTrialExpiringSoon(userId: string): Promise<boolean> {
    const daysRemaining = await this.getTrialDaysRemaining(userId);
    return daysRemaining <= 3 && daysRemaining > 0;
  }

  /**
   * Get subscription limits based on plan
   */
  getPlanLimits(planType: PlanType) {
    const limits = {
      starter: {
        projects: 5,
        customers: 10,
        invoices: 20,
        teamMembers: 1,
      },
      pro: {
        projects: 50,
        customers: 100,
        invoices: 500,
        teamMembers: 5,
      },
      corporate: {
        projects: -1, // unlimited
        customers: -1, // unlimited
        invoices: -1, // unlimited
        teamMembers: -1, // unlimited
      },
    };

    return limits[planType] || limits.starter;
  }

  /**
   * Check if user has exceeded plan limits
   */
  async checkPlanLimits(userId: string, resource: 'projects' | 'customers' | 'invoices' | 'teamMembers'): Promise<{
    current: number;
    limit: number;
    exceeded: boolean;
  }> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      return { current: 0, limit: 0, exceeded: false };
    }

    const limits = this.getPlanLimits(subscription.planType || 'starter');
    const limit = limits[resource];

    // If unlimited, return false for exceeded
    if (limit === -1) {
      return { current: 0, limit: -1, exceeded: false };
    }

    // Get current count based on resource type
    let current = 0;
    const organizationId = subscription.id;

    const supabase = await createClient();

    switch (resource) {
      case 'projects':
        const { count: projectCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('organizationId', organizationId);
        current = projectCount || 0;
        break;

      case 'customers':
        const { count: customerCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('organizationId', organizationId);
        current = customerCount || 0;
        break;

      case 'invoices':
        const { count: invoiceCount } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('organizationId', organizationId);
        current = invoiceCount || 0;
        break;

      case 'teamMembers':
        const { count: teamCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('organizationId', organizationId);
        current = teamCount || 0;
        break;
    }

    return {
      current,
      limit,
      exceeded: current >= limit,
    };
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager(); 