/**
 * Gateway failures: the API was briefly unreachable or too slow to answer.
 * `500` is left out: a fault in the API itself, which a retry only repeats.
 */
const TRANSIENT_STATUSES: readonly number[] = [502, 503, 504];

/**
 * Only reads retry. A `504` can arrive after the API has already done a
 * write, so a retried mutation could create or update twice.
 */
const RETRYABLE_METHODS = new Set(['GET', 'HEAD']);

/**
 * `$geinsApi`'s `retryStatusCodes`. A `401` retries only after
 * `createUnauthorizedRecovery` (`auth-recovery.ts`) forced a token refresh.
 */
export const API_RETRY_STATUS_CODES: readonly number[] = [
  401,
  ...TRANSIENT_STATUSES,
];

/** A failed `$geinsApi` response, with the ofetch retry options it carries. */
export interface TransientRetryRequest {
  status: number;
  method?: string;
  /** Retries left for this request, as ofetch reads it; `false` for none. */
  retry?: number | false;
  retryStatusCodes?: readonly number[];
}

/**
 * Whether `$geinsApi` should hand a failed response to ofetch's retry rather
 * than throw it: a gateway failure to a read that has a retry left. ofetch runs
 * `onResponseError` before its own retry, so the hook must return without
 * throwing to get one.
 *
 * It must match ofetch's own check exactly: if it says yes and ofetch doesn't
 * retry, ofetch throws its `FetchError` instead of our `GeinsApiError`.
 */
export const shouldRetryTransient = ({
  status,
  method = 'GET',
  retry,
  retryStatusCodes = API_RETRY_STATUS_CODES,
}: TransientRetryRequest): boolean => {
  if (
    !TRANSIENT_STATUSES.includes(status) ||
    !RETRYABLE_METHODS.has(method.toUpperCase()) ||
    !retryStatusCodes.includes(status)
  ) {
    return false;
  }
  // ofetch gives a non-payload method one retry when `retry` is unset.
  const retriesLeft = retry === false ? 0 : (retry ?? 1);
  return retriesLeft > 0;
};
