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
  const { geinsLog, geinsLogWarn } = log('server/api/[...].ts');

  let body;
  if (['POST', 'PUT', 'PATCH'].includes(event.method)) {
    body = await readBody(event);
  }

  const headers = getHeaders(event);
  const token = headers['x-access-token'];
  if (!token) {
    return { success: false, error: 'Access token is required' };
  }

  const targetUrl = event.context.params?._;
  if (!targetUrl) {
    return { success: false, error: 'Target URL is required' };
  }

  const fullUrl = `${config.public.apiUrl}/${targetUrl}`;

  geinsLog(fullUrl);

  const apiHeaders = {
    ...headers,
    'content-type': 'application/json',
    authorization: `Bearer ${token}`,
  };

  try {
    const response = await $fetch(fullUrl, {
      method: event.method,
      body,
      headers: apiHeaders,
    });
    return response;
  } catch (error) {
    // TODO: Evaluate if we should throw an error here
    geinsLogWarn('error connecting to the API:', error);
    return {
      success: false,
      error: 'Error connecting to the API',
    };
  }
});
