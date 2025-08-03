import { SupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

/**
 * Get authenticated user or redirect to login
 * @param supabase - Supabase client instance
 * @returns User object or redirects to login
 */
export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

/**
 * Check if user is authenticated without redirecting
 * @param supabase - Supabase client instance
 * @returns User object or null
 */
export async function getCurrentUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get authenticated user with organization check
 * @param supabase - Supabase client instance
 * @param requireOrganization - Whether to require user to have an organization
 * @returns User object and organization data
 */
export async function getAuthenticatedUserWithOrganization(
  supabase: SupabaseClient,
  requireOrganization: boolean = false
) {
  const user = await getAuthenticatedUser(supabase);
  
  if (requireOrganization) {
    const { userHasOrganization } = await import('@/utils/user-profile');
    const hasOrganization = await userHasOrganization(supabase, user.id);
    
    if (!hasOrganization) {
      redirect("/protected/team/create");
    }
  }
  
  return user;
} 