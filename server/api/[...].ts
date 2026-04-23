import {
  defineEventHandler,
  readBody,
  proxyRequest,
  getHeaders,
  getQuery,
} from 'h3';
import { useRuntimeConfig } from '#imports';
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

  const apiHeaders = {
    ...headers,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };

  if (event.method === 'DELETE' && apiHeaders['content-length'] === '0') {
    delete apiHeaders['content-length'];
  }

  const contentType = headers['content-type'] ?? '';
  if (contentType.includes('multipart/form-data')) {
    return proxyRequest(event, fetchUrl, { headers: apiHeaders });
  }

  // Stream endpoints (e.g. /orchestrator/executions/:id/stream) need to be
  // piped through without buffering so the client gets incremental chunks.
  if (targetUrl.endsWith('/stream')) {
    return proxyRequest(event, fetchUrl, { headers: apiHeaders });
  }

  let body;
  if (['POST', 'PUT', 'PATCH'].includes(event.method)) {
    body = await readBody(event);
    geinsLogInfo(`${event.method} ${fetchUrl} body:`, body);
  }

  try {
    const response = await $fetch(fetchUrl, {
      method: event.method,
      body,
      headers: apiHeaders,
    });

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
    return error;
  }
});
