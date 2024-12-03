import { defineEventHandler, readBody, getHeaders } from 'h3';
import { useRuntimeConfig } from '#imports';
/**
 * Event handler for processing API requests.
 *
 * This handler processes incoming HTTP requests, reads the request body if the method is POST, PUT, or PATCH,
 * and forwards the request to a target URL specified in the event context parameters. It also includes custom
 * headers required for the API request.
 *
 * @param {H3Event} event - The event object representing the incoming request.
 * @returns {Promise<Response | { success: boolean, error: string }>} - The response from the target API or an error message if the target URL is missing.
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
    // throw error;
  }
});
