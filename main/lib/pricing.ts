import axios from 'axios';

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  isActive: boolean;
  prices: Array<{
    id: string;
    currency: string;
    unit_amount: number;
    recurring?: {
      interval: string;
      interval_count: number;
    };
    type: string;
    isActive: boolean;
  }>;
}

export interface PricingData {
  products: StripeProduct[];
}

/**
 * Fetch all active products and their prices from the API
 */
export async function fetchPricingData(): Promise<PricingData> {
  try {
    const response = await axios.get('/api/pricing');
    
    // Ensure we have the expected structure
    if (!response.data || !response.data.products) {
      throw new Error('Invalid pricing data structure received');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching pricing data:', error);
    throw new Error('Failed to fetch pricing data');
  }
}

/**
 * Filter products to exclude corporate/custom plans
 */
export function filterActiveProducts(products: StripeProduct[]): StripeProduct[] {
  return products.filter((product) => {
    const name = product.name.toLowerCase();
    return (
      product.isActive &&
      !name.includes("custom") && 
      !name.includes("corporate")
    );
  });
}

/**
 * Get price for a specific billing cycle
 */
export function getPriceForCycle(
  product: StripeProduct, 
  billingCycle: "monthly" | "yearly"
): StripeProduct['prices'][0] | undefined {
  return product.prices.find(
    (price) =>
      price.recurring?.interval === billingCycle &&
      price.type === "recurring" &&
      price.isActive
  );
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string): string {
  const price = (amount / 100).toFixed(2);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(parseFloat(price));
}

/**
 * Calculate yearly discount percentage
 */
export function calculateYearlyDiscount(monthlyPrice: number, yearlyPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  const discount = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
  return Math.round(discount);
}
