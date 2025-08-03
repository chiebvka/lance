import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function syncStripeProducts() {
  const supabase = await createClient();

  try {
    // Fetch all products from Stripe
    const products = await stripe.products.list({
      active: true,
    });

    // Fetch all prices from Stripe
    const prices = await stripe.prices.list({
      active: true,
    });

    // Sync products
    for (const product of products.data) {
      await supabase
        .from("products")
        .upsert({
          stripeProductId: product.id,
          name: product.name,
          description: product.description,
          metadata: product.metadata,
          isActive: product.active,
          updatedAt: new Date().toISOString(),
        }, {
          onConflict: "stripeProductId"
        });
    }

    // Sync prices
    for (const price of prices.data) {
      if (price.type === "recurring" && price.recurring) {
        await supabase
          .from("pricing")
          .upsert({
            stripePriceId: price.id,
            stripeProductId: price.product as string,
            currency: price.currency,
            unitAmount: price.unit_amount || 0,
            billingCycle: price.recurring.interval,
            isActive: price.active,
            updatedAt: new Date().toISOString(),
          }, {
            onConflict: "stripePriceId"
          });
      }
    }

    console.log("Stripe products and prices synced successfully!");
  } catch (error) {
    console.error("Error syncing Stripe data:", error);
  }
}

// Run the sync if this file is executed directly
if (require.main === module) {
  syncStripeProducts();
} 