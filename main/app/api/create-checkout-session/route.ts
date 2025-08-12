import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { getOrCreateStripeCustomer } from "@/utils/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    const { priceId, organizationId, userId } = await request.json();

    if (!organizationId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user details
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to get email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("profile_id", userId)
      .single();

    const customerEmail = profile?.email || user.user.email;
    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email not found" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      userId,
      customerEmail,
      organizationId
    );

    // Get organization details to check subscription status
    const { data: organization } = await supabase
      .from("organization")
      .select("subscriptionstatus, subscriptionId")
      .eq("id", organizationId)
      .single();

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const { subscriptionstatus, subscriptionId } = organization;

    // If priceId is "portal" or there is an existing subscription, direct to billing portal
    if (priceId === "portal" || subscriptionId) {
      try {
        // Create portal session without flow_data to show the main portal with all options
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${request.nextUrl.origin}/protected/settings/billing?portal=complete`,
          // If you have a pre-created configuration, pass it via env
          configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined,
        });
        return NextResponse.json({ url: portalSession.url });
      } catch (err: any) {
        const needsConfig =
          err?.type === "StripeInvalidRequestError" &&
          typeof err?.message === "string" &&
          err.message.includes("No configuration provided")
        ;

        if (!needsConfig) throw err;

        // Create a minimal billing portal configuration in test mode, then retry
        const configuration = await stripe.billingPortal.configurations.create({
          business_profile: {
            privacy_policy_url: `${request.nextUrl.origin}/privacy`,
            terms_of_service_url: `${request.nextUrl.origin}/terms`,
          },
          features: {
            invoice_history: { enabled: true },
            payment_method_update: { enabled: true },
            subscription_cancel: { 
              enabled: true, 
              mode: "at_period_end",
              cancellation_reason: {
                enabled: true,
                options: [
                  "too_expensive",
                  "missing_features", 
                  "switched_service",
                  "unused",
                  "customer_service",
                  "too_complex",
                  "low_quality",
                  "other"
                ]
              }
            },
            subscription_update: {
              enabled: true,
              default_allowed_updates: ["price"],
              proration_behavior: "create_prorations",
            },
          },
        });

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          configuration: configuration.id,
          return_url: `${request.nextUrl.origin}/protected/settings/billing?portal=complete`,
        });
        return NextResponse.json({ url: portalSession.url });
      }
    }

    // Otherwise, create a brand new subscription via Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          organizationId,
          userId,
        },
      },
      metadata: {
        organizationId,
        userId,
      },
      success_url: `${request.nextUrl.origin}/protected?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/protected/settings/billing`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
} 