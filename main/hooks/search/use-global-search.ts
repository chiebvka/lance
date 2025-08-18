import { parseAsString, useQueryState } from 'nuqs';
import { useUniversalSearch, useSearchOptimization, useDebounce } from './use-search-optimization';

/**
 * Global search hook that works across all pages
 * This creates a global search state that persists across page navigation
 */
export function useGlobalSearch() {
  // Use a global search parameter that's not tied to any specific page
  const [globalSearchQuery, setGlobalSearchQuery] = useQueryState(
    'globalSearch',
    parseAsString.withDefault('').withOptions({
      clearOnDefault: true, // Remove from URL when empty
      history: 'replace', // Replace instead of push to avoid cluttering history
    })
  );

  // Debounce the search query for API calls (longer debounce to reduce calls)
  const debouncedQuery = useDebounce(globalSearchQuery, 500);

  // Get search results using the debounced query
  const searchResults = useUniversalSearch(debouncedQuery, true); // Always enabled for global search
  
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

  // Clear search function
  const clearSearch = () => {
    setGlobalSearchQuery('');
  };

  // Prefetch common searches as user types
  const handleSearchChange = (value: string) => {
    setGlobalSearchQuery(value);
    if (value.length >= 2) {
      searchOptimization.prefetchCommonSearches(value);
    }
  };

  return {
    // Current state
    searchQuery: globalSearchQuery,
    debouncedQuery,
    results,
    isLoading,
    error,
    
    // Actions
    setSearchQuery: handleSearchChange,
    clearSearch,
    
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
