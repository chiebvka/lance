import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    const { priceId, organizationId, userId } = await request.json();

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user details
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile to get email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("profile_id", userId)
      .single();

    const customerEmail = profile?.email || user.user.email;

    // Create or get organization if not provided
    let orgId = organizationId;
    if (!orgId) {
      // Create a new organization for the user
      const { data: newOrg, error: orgError } = await supabase
        .from("organization")
        .insert({
          name: "My Organization", // Default name - user can change later
          createdBy: userId,
          subscriptionStatus: "trial",
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        })
        .select()
        .single();

      if (orgError) {
        console.error("Error creating organization:", orgError);
        return NextResponse.json(
          { error: "Failed to create organization" },
          { status: 500 }
        );
      }

      orgId = newOrg.id;

      // Update user profile with organization ID
      await supabase
        .from("profiles")
        .update({ organizationId: orgId })
        .eq("profile_id", userId);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          organizationId: orgId,
          userId: userId,
        },
      },
      metadata: {
        organizationId: orgId,
        userId: userId,
      },
      success_url: `${request.nextUrl.origin}/protected?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/pricing`,
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