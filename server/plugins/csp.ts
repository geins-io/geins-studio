import { defineNitroPlugin } from 'nitropack/runtime';
import { cspHeaders } from '#shared/utils/security-headers';

// The SPA shell is rendered per request, and its inline scripts change with
// every build (importmap, buildId) and with runtime config, so the policy is
// hashed from the HTML being sent.
export default defineNitroPlugin((nitroApp) => {
  if (import.meta.dev) return;
  const vercelPreview = process.env.VERCEL_ENV === 'preview';
  nitroApp.hooks.hook('render:response', async (response) => {
    const contentType = String(response.headers?.['content-type'] ?? '');
    if (typeof response.body !== 'string' || !contentType.includes('html')) {
      return;
    }
    response.headers = {
      ...response.headers,
      ...(await cspHeaders(response.body, vercelPreview)),
    };
  });
});
