import { defineEventHandler, getCookie, setCookie } from 'h3';

export default defineEventHandler(async (event) => {
  const targetUrl = event.context.params?._;
  const action = targetUrl?.split('/')[0];

  if (!action) {
    return { message: 'Invalid endpoint' };
  }

  if (action === 'get') {
    const cookieName = targetUrl.split('/').pop();
    if (!cookieName) {
      return { message: 'Invalid cookie name' };
    }
    const cookieValue = getCookie(event, cookieName);
    return cookieValue;
  }

  if (action === 'set') {
    const [_, cookieName, cookieValue] = targetUrl.split('/');

    if (!cookieName || !cookieValue) {
      return { message: 'Invalid cookie name or value' };
    }
    setCookie(event, cookieName, cookieValue);
    console.log('cookie set', cookieName, cookieValue);
    return { message: `Cookie ${cookieName} set to ${cookieValue}` };
  }

  if (action === 'remove') {
    const cookieName = targetUrl.split('/').pop();
    if (!cookieName) {
      return { message: 'Invalid cookie name' };
    }
    setCookie(event, cookieName || '', '', { maxAge: 0 });
    console.log('cookie removed', cookieName);
    return { message: `Cookie ${cookieName} removed` };
  }

  return { message: 'Invalid endpoint' };
});
