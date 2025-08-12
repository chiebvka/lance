import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

async function checkSubscription() {
  try {
    // Replace with your actual subscription ID from Stripe dashboard
    const subscriptionId = "sub_1RuNMVChBUJpmjd0m0YSbs3a"; // Update this with the correct active subscription ID
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    console.log("=== STRIPE SUBSCRIPTION DATA ===");
    console.log("ID:", subscription.id);
    console.log("Status:", subscription.status);
    console.log("Current Period Start:", new Date((subscription as any).current_period_start * 1000));
    console.log("Current Period End:", new Date((subscription as any).current_period_end * 1000));
    console.log("Trial End:", (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : "No trial");
    console.log("Created:", new Date((subscription as any).created * 1000));
    console.log("Start Date:", new Date((subscription as any).start_date * 1000));
    console.log("Customer:", subscription.customer);
    console.log("Metadata:", subscription.metadata);
    
  } catch (error) {
    console.error("Error fetching subscription:", error);
  }
}

checkSubscription();
