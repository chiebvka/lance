import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch active products with their pricing
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        stripeProductId,
        name,
        description,
        metadata,
        isActive,
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
      .order("name");

    if (productsError) throw productsError;

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