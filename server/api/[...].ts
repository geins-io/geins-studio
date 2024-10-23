import { defineEventHandler, readBody, getHeaders } from 'h3';
import { useRuntimeConfig } from '#imports';
import { getToken } from '#auth';

export default defineEventHandler(async (event) => {
  console.log('Received request:', event.method, event.path);
  const config = useRuntimeConfig(event);

  // Only read body for methods that typically include one
  let body;
  if (['POST', 'PUT', 'PATCH'].includes(event.method)) {
    body = await readBody(event);
  }
  const headers = getHeaders(event);

  // Extract the target URL from the request
  const targetUrl = event.context.params?._;

  if (!targetUrl) {
    return { success: false, error: 'Target URL is required' };
  }
  const fullUrl = `${config.public.apiBase}/${targetUrl}`;

  // Prepare headers
  const apiHeaders = {
    'x-account-key': config.public.accountKey,
    ...headers, // Include original headers
  };

  const token = await getToken({ event });
  if (token) {
    apiHeaders['Authorization'] = `Bearer ${token.accessToken}`;
  }

  // Make the API call
  const response = await $fetch(fullUrl.toString(), {
    method: event.method,
    body,
    headers: apiHeaders,
  });

  return response;
});
