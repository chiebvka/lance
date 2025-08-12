import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAuthenticatedUser } from "@/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    const { state } = await request.json();

    // Only allow this in test mode
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "This endpoint is only available in development" }, { status: 403 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organizationId")
      .eq("profile_id", user.id)
      .single();

    if (!profile?.organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Valid states to test
    const validStates = ['active', 'past_due', 'cancelled', 'trial'];
    if (!validStates.includes(state)) {
      return NextResponse.json({ error: `Invalid state. Valid states: ${validStates.join(', ')}` }, { status: 400 });
    }

    // Update organization subscription status
    const { error: orgError } = await supabase
      .from("organization")
      .update({
        subscriptionstatus: state,
        // Reset trial end date if switching to trial
        ...(state === 'trial' && {
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
        }),
        // Reset subscription end date if switching to active
        ...(state === 'active' && {
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        }),
      })
      .eq("id", profile.organizationId);

    if (orgError) {
      console.error("Error updating organization subscription state:", orgError);
      return NextResponse.json({ error: "Failed to update subscription state" }, { status: 500 });
    }

    // Also update the subscriptions table if it exists
    const { error: subError } = await supabase
      .from("subscriptions")
      .update({
        subscriptionStatus: state,
      })
      .eq("organizationId", profile.organizationId);

    // Don't fail if subscriptions table update fails (it might not exist)
    if (subError) {
      console.log("Note: Could not update subscriptions table:", subError.message);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Subscription state changed to '${state}'. Refresh the page to see the changes.`,
      state: state
    });

  } catch (error) {
    console.error("Error simulating subscription state:", error);
    return NextResponse.json(
      { error: "Failed to simulate subscription state" },
      { status: 500 }
    );
  }
}
