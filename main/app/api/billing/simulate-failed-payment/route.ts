import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { getAuthenticatedUser } from "@/utils/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function POST(request: NextRequest) {
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

    // Get organization's subscription
    const { data: organization } = await supabase
      .from("organization")
      .select("subscriptionId, stripeMetadata")
      .eq("id", profile.organizationId)
      .single();

    if (!organization?.subscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    const customerId = (organization.stripeMetadata as any)?.customerId;
    if (!customerId) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
    }

    // Only allow this in test mode
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "This endpoint is only available in development" }, { status: 403 });
    }

    // Create a test payment method that will fail using Stripe test tokens
    const testPaymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: "tok_chargeDeclinedInsufficientFunds", // Use Stripe test token instead of raw card numbers
      },
    });

    // Attach it to the customer
    await stripe.paymentMethods.attach(testPaymentMethod.id, {
      customer: customerId,
    });

    // Set it as the default payment method for the subscription
    await stripe.subscriptions.update(organization.subscriptionId, {
      default_payment_method: testPaymentMethod.id,
    });

    // Try to create an invoice and attempt payment to trigger failure
    const invoice = await stripe.invoices.create({
      customer: customerId,
      subscription: organization.subscriptionId,
      auto_advance: false, // Don't auto-finalize
    });

    // Fix TypeScript error by checking if invoice.id exists
    if (invoice.id) {
      await stripe.invoices.finalizeInvoice(invoice.id);

      // Attempt payment - this should fail
      try {
        await stripe.invoices.pay(invoice.id);
      } catch (error) {
        console.log("Payment failed as expected:", error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Failed payment simulation initiated. Check your Stripe dashboard for the failed payment.",
      invoice_id: invoice.id,
      payment_method_id: testPaymentMethod.id
    });

  } catch (error) {
    console.error("Error simulating failed payment:", error);
    return NextResponse.json(
      { error: "Failed to simulate payment failure" },
      { status: 500 }
    );
  }
}
