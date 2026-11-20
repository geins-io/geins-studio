import { randomUUID } from 'node:crypto';
import {
  createError,
  defineEventHandler,
  readBody,
  readRawBody,
  sendProxy,
  getHeaders,
  getQuery,
  getRequestHost,
  sendRedirect,
  setResponseHeader,
  type H3Event,
} from 'h3';
import { useRuntimeConfig } from 'nitropack/runtime';
import { resolveAppId } from '#shared/utils/app';
import {
  isGeinsAuthPath,
  isMediaRedirectPath,
  pickUpstreamHeaders,
} from '#shared/utils/proxy-headers';
import { describeNetworkError } from '../utils/error-logging';
import {
  refreshSalesPortal,
  describeFetchError,
} from '../utils/refresh-sales-portal';
import { readSealedSession } from '../utils/sealed-session';

// HOTFIX STU-216 — remove when BE handles config-refresh natively (STU-217)
const CHANNEL_PATCH_RE = /^\/api\/account\/channel\/([^/?]+)(\?|$)/;
async function triggerChannelRefresh(
  channelId: string,
  apiBase: string,
  apiHeaders: Record<string, string | undefined>,
) {
  const { geinsLogInfo, geinsLogError } = log('server/api/[...].ts:STU-216');
  let url: string | undefined;
  try {
    const channel = await $fetch<Record<string, unknown>>(
      `${apiBase}/account/channel/${channelId}`,
      {
        headers: apiHeaders as Record<string, string>,
        timeout: 5000,
      },
    );
    url = channel?.url as string | undefined;
    if (!url) {
      geinsLogInfo(
        `[STU-216] GET channel ${channelId} ok but no "url"; keys=${JSON.stringify(
          Object.keys(channel ?? {}),
        )}`,
      );
      return;
    }
  } catch (err) {
    geinsLogError(
      `[STU-216] GET channel ${channelId} failed :: ${describeFetchError(err)}`,
    );
    return;
  }
  try {
    const hostname = new URL(url).hostname;
    await refreshSalesPortal(hostname);
  } catch (err) {
    geinsLogError(`[STU-216] invalid url "${url}" :: ${String(err)}`);
  }
}

const PAYLOAD_METHODS = new Set(['PATCH', 'POST', 'PUT', 'DELETE']);

// h3's `proxyRequest` lays every inbound header (cookie included) under the
// ones passed in and can't drop any, so pipe through `sendProxy` with ours only.
async function pipeUpstream(
  event: H3Event,
  target: string,
  headers: Record<string, string>,
) {
  const raw = PAYLOAD_METHODS.has(event.method)
    ? await readRawBody(event, false)
    : undefined;
  // fetch's `BodyInit` doesn't take Node's `Buffer<ArrayBufferLike>`.
  const body = raw && new Uint8Array(raw);
  return sendProxy(event, target, {
    fetchOptions: { method: event.method, body, headers },
    // Never Geins' cookies; the JSON path doesn't forward them either.
    onResponse: (proxied) => proxied.node.res.removeHeader('set-cookie'),
  });
}

// Media's view/download answer a 302 to a signed URL that lives an hour.
// `$fetch` would follow it and pull the file through the function, so hand the
// redirect to the browser. Never log the location: it carries the token.
async function passRedirect(
  event: H3Event,
  target: string,
  headers: Record<string, string>,
  correlationId: string,
) {
  const { geinsLogError } = log('server/api/[...].ts');
  let upstream: Response;
  try {
    upstream = await fetch(target, { headers, redirect: 'manual' });
  } catch (error) {
    geinsLogError(
      `[upstream_unreachable] [${correlationId}] ${JSON.stringify({
        url: target,
        network: describeNetworkError(error),
      })}`,
    );
    throw createError({ statusCode: 502, statusMessage: 'Bad Gateway' });
  }
  const location = upstream.headers.get('location');
  if (
    upstream.status >= 300 &&
    upstream.status < 400 &&
    location?.startsWith('https://')
  ) {
    setResponseHeader(event, 'cache-control', 'no-store');
    return sendRedirect(event, location, 302);
  }
  const statusCode = upstream.status >= 400 ? upstream.status : 502;
  geinsLogError(
    `[upstream_error] [${correlationId}] ${JSON.stringify({
      url: target,
      statusCode: upstream.status,
    })}`,
  );
  throw createError({
    statusCode,
    statusMessage:
      upstream.statusText ||
      (statusCode === 404 ? 'Not Found' : 'Upstream Error'),
  });
}

/**
 * Event handler for processing API requests.
 *
 * This handler is a catch-all for API requests that are not handled by other routes.
 * It forwards the request to the target API and returns the response.
 * The target API URL is specified in the request query string.
 * Only allowlisted headers go upstream (`pickUpstreamHeaders`); the token and
 * account key come from the sealed session.
 *
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { geinsLog, geinsLogError } = log('server/api/[...].ts');

  // Proxy-side correlation id — present in every log line for this request even
  // when the call never reaches the backend (so there is no backend traceId).
  // Lets a window of failures be grouped from the proxy logs alone.
  const correlationId = randomUUID();

  const headers = getHeaders(event);

  const targetUrl = event.context.params?._;
  if (!targetUrl) {
    return { success: false, error: 'Target URL is required' };
  }
  if (isGeinsAuthPath(targetUrl)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' });
  }

  const fullUrl = `${config.public.apiUrl}/${targetUrl}`;

  const query = getQuery(event);
  const queryStr = Object.keys(query)
    .map((key) => {
      const value = query[key];
      if (Array.isArray(value)) {
        return value
          .map((v) => `${key}=${encodeURIComponent(String(v))}`)
          .join('&');
      }
      return value !== undefined
        ? `${key}=${encodeURIComponent(String(value))}`
        : '';
    })
    .filter(Boolean)
    .join('&');
  const fetchUrl = queryStr ? `${fullUrl}?${queryStr}` : fullUrl;

  geinsLog(`[${correlationId}] ${event.method} ${fetchUrl}`);

  // The cookie as it is: the proxy never refreshes or writes the session. Only
  // the session routes refresh, under the client's Web Lock; an expired token
  // comes back 401, and `$geinsApi` force-refreshes and retries.
  const session = await readSealedSession(event);
  const apiHeaders = pickUpstreamHeaders(headers, {
    accessToken: session.secure?.accessToken,
    accountKey: session.accountKey,
  });

  if (!apiHeaders['x-app']) {
    apiHeaders['x-app'] = resolveAppId(
      config.public.appId as string,
      getRequestHost(event, { xForwardedHost: true }),
    );
  }

  // HOTFIX STU-216 — match channel PATCH once, reuse in both branches below
  const channelPatchId: string | undefined =
    event.method === 'PATCH'
      ? event.path.match(CHANNEL_PATCH_RE)?.[1]
      : undefined;

  const contentType = headers['content-type'] ?? '';
  if (contentType.includes('multipart/form-data')) {
    const result = await pipeUpstream(event, fetchUrl, apiHeaders);
    if (channelPatchId) {
      await triggerChannelRefresh(
        channelPatchId,
        config.public.apiUrl,
        apiHeaders,
      );
    }
    return result;
  }

  if (event.method === 'GET' && isMediaRedirectPath(targetUrl)) {
    return passRedirect(event, fetchUrl, apiHeaders, correlationId);
  }

  // Stream endpoints (e.g. /orchestrator/executions/:id/stream) need to be
  // piped through without buffering so the client gets incremental chunks.
  if (targetUrl.endsWith('/stream')) {
    return pipeUpstream(event, fetchUrl, apiHeaders);
  }

  let body;
  if (['POST', 'PUT', 'PATCH'].includes(event.method)) {
    body = await readBody(event);
  }

  const startedAt = Date.now();
  try {
    const response = await $fetch(fetchUrl, {
      method: event.method,
      body,
      headers: apiHeaders,
    });

    if (channelPatchId) {
      await triggerChannelRefresh(
        channelPatchId,
        config.public.apiUrl,
        apiHeaders,
      );
    }
    return response;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const fe = error as {
      name?: string;
      message?: string;
      statusCode?: number;
      statusMessage?: string;
      data?: unknown;
    };

    // No statusCode on the caught error means the request never reached the
    // backend (DNS/TLS/ECONNRESET/timeout); a statusCode means the backend
    // responded with an error. Tag the two cases distinctly.
    const reachedBackend = typeof fe.statusCode === 'number';
    const tag = reachedBackend ? 'upstream_error' : 'upstream_unreachable';
    const network = describeNetworkError(error);

    // Serialise into a single string — Vercel's log UI drops the 2nd arg of
    // console.error when it is an object (see describeFetchError).
    geinsLogError(
      `[${tag}] [${correlationId}] ${JSON.stringify({
        url: fetchUrl,
        method: event.method,
        durationMs,
        name: fe.name,
        message: fe.message,
        statusCode: fe.statusCode,
        statusMessage: fe.statusMessage,
        data: fe.data,
        network,
      })}`,
    );

    // When there is no upstream `data` (the unreachable case), attach a minimal
    // proxy-side diagnostic so the client/toast has something traceable instead
    // of `undefined`. The message is intentionally generic — the detailed cause
    // (which can contain internal hostnames / DNS errors) stays in the server
    // log above; the client gets `correlationId` + `code` to trace it.
    const data =
      fe.data ??
      (reachedBackend
        ? undefined
        : {
            proxyError: true,
            reason: tag,
            correlationId,
            code: network.code,
            message: 'Upstream request failed before reaching the backend',
          });

    throw createError({
      statusCode: fe.statusCode || 500,
      statusMessage: fe.statusMessage || 'Internal Server Error',
      data,
    });
  }
});
