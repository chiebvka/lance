import { parseAsString, useQueryState } from 'nuqs';
import { useUniversalSearch, useSearchOptimization, useDebounce } from './use-search-optimization';

/**
 * Hook that combines universal search with nuqs URL state management
 * This allows search queries to be persisted in the URL and shared/bookmarked
 */
export function useSearchWithNuqs() {
  // Use nuqs to manage search query in URL
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({
      clearOnDefault: true, // Remove from URL when empty
      history: 'push', // Push to browser history
    })
  );

  // Debounce the search query for API calls
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Get search results using the debounced query
  const searchResults = useUniversalSearch(debouncedQuery);
  
  // Get recent items and optimization features
  const searchOptimization = useSearchOptimization();

  // Determine what to show: search results or recent items
  const results = debouncedQuery.trim().length > 0 
    ? searchResults.data || []
    : searchOptimization.recentItems;
    
  const isLoading = debouncedQuery.trim().length > 0 
    ? searchResults.isLoading
    : searchOptimization.isLoadingRecent;

  const error = debouncedQuery.trim().length > 0 
    ? searchResults.error
    : searchOptimization.errorRecent;

  // Prefetch common searches as user types
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      searchOptimization.prefetchCommonSearches(value);
    }
  };

  return {
    // Current state
    searchQuery,
    debouncedQuery,
    results,
    isLoading,
    error,
    
    // Actions
    setSearchQuery: handleSearchChange,
    clearSearch: () => setSearchQuery(''),
    
    // Optimization features
    recentItems: searchOptimization.recentItems,
    isLoadingRecent: searchOptimization.isLoadingRecent,
    invalidateSearch: searchOptimization.invalidateSearch,
    
    // Computed states
    hasResults: results.some(category => category.items.length > 0),
    showEmptyState: !isLoading && debouncedQuery.trim() !== "" && !results.some(category => category.items.length > 0),
    isSearchActive: debouncedQuery.trim().length > 0,
  };
}
