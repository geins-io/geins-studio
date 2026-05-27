import {
  createError,
  defineEventHandler,
  readBody,
  proxyRequest,
  getHeaders,
  getQuery,
  getRequestHost,
} from 'h3';
import { resolveAppId } from '#shared/utils/app';
import {
  refreshSalesPortal,
  describeFetchError,
} from '../utils/refresh-sales-portal';
import { useRuntimeConfig } from '#imports';

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

/**
 * Event handler for processing API requests.
 *
 * This handler is a catch-all for API requests that are not handled by other routes.
 * It forwards the request to the target API and returns the response.
 * The target API URL is specified in the request query string.
 * The handler adds the account key to the request headers.
 *
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { geinsLog, geinsLogInfo, geinsLogError } = log('server/api/[...].ts');

  const headers = getHeaders(event);
  const token = headers['x-access-token'];

  const targetUrl = event.context.params?._;
  if (!targetUrl) {
    return { success: false, error: 'Target URL is required' };
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

  geinsLog(fetchUrl);

  const apiHeaders: Record<string, string> = {
    ...headers,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };

  if (!apiHeaders['x-app']) {
    apiHeaders['x-app'] = resolveAppId(
      config.public.appId as string,
      getRequestHost(event, { xForwardedHost: true }),
    );
  }

  if (event.method === 'DELETE' && apiHeaders['content-length'] === '0') {
    delete apiHeaders['content-length'];
  }

  // HOTFIX STU-216 — match channel PATCH once, reuse in both branches below
  const channelPatchId: string | undefined =
    event.method === 'PATCH'
      ? event.path.match(CHANNEL_PATCH_RE)?.[1]
      : undefined;

  const contentType = headers['content-type'] ?? '';
  if (contentType.includes('multipart/form-data')) {
    const result = await proxyRequest(event, fetchUrl, { headers: apiHeaders });
    if (channelPatchId) {
      await triggerChannelRefresh(
        channelPatchId,
        config.public.apiUrl,
        apiHeaders,
      );
    }
    return result;
  }

  // Stream endpoints (e.g. /orchestrator/executions/:id/stream) need to be
  // piped through without buffering so the client gets incremental chunks.
  if (targetUrl.endsWith('/stream')) {
    return proxyRequest(event, fetchUrl, { headers: apiHeaders });
  }

  let body;
  if (['POST', 'PUT', 'PATCH'].includes(event.method)) {
    body = await readBody(event);
    geinsLogInfo(
      `${event.method} ${fetchUrl} body:`,
      JSON.stringify(body, null, 2),
    );
  }

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
    const fe = error as {
      name?: string;
      message?: string;
      statusCode?: number;
      statusMessage?: string;
      data?: unknown;
    };
    geinsLogError('error connecting to the api:', {
      url: fetchUrl,
      method: event.method,
      name: fe.name,
      message: fe.message,
      statusCode: fe.statusCode,
      statusMessage: fe.statusMessage,
      data: fe.data,
    });
    throw createError({
      statusCode: fe.statusCode || 500,
      statusMessage: fe.statusMessage || 'Internal Server Error',
      data: fe.data,
    });
  }
});
