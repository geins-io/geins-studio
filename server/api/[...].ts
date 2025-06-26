import { defineEventHandler, readBody, getHeaders, getQuery } from 'h3';
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
  const { geinsLog, geinsLogError } = log('server/api/[...].ts');

  let body;
  if (['POST', 'PUT', 'PATCH'].includes(event.method)) {
    body = await readBody(event);
  }

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
    authorization: `Bearer ${token}`,
  };

  if (event.method === 'DELETE' && apiHeaders['content-length'] === '0') {
    delete apiHeaders['content-length'];
  }

  try {
    const response = await $fetch(fetchUrl, {
      method: event.method,
      body,
      headers: apiHeaders,
    });

    return response;
  } catch (error) {
    geinsLogError('error connecting to the api:', error);
    return error;
  }
});
