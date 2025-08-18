import { QueryClient } from '@tanstack/react-query';

/**
 * Utility functions for prefetching search results
 * This can be used in components that want to prefetch search data
 */

const fetchRecentItems = async (): Promise<any[]> => {
  const response = await fetch('/api/search');
  if (!response.ok) throw new Error('Failed to fetch recent items');
  return response.json();
};

const fetchSearchResults = async (query: string): Promise<any[]> => {
  if (!query.trim()) return [];
  const response = await fetch(`/api/search?searchQuery=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to fetch search results');
  return response.json();
};

/**
 * Prefetch recent items
 */
export const prefetchRecentItems = (queryClient: QueryClient) => {
  return queryClient.prefetchQuery({
    queryKey: ['recentItems'],
    queryFn: fetchRecentItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Prefetch search results for a specific query
 */
export const prefetchSearchResults = (queryClient: QueryClient, query: string) => {
  if (!query.trim()) return Promise.resolve();
  
  return queryClient.prefetchQuery({
    queryKey: ['universalSearch', query],
    queryFn: () => fetchSearchResults(query),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Prefetch common search patterns based on a partial query
 */
export const prefetchCommonSearchPatterns = (queryClient: QueryClient, partialQuery: string) => {
  if (partialQuery.length < 2) return Promise.resolve();

  const commonPatterns = [
    partialQuery,
    `${partialQuery} project`,
    `${partialQuery} customer`,
    `${partialQuery} invoice`,
    `${partialQuery} receipt`,
  ];

  return Promise.all(
    commonPatterns.map(pattern => prefetchSearchResults(queryClient, pattern))
  );
};

/**
 * Invalidate all search-related queries
 */
export const invalidateAllSearchQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['universalSearch'] });
  queryClient.invalidateQueries({ queryKey: ['recentItems'] });
};
