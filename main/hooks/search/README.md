# Search Optimization Hooks

This directory contains optimized React Query-based hooks for universal search functionality with performance optimizations.

## Features

### 🚀 Performance Optimizations
- **React Query Caching**: Results are cached for 2-5 minutes to reduce API calls
- **Prefetching**: Recent items are prefetched on app load
- **Debounced Search**: 300ms debounce to reduce unnecessary API calls
- **Smart Prefetching**: Common search patterns are prefetched as user types

### 🔗 URL State Management
- **nuqs Integration**: Search queries are persisted in URL for sharing/bookmarking
- **Browser History**: Search state is pushed to browser history
- **Clean URLs**: Empty searches are removed from URL automatically

### 🛡️ Rate Limiting & Security
- **API Rate Limiting**: Search API is rate-limited to prevent abuse
- **Authentication**: All search requests require valid user authentication
- **Organization Scoping**: Results are scoped to user's organization

## Hooks

### `useSearchOptimization()`
Main optimization hook that handles prefetching and cache management.

```tsx
const searchOptimization = useSearchOptimization();
// Automatically prefetches recent items on mount
```

### `useUniversalSearch(query, enabled)`
Hook for fetching search results with React Query caching.

```tsx
const { data, isLoading, error } = useUniversalSearch("customer name", true);
```

### `useRecentItems()`
Hook for fetching recent items with long-term caching.

```tsx
const { data: recentItems, isLoading } = useRecentItems();
```

### `useSearchWithNuqs()`
Combined hook that integrates search with URL state management.

```tsx
const {
  searchQuery,
  setSearchQuery,
  results,
  isLoading,
  hasResults,
  showEmptyState,
  isSearchActive
} = useSearchWithNuqs();
```

## Usage Example

```tsx
import { useSearchWithNuqs } from '@/hooks/search';

function SearchComponent() {
  const {
    searchQuery,
    setSearchQuery,
    results,
    isLoading,
    isSearchActive
  } = useSearchWithNuqs();

  return (
    <div>
      <input 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
      />
      
      {!isSearchActive && <RecentItems />}
      {isLoading && <LoadingSpinner />}
      {results.map(category => (
        <SearchCategory key={category.title} category={category} />
      ))}
    </div>
  );
}
```

## Cache Configuration

- **Recent Items**: 5 minutes stale time, 10 minutes garbage collection
- **Search Results**: 2 minutes stale time, 5 minutes garbage collection
- **API Cache**: 5 minutes server-side cache with NodeCache

## API Endpoints

- `GET /api/search` - Fetch recent items
- `GET /api/search?searchQuery=term` - Search with query

Both endpoints include:
- Rate limiting (IP-based)
- Authentication checks
- Organization scoping
- Response caching
