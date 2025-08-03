import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { createClient } from "@/utils/supabase/server";

export async function middleware(request: NextRequest) {
  // First, handle authentication (existing logic)
  const response = await updateSession(request);
  
  // If authentication failed, return the response
  if (response.status !== 200) {
    return response;
  }

  // Get the pathname
  const pathname = request.nextUrl.pathname;

  // Define routes that don't need subscription checks
  const exemptFromSubscriptionCheck = [
    // Auth and general pages
    '/login',
    '/signup',
    '/sign-in',
    '/sign-up',
    '/forgot',
    '/reset',
    '/forgot-password',
    '/reset-password',
    '/pricing',
    
    // General folder routes (public pages)
    '/page',
    '/smtp-message',
    
    // Preview routes (public previews)
    '/f/',
    '/i/',
    '/p/',
    '/r/',
    
    // Protected routes that don't need subscription checks
    '/protected/team/create',
    '/protected/settings/billing',
    '/protected/account/billing',
    '/protected/account/security',
    // '/protected/settings',
    
    // API routes that are webhooks/cronjobs
    '/api/webhooks/stripe',
    '/api/subscribe-webhook',
    '/api/check-overdue',
    '/api/sendgrid-events',
    
    // Any other webhook endpoints
    '/api/webhooks/',
  ];

  // Skip subscription checks for exempt routes
  if (exemptFromSubscriptionCheck.some(route => pathname.startsWith(route))) {
    return response;
  }

  // Only check subscription for protected routes
  if (pathname.startsWith('/protected')) {
    try {
      // Create Supabase client for server-side operations
      const supabase = await createClient();
      
      // Get user from the request
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Check if user has an organization
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("profile_id, organizationId")
        .eq("profile_id", user.id)
        .single();

      // If user doesn't have an organization, redirect to team creation
      if (!userProfile?.organizationId) {
        return NextResponse.redirect(new URL('/protected/team/create', request.url));
      }

      // Check if organization exists and get subscription status
      const { data: organization } = await supabase
        .from("organization")
        .select("id, name, subscriptionStatus, trialEndsAt, planType")
        .eq("id", userProfile.organizationId)
        .single();

      // If organization doesn't exist, redirect to team creation
      if (!organization) {
        return NextResponse.redirect(new URL('/protected/team/create', request.url));
      }

      // Handle subscription status checks
      const subscriptionStatus = organization.subscriptionStatus;

      // Stripe subscription statuses that allow full access
      const allowedStatuses = [
        'trialing',        // During trial period
        'active',          // Paid and active
        'incomplete',      // Trial subscription (allow_incomplete)
      ];

      // Stripe subscription statuses that should redirect to billing
      const blockedStatuses = [
        'incomplete_expired',  // Trial expired, no payment method
        'past_due',           // Payment failed, grace period
        'canceled',           // Subscription cancelled
        'unpaid',            // Payment failed, final state
        'expired',           // Legacy status
        'cancelled',         // Legacy status
        'suspended',         // Legacy status
      ];

      // Check if subscription is in a blocked state
      if (blockedStatuses.includes(subscriptionStatus || '')) {
        return NextResponse.redirect(new URL('/protected/settings/billing', request.url));
      }

      // Handle legacy trial status (for existing accounts)
      if (subscriptionStatus === 'trial' && organization.trialEndsAt) {
        const trialEndDate = new Date(organization.trialEndsAt);
        const now = new Date();
        
        if (now > trialEndDate) {
          // Legacy trial has expired, redirect to billing
          return NextResponse.redirect(new URL('/protected/settings/billing', request.url));
        }
      }

      // If status is not explicitly allowed or blocked, be permissive for now
      // This handles edge cases and new statuses from Stripe

      // If subscription is pending, allow access but could show a warning
      if (subscriptionStatus === 'pending') {
        // You could add a header to indicate pending status
        response.headers.set('x-subscription-status', 'pending');
      }

    } catch (error) {
      console.error('Middleware subscription check error:', error);
      // On error, allow the request to proceed (fail open)
      // You might want to log this for monitoring
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
