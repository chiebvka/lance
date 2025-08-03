import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

// Map Stripe subscription statuses to our database enum
function mapStripeStatusToDbStatus(stripeStatus: string, hasPaymentMethod: boolean = false): string {
  const statusMap: Record<string, string> = {
    'trialing': hasPaymentMethod ? 'active' : 'trial', // If payment method exists, consider it active
    'active': 'active', 
    'past_due': 'suspended',
    'canceled': 'cancelled',
    'cancelled': 'cancelled',
    'unpaid': 'expired',
    'incomplete': 'pending',
    'incomplete_expired': 'expired',
    'paused': 'suspended',
  };
  
  return statusMap[stripeStatus] || 'pending';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, country, baseCurrency } = body;

    // Validate required fields
    if (!name || !country || !baseCurrency) {
      return NextResponse.json(
        { error: "Missing required fields: name, country, baseCurrency" },
        { status: 400 }
      );
    }

    // Check if user already has an organization
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("organizationId")
      .eq("profile_id", user.id)
      .single();

    if (existingProfile?.organizationId) {
      return NextResponse.json(
        { error: "User already has an organization" },
        { status: 400 }
      );
    }

    // Get default starter plan price for monthly billing
    const { data: starterPrice } = await supabase
      .from("pricing")
      .select("stripePriceId")
      .eq("billingCycle", "monthly")
      .eq("isActive", true)
      .limit(1)
      .single();

    if (!starterPrice?.stripePriceId) {
      return NextResponse.json(
        { error: "No pricing plan available. Please contact support." },
        { status: 500 }
      );
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("profile_id", user.id)
      .single();

    const customerEmail = profile?.email || user.email;

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: customerEmail,
      name: name,
      metadata: {
        userId: user.id,
        country: country,
        baseCurrency: baseCurrency,
      },
    });

    // Create Stripe subscription with 7-day trial (incomplete)
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [{ price: starterPrice.stripePriceId }],
      payment_behavior: 'allow_incomplete',
      trial_period_days: 7,
      metadata: {
        userId: user.id,
        organizationName: name,
        country: country,
        baseCurrency: baseCurrency,
      },
      expand: ['latest_invoice'],
    });

    // Create organization with Stripe data
    const { data: organization, error: orgError } = await supabase
      .from("organization")
      .insert({
        name,
        country,
        baseCurrency,
        email: customerEmail,
        createdBy: user.id,
        subscriptionStatus: mapStripeStatusToDbStatus(stripeSubscription.status, false), // No payment method for initial trial
        subscriptionId: stripeSubscription.id,
        trialEndsAt: stripeSubscription.trial_end 
          ? new Date(stripeSubscription.trial_end * 1000).toISOString() 
          : null,
        planType: "starter",
        billingCycle: "monthly",
        stripeMetadata: {
          customerId: stripeCustomer.id,
          subscriptionId: stripeSubscription.id,
          priceId: starterPrice.stripePriceId,
        },
      })
      .select()
      .single();

      

    if (orgError) {
      // Clean up Stripe resources if organization creation fails
      try {
        await stripe.subscriptions.cancel(stripeSubscription.id);
        await stripe.customers.del(stripeCustomer.id);
      } catch (cleanupError) {
        console.error("Error cleaning up Stripe resources:", cleanupError);
      }

      return NextResponse.json(
        { error: "Failed to create organization", details: orgError.message },
        { status: 500 }
      );
    }

    // Create initial subscription record using service role client (bypasses RLS)
    const serviceSupabase = createServiceRoleClient();
    const { error: subError } = await serviceSupabase
      .from("subscriptions")
      .insert({
        organizationId: organization.id,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: stripeCustomer.id,
        subscriptionStatus: mapStripeStatusToDbStatus(stripeSubscription.status, false), // No payment method for initial trial
        planType: "starter",
        billingCycle: "monthly",
        amount: (stripeSubscription.items.data[0]?.price.unit_amount || 0) / 100,
        currency: stripeSubscription.items.data[0]?.price.currency || baseCurrency.toLowerCase(),
        startsAt: stripeSubscription.trial_start 
          ? new Date(stripeSubscription.trial_start * 1000).toISOString()
          : new Date().toISOString(),
        endsAt: stripeSubscription.trial_end 
          ? new Date(stripeSubscription.trial_end * 1000).toISOString()
          : null,
        createdBy: user.id,
        stripeMetadata: {
          customerId: stripeCustomer.id,
          priceId: starterPrice.stripePriceId,
          trialStart: stripeSubscription.trial_start,
          trialEnd: stripeSubscription.trial_end,
        },
      });

    if (subError) {
      console.error("Error creating subscription record:", subError);
      // Don't fail the organization creation for this
    }

    // Update user profile with organizationId and organizationRole
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ 
        organizationId: organization.id,
        organizationRole: "creator"
      })
      .eq("profile_id", user.id);

    if (profileError) {
      // If profile update fails, we should clean up the organization
      await supabase
        .from("organization")
        .delete()
        .eq("id", organization.id);

      return NextResponse.json(
        { error: "Failed to update user profile", details: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        country: organization.country,
        baseCurrency: organization.baseCurrency,
        subscriptionStatus: organization.subscriptionStatus,
        trialEndsAt: organization.trialEndsAt,
        planType: organization.planType,
        billingCycle: organization.billingCycle,
      },
      subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        trialStart: stripeSubscription.trial_start,
        trialEnd: stripeSubscription.trial_end,
      },
    });

  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
