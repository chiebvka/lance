import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import Stripe from "stripe";
import { telegramService } from "@/utils/telegram";

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
    
    // Determine environment based on Stripe key
    const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
    const environment = isLiveMode ? 'live' : 'test';
    
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

    // Get the most basic plan price for monthly billing by product name and environment
    console.log(`🔍 Looking for basic plan in environment: ${environment}`);
    
    // First, let's see what products exist
    const { data: allProducts } = await supabase
      .from("products")
      .select("name, environment, stripeProductId, isActive")
      .eq("environment", environment);
    
    console.log(`🔍 All products in database:`, allProducts);
    
    // Check if we have any pricing records at all
    const { data: allPricing, error: pricingCheckError } = await supabase
      .from("pricing")
      .select(`
        stripePriceId,
        stripeProductId,
        billingCycle,
        isActive,
        product:products!inner (
          name,
          environment
        )
      `)
      .eq("products.environment", environment)
      .eq("isActive", true);
    
    console.log(`🔍 All pricing records in ${environment} environment:`, allPricing);
    if (pricingCheckError) {
      console.error(`❌ Error checking pricing records:`, pricingCheckError);
    }
    
    // Try to find Essential plan first, then fallback to Starter, then any available plan
    let basicPrice = null;
    let priceError = null;
    
    // Try Essential plan first (new plan structure)
    console.log(`🔍 Trying Essential plan...`);
    const { data: essentialPrice, error: essentialError } = await supabase
      .from("pricing")
      .select(`
        stripePriceId,
        billingCycle,
        productId,
        stripeProductId,
        product:products!inner (
          name,
          environment,
          stripeProductId
        )
      `)
      .eq("billingCycle", "monthly")
      .eq("isActive", true)
      .eq("products.name", "Essential")
      .eq("products.environment", environment)
      .limit(1)
      .single();

    console.log(`🔍 Essential price query result:`, { essentialPrice, essentialError });

    if (essentialPrice?.stripePriceId) {
      basicPrice = essentialPrice;
      console.log(`✅ Found Essential pricing:`, basicPrice);
    } else {
      console.log(`❌ Essential pricing not found. Error:`, essentialError);
      // Try Starter plan as fallback (old plan structure)
      console.log(`🔍 Essential not found, trying Starter as fallback...`);
      
      const { data: starterPrice, error: starterError } = await supabase
        .from("pricing")
        .select(`
          stripePriceId,
          billingCycle,
          productId,
          stripeProductId,
          product:products!inner (
            name,
            environment,
            stripeProductId
          )
        `)
        .eq("billingCycle", "monthly")
        .eq("isActive", true)
        .eq("products.name", "Starter")
        .eq("products.environment", environment)
        .limit(1)
        .single();
      
      console.log(`🔍 Starter price query result:`, { starterPrice, starterError });
      
      if (starterPrice?.stripePriceId) {
        basicPrice = starterPrice;
      } else {
        // Last resort: get any available monthly plan
        console.log(`🔍 No specific plan found, trying any available monthly plan...`);
        
        const { data: anyPrice, error: anyError } = await supabase
          .from("pricing")
          .select(`
            stripePriceId,
            billingCycle,
            productId,
            stripeProductId,
            product:products!inner (
              name,
              environment,
              stripeProductId
            )
          `)
          .eq("billingCycle", "monthly")
          .eq("isActive", true)
          .eq("products.environment", environment)
          .limit(1)
          .single();
        
        console.log(`🔍 Any available price query result:`, { anyPrice, anyError });
        
        if (anyPrice?.stripePriceId) {
          basicPrice = anyPrice;
          console.log(`✅ Found fallback pricing:`, basicPrice);
        } else {
          console.error(`❌ No pricing records found for any products in ${environment} environment`);
          console.error(`❌ Products found:`, allProducts);
          return NextResponse.json(
            { error: `No active pricing available for ${environment} environment. Please contact support.` },
            { status: 500 }
          );
        }
      }
    }

    // Check if the Stripe product is active
    console.log(`🔍 Checking Stripe product status for: ${basicPrice.stripeProductId}`);
    try {
      const stripeProduct = await stripe.products.retrieve(basicPrice.stripeProductId);
      console.log(`🔍 Stripe product status:`, { 
        id: stripeProduct.id, 
        active: stripeProduct.active,
        name: stripeProduct.name 
      });
      
      if (!stripeProduct.active) {
        return NextResponse.json(
          { error: "Selected plan is currently inactive. Please contact support." },
          { status: 500 }
        );
      }
    } catch (stripeError) {
      console.error(`🔍 Error checking Stripe product:`, stripeError);
      return NextResponse.json(
        { error: "Unable to verify plan status. Please contact support." },
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
      items: [{ price: basicPrice.stripePriceId }],
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
        subscriptionstatus: mapStripeStatusToDbStatus(stripeSubscription.status, false), // No payment method for initial trial
        subscriptionId: stripeSubscription.id,
        trialEndsAt: stripeSubscription.trial_end 
          ? new Date(stripeSubscription.trial_end * 1000).toISOString() 
          : null,
        planType: (basicPrice.product as any).name.toLowerCase().includes("essential") ? "starter" : 
                 (basicPrice.product as any).name.toLowerCase().includes("starter") ? "starter" : 
                 (basicPrice.product as any).name.toLowerCase().includes("creator") ? "pro" : 
                 (basicPrice.product as any).name.toLowerCase().includes("studio") ? "corporate" : "starter",
        billingCycle: "monthly",
        stripeMetadata: {
          customerId: stripeCustomer.id,
          subscriptionId: stripeSubscription.id,
          priceId: basicPrice.stripePriceId,
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
        planType: (basicPrice.product as any).name.toLowerCase().includes("essential") ? "starter" : 
                 (basicPrice.product as any).name.toLowerCase().includes("starter") ? "starter" : 
                 (basicPrice.product as any).name.toLowerCase().includes("creator") ? "pro" : 
                 (basicPrice.product as any).name.toLowerCase().includes("studio") ? "corporate" : "starter",
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
          priceId: basicPrice.stripePriceId,
          trialStart: stripeSubscription.trial_start,
          trialEnd: stripeSubscription.trial_end,
        },
      });

    if (subError) {
      console.error("Error creating subscription record:", subError);
      // Don't fail the organization creation for this
    }

    // Ensure the Stripe subscription has the organizationId in its metadata for future webhook updates
    try {
      await stripe.subscriptions.update(stripeSubscription.id, {
        metadata: {
          ...(stripeSubscription.metadata || {}),
          organizationId: organization.id,
          userId: user.id,
        },
      });
    } catch (e) {
      console.error("Failed to add organizationId to subscription metadata:", e);
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

    // Send Telegram notification for new trial
    try {
      await telegramService.notifyTrialStarted({
        organizationName: organization.name,
        userEmail: customerEmail,
        country: organization.country,
        baseCurrency: organization.baseCurrency,
        trialEndDate: organization.trialEndsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (telegramError) {
      console.error("Failed to send Telegram notification:", telegramError);
      // Don't fail the request if Telegram notification fails
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
