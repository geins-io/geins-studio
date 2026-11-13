// @vitest-environment node
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, vi } from 'vitest';
import {
  API_RETRY_STATUS_CODES,
  shouldRetryTransient,
  type TransientRetryRequest,
} from '../api-retry';
import type { $Fetch, CreateFetchOptions } from 'ofetch';

// The ofetch Nuxt's `$fetch` is built on (it isn't our own dependency), so a
// Nuxt upgrade that changes how ofetch retries fails here.
const nuxtPackage = realpathSync(
  fileURLToPath(
    new URL('../../../node_modules/nuxt/package.json', import.meta.url),
  ),
);
const { createFetch } = createRequire(nuxtPackage)('ofetch') as {
  createFetch: (options?: CreateFetchOptions) => $Fetch;
};

const failedRead: TransientRetryRequest = {
  status: 503,
  method: 'GET',
  retry: 1,
  retryStatusCodes: API_RETRY_STATUS_CODES,
};

describe('shouldRetryTransient', () => {
  it.each([502, 503, 504])('retries a read that got a %i', (status) => {
    expect(shouldRetryTransient({ ...failedRead, status })).toBe(true);
  });

  it('retries HEAD, and a method in any case', () => {
    expect(shouldRetryTransient({ ...failedRead, method: 'HEAD' })).toBe(true);
    expect(shouldRetryTransient({ ...failedRead, method: 'get' })).toBe(true);
  });

  it('treats a request without a method as a GET', () => {
    expect(shouldRetryTransient({ ...failedRead, method: undefined })).toBe(
      true,
    );
  });

  it.each(['POST', 'PATCH', 'PUT', 'DELETE'])(
    'never retries a %s, which the API may already have done',
    (method) => {
      expect(shouldRetryTransient({ ...failedRead, method })).toBe(false);
    },
  );

  it.each([500, 401, 404, 409, 429])('does not retry a %i', (status) => {
    expect(shouldRetryTransient({ ...failedRead, status })).toBe(false);
  });

  it('throws on the last attempt, so the caller gets a GeinsApiError', () => {
    expect(shouldRetryTransient({ ...failedRead, retry: 0 })).toBe(false);
    expect(shouldRetryTransient({ ...failedRead, retry: false })).toBe(false);
  });

  it('follows ofetch: an unset retry gives a read one retry', () => {
    expect(shouldRetryTransient({ ...failedRead, retry: undefined })).toBe(
      true,
    );
  });

  it('does not retry a status the call took out of retryStatusCodes', () => {
    expect(
      shouldRetryTransient({ ...failedRead, retryStatusCodes: [401, 502] }),
    ).toBe(false);
  });
});

describe('$geinsApi retries with the ofetch Nuxt ships', () => {
  class ApiError extends Error {}

  // Answers each call with the next status, and hooks the decision in the way
  // `$geinsApi` does: return to let ofetch retry, otherwise throw our error.
  const apiReturning = (...statuses: number[]) => {
    const fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: statuses.shift() ?? 500,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const api = createFetch({ fetch }).create({
      retryStatusCodes: [...API_RETRY_STATUS_CODES],
      retry: 1,
      retryDelay: 0,
      onResponseError({ response, options }) {
        if (
          shouldRetryTransient({
            status: response.status,
            method: options.method,
            retry: options.retry,
            retryStatusCodes: options.retryStatusCodes,
          })
        ) {
          return;
        }
        throw new ApiError(String(response.status));
      },
    });
    return { api, fetch };
  };

  it('retries a read once and resolves', async () => {
    const { api, fetch } = apiReturning(503, 200);
    await expect(api('/x')).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws our error, not a FetchError, when the retry fails too', async () => {
    const { api, fetch } = apiReturning(503, 504);
    const error = await api('/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toHaveProperty('message', '504');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('never retries a mutation', async () => {
    const { api, fetch } = apiReturning(503, 200);
    const error = await api('/x', { method: 'POST', body: {} }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toHaveProperty('message', '503');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
