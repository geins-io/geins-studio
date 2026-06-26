import type { GeinsErrorContext } from './Global';

/**
 * Augment ofetch's FetchOptions with Geins-specific options so they are
 * first-class across all $geinsApi / repository calls and the plugin
 * interceptors (ResolvedFetchOptions extends FetchOptions, so it inherits this).
 */
declare module 'ofetch' {
  interface FetchOptions {
    /**
     * Per-request context for the global API error toast. When set, a failed
     * mutation renders the specific `error_{action}_entity` message instead of
     * the generic fallback. See {@link GeinsErrorContext}.
     */
    errorContext?: GeinsErrorContext;
  }
}
