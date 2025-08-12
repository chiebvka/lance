import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { getAuthenticatedUser } from "@/utils/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organizationId")
      .eq("profile_id", user.id)
      .single();

    if (!profile?.organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get organization's Stripe customer ID
    const { data: organization } = await supabase
      .from("organization")
      .select("stripeMetadata")
      .eq("id", profile.organizationId)
      .single();

    const customerId = (organization?.stripeMetadata as any)?.customerId;
    if (!customerId) {
      return NextResponse.json({ payments: [] });
    }

    // Get URL parameters for pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const starting_after = url.searchParams.get("starting_after");

    // Fetch payment intents from Stripe
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: limit,
      starting_after: starting_after || undefined,
    });

    // Also fetch invoices for subscription payments
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: limit,
      starting_after: starting_after || undefined,
      status: "paid",
    });

    // Combine and format payment data
    const payments = [
      ...paymentIntents.data.map((pi) => ({
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        created: pi.created,
        description: pi.description || "Payment",
        type: "payment_intent" as const,
        invoice_pdf: null,
      })),
      ...invoices.data.map((inv) => ({
        id: inv.id,
        amount: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        created: inv.created,
        description: inv.description || `Invoice ${inv.number}`,
        type: "invoice" as const,
        invoice_pdf: inv.invoice_pdf,
        plan_name: inv.lines.data[0]?.price?.nickname || inv.lines.data[0]?.description,
      })),
    ].sort((a, b) => b.created - a.created);

    return NextResponse.json({
      payments: payments.slice(0, limit),
      has_more: paymentIntents.has_more || invoices.has_more,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}
