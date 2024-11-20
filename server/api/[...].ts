import { defineEventHandler, readBody, getHeaders } from 'h3';
import { useRuntimeConfig } from '#imports';
import { getToken, getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
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
    'x-account-key': config.public.accountKey as string,
    ...headers,
  };

  const token = await getToken({ event });
  if (token) {
    apiHeaders['Authorization'] = `Bearer ${token.accessToken}`;
  }

  // Make the API call
  const response = (await $fetch(fullUrl.toString(), {
    method: event.method,
    body,
    headers: apiHeaders,
  })) as Response;

  console.log('🚀 ~ catchall ~ response status:', response.status);

  // If response is unathorized, try to refresh the token
  // if (response.status === 401) {
  if (response) {
    // console log in big fat green letters that a retry has been made
    console.log(
      '%cRETRY FROM CATCH ALL 😈😈😈😈😈😈😈😈😈😈',
      'color: green; font-size: 16px; font-weight: bold;',
    );

    const session = await getServerSession(event);
    console.log('😈😈😈 ~ CATCH ALL ~ session:', session);

    if (session?.accessToken) {
      // Update the token in the headers
      apiHeaders['Authorization'] = `Bearer ${session?.accessToken}`;

      // Retry the request
      const retryResponse = await $fetch(fullUrl.toString(), {
        method: event.method,
        body,
        headers: apiHeaders,
      });

      return retryResponse;
    }
  }

  return response;
});
