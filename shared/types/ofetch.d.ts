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
    /**
     * Opt this request out of the global API error toast. When `true`, a
     * failure on this exact request never raises `showGlobalErrorToast` — the
     * error still propagates to the caller and is still logged. Use for calls
     * whose failure is surfaced to the user in a better way inline (e.g.
     * `validateVatNumber`, where VAT validity is shown in the form), or for
     * background fetches where a generic toast would confuse the user.
     *
     * Request-scoped, unlike `withSuppressedErrorToast` (a time-window seam in
     * `useApiErrorToast`) — so it cannot swallow a concurrent unrelated failure.
     */
    suppressErrorToast?: boolean;
  }
}
