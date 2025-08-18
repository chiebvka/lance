// Export all search-related hooks from a single entry point
export {
  useRecentItems,
  useUniversalSearch,
  useSearchOptimization,
  useDebounce,
  type SearchItem,
  type SearchCategory,
} from './use-search-optimization';

export {
  useSearchWithNuqs,
} from './use-search-with-nuqs';

export {
  useGlobalSearch,
} from './use-global-search';
