import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Determine environment based on Stripe key
    const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
    const environment = isLiveMode ? 'live' : 'test';
    
    console.log(`🔍 Pricing API - Environment: ${environment} (isLiveMode: ${isLiveMode})`);

    // Fetch active products with their pricing for current environment
    // Only show Essential, Creator, and Studio plans
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        stripeProductId,
        name,
        description,
        metadata,
        isActive,
        environment,
        pricing (
          id,
          stripePriceId,
          currency,
          unitAmount,
          billingCycle,
          isActive
        )
      `)
      .eq("isActive", true)
      .eq("environment", environment)
      .in("name", ["Essential", "Creator", "Studio"])
      .order("name");

    if (productsError) throw productsError;

    console.log(`🔍 Pricing API - Found ${products?.length || 0} products for ${environment} environment:`, 
      products?.map(p => ({ name: p.name, environment: p.environment, pricingCount: p.pricing?.length || 0 }))
    );

    // Format the data for the frontend
    const formattedProducts = products?.map(product => ({
      id: product.stripeProductId,
      name: product.name,
      description: product.description,
      metadata: product.metadata,
      isActive: product.isActive,
      prices: product.pricing
        ?.filter(price => price.isActive)
        ?.map(price => ({
          id: price.stripePriceId,
          currency: price.currency,
          unit_amount: price.unitAmount,
          recurring: {
            interval: price.billingCycle,
            interval_count: 1,
          },
          type: "recurring",
          isActive: price.isActive,
        })) || [],
    })) || [];

    // Return the response in the expected format
    return NextResponse.json({
      products: formattedProducts
    });
  } catch (error) {
    console.error("Error fetching pricing data:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing data" },
      { status: 500 }
    );
  }
} 