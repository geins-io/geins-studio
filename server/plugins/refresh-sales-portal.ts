// HOTFIX STU-216 — remove when BE handles config-refresh natively (STU-217)
import { refreshSalesPortal } from '../utils/refresh-sales-portal';

const CHANNEL_PATCH_RE = /^\/api\/account\/channel\/[^/?]+(\?|$)/;

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event, { body }) => {
    if (event.method !== 'PATCH') return;
    if (!CHANNEL_PATCH_RE.test(event.path)) return;
    const status = getResponseStatus(event);
    if (status < 200 || status >= 300) return;

    try {
      const url = (body as { url?: string } | undefined)?.url;
      if (!url) return;
      const hostname = new URL(url).hostname;
      // fire-and-forget — never block response
      refreshSalesPortal(hostname).catch(() => {});
    } catch {
      // invalid url / bad shape — swallow silently
    }
  });
});
