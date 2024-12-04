import { defineEventHandler, readBody, getHeaders } from 'h3';
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

  let body;
  if (['POST', 'PUT', 'PATCH'].includes(event.method)) {
    body = await readBody(event);
  }
  const headers = getHeaders(event);

  const targetUrl = event.context.params?._;

  if (!targetUrl) {
    return { success: false, error: 'Target URL is required' };
  }
  const fullUrl = `${config.public.apiBase}/${targetUrl}`;

  const apiHeaders = {
    'x-account-key': config.public.accountKey as string,
    ...headers,
  };

  try {
    const response = (await $fetch(fullUrl, {
      method: event.method,
      body,
      headers: apiHeaders,
    })) as Response;
    return response;
  } catch (error) {
    console.warn('Error connecting to the API:', error);
  }
});
