import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export interface SearchItem {
  id: string;
  name: string;
  type?: string;
  url: string;
  relatedCategory?: string;
  customerId?: string;
  projectId?: string;
  [key: string]: any;
}

export interface SearchCategory {
  title: string;
  items: SearchItem[];
}

// Fetch recent items
const fetchRecentItems = async (): Promise<SearchCategory[]> => {
  const response = await fetch('/api/search');
  if (!response.ok) {
    throw new Error('Failed to fetch recent items');
  }
  return response.json();
};

// Fetch search results
const fetchSearchResults = async (query: string): Promise<SearchCategory[]> => {
  if (!query.trim()) return [];
  
  const response = await fetch(`/api/search?searchQuery=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch search results');
  }
  return response.json();
};

// Hook for recent items with prefetching
export function useRecentItems() {
  return useQuery({
    queryKey: ['recentItems'],
    queryFn: fetchRecentItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Hook for search results with debouncing built into React Query
export function useUniversalSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['universalSearch', query.trim()], // Trim query to avoid duplicate keys
    queryFn: () => fetchSearchResults(query.trim()),
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer caching
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount if data exists
    retry: 1, // Reduce retries to avoid spam
  });
}

// Hook for search optimization - prefetch recent items
export function useSearchOptimization() {
  const queryClient = useQueryClient();
  const recentItemsQuery = useRecentItems();

  // Prefetch recent items on mount
  useEffect(() => {
    // Prefetch recent items if not already cached
    if (!queryClient.getQueryData(['recentItems'])) {
      queryClient.prefetchQuery({
        queryKey: ['recentItems'],
        queryFn: fetchRecentItems,
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [queryClient]);

  // Prefetch common search queries when user starts typing (less aggressive)
  const prefetchCommonSearches = (partialQuery: string) => {
    if (partialQuery.length >= 3) { // Increase threshold to 3 characters
      const trimmedQuery = partialQuery.trim();
      
      // Only prefetch if not already cached
      const existingData = queryClient.getQueryData(['universalSearch', trimmedQuery]);
      if (!existingData) {
        queryClient.prefetchQuery({
          queryKey: ['universalSearch', trimmedQuery],
          queryFn: () => fetchSearchResults(trimmedQuery),
          staleTime: 5 * 60 * 1000,
        });
      }
    }
  };

  return {
    recentItems: recentItemsQuery.data || [],
    isLoadingRecent: recentItemsQuery.isLoading,
    isErrorRecent: recentItemsQuery.isError,
    errorRecent: recentItemsQuery.error,
    prefetchCommonSearches,
    invalidateSearch: () => {
      queryClient.invalidateQueries({ queryKey: ['universalSearch'] });
      queryClient.invalidateQueries({ queryKey: ['recentItems'] });
    },
  };
}

// Custom debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


