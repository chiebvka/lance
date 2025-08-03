"use client";

import { useQuery } from '@tanstack/react-query';
import { fetchPricingData, type PricingData, type StripeProduct } from '@/lib/pricing';

/**
 * React Query hook to fetch and cache pricing data
 * Cache duration: 30 minutes (1800000 ms)
 */
export function usePricing() {
  return useQuery<PricingData, Error>({
    queryKey: ['pricing'],
    queryFn: fetchPricingData,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to get filtered pricing data (excluding corporate/custom plans)
 */
export function useFilteredPricing() {
  const { data, isLoading, isError, error } = usePricing();
  
  const filteredProducts = data?.products?.filter((product: StripeProduct) => {
    const name = product.name.toLowerCase();
    return (
      product.isActive &&
      !name.includes("custom") && 
      !name.includes("corporate")
    );
  }) || [];

  return {
    products: filteredProducts,
    isLoading,
    isError,
    error,
    rawData: data
  };
} 