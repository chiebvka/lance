
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  organizationId: string
) {
  const supabase = await createClient();

  // Check if the organization already has a Stripe customer ID
  const { data: orgData } = await supabase
    .from("organization")
    .select("stripeMetadata")
    .eq("id", organizationId)
    .single();

  const customerId = (orgData?.stripeMetadata as any)?.customerId;

  if (customerId) {
    return customerId;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
      organizationId,
    },
  });

  // Update the organization with the new customer ID
  await supabase
    .from("organization")
    .update({
      stripeMetadata: {
        ...((orgData?.stripeMetadata as any) || {}),
        customerId: customer.id,
      },
    })
    .eq("id", organizationId);

  return customer.id;
}
