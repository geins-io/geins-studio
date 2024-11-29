import { defineEventHandler, readBody, getHeaders, getCookie } from 'h3';
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

  // parse cookies to se if auth-refresh exists
  const cookies = headers.cookie ? headers.cookie.split(';') : [];
  let hasAuthRefresh = false;
  cookies.forEach((cookie) => {
    const cookieName = cookie.split('=')[0].trim();
    if (cookieName === 'auth-refresh') {
      hasAuthRefresh = true;
    }
  });
  console.log('😈😈😈 ~ CATCH ALL ~ has auth-refresh cookie:', hasAuthRefresh);

  // Extract the target URL from the request
  const targetUrl = event.context.params?._;
  console.log('😈😈😈 ~ CATCH ALL ~ targetUrl:', targetUrl);

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
  console.log('😈😈😈 ~ CATCH ALL ~ server token:', token?.accessToken);

  const { wasRefreshedRecently, latestRefresh } = auth();
  const lr = new Date(Number(latestRefresh) * 1000);
  console.log('😈😈😈 ~ latest refresh:', lr);
  const recentlyRefreshed = latestRefresh
    ? wasRefreshedRecently(Number(latestRefresh))
    : false;
  console.log('😈😈😈 ~ recently refreshed:', recentlyRefreshed);

  try {
    // Make the API call
    console.log('😈😈😈 ~ CATCH ALL ~ making the call');
    console.log(
      "😈😈😈 ~ first call - apiHeaders['authorization']:",
      apiHeaders['authorization'],
    );
    const response = (await $fetch(fullUrl.toString(), {
      method: event.method,
      body,
      headers: apiHeaders,
    })) as Response;
    return response;
  } catch (error) {
    if (error.response && error.response.status === 401 && !recentlyRefreshed) {
      console.log('😈😈😈 401 - RETRY FROM CATCH ALL');

      const session = await getServerSession(event);

      console.log('😈😈😈 ~ CATCH ALL ~ RETRY new session:', session);

      if (session?.isAuthorized) {
        // Update the token in the headers
        apiHeaders['authorization'] = `Bearer ${session?.accessToken}`;

        console.log(
          "😈😈😈 ~ retry ~ apiHeaders['authorization']:",
          apiHeaders['authorization'],
        );

        // Retry the request
        const retryResponse = await $fetch(fullUrl.toString(), {
          method: event.method,
          body,
          headers: apiHeaders,
        });

        return retryResponse;
      }
    }

    // Handle other errors here
    console.warn('Error connecting to the API:', error);
  }
});
