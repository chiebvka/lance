import { SupabaseClient } from '@supabase/supabase-js';

export interface UserProfile {
  profile_id: string;
  organizationId?: string;
  organizationRole?: string;
  email?: string;
}

/**
 * Get user profile by user ID
 * @param supabase - Supabase client instance
 * @param userId - User ID to fetch profile for
 * @returns UserProfile object or null if not found
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("profile_id, organizationId, organizationRole, email")
      .eq("profile_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return null;
  }
}

/**
 * Check if user has an organization
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @returns boolean indicating if user has an organization
 */
export async function userHasOrganization(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const profile = await getUserProfile(supabase, userId);
  return !!profile?.organizationId;
}

/**
 * Get user's organization role
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @returns organization role string or null
 */
export async function getUserOrganizationRole(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const profile = await getUserProfile(supabase, userId);
  return profile?.organizationRole || null;
}

/**
 * Get user's organization data
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @returns organization data or null if user has no organization
 */
export async function getUserOrganization(
  supabase: SupabaseClient,
  userId: string
): Promise<any | null> {
  const profile = await getUserProfile(supabase, userId);
  
  if (!profile?.organizationId) {
    return null;
  }

  const { data: organization, error } = await supabase
    .from("organization")
    .select("*")
    .eq("id", profile.organizationId)
    .single();

  if (error) {
    console.error("Error fetching user organization:", error);
    return null;
  }

  return organization;
}

/**
 * Check if user has an active subscription
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @returns boolean indicating if user has an active subscription
 */
export async function userHasActiveSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const organization = await getUserOrganization(supabase, userId);
  
  if (!organization) {
    return false;
  }

  // Check if user has an active subscription 
  // (either truly active OR trial with payment method attached)
  return organization.subscriptionstatus === "active" ||
         (organization.subscriptionstatus === "trial" && organization.paymentMethodId);
} 