// HOTFIX STU-216 — remove when BE handles config-refresh natively (STU-217)
import { refreshSalesPortal, describeFetchError } from '../utils/refresh-sales-portal';

const CHANNEL_PATCH_RE = /^\/api\/account\/channel\/([^/?]+)(\?|$)/;

export default defineNitroPlugin((nitroApp) => {
  const { geinsLogError } = log('server/plugins/refresh-sales-portal.ts');

  nitroApp.hooks.hook('beforeResponse', async (event) => {
    if (event.method !== 'PATCH') return;
    const match = event.path.match(CHANNEL_PATCH_RE);
    if (!match) return;
    const channelId = match[1];

    const status = getResponseStatus(event);
    if (status < 200 || status >= 300) return;

    // Multipart PATCH (image uploads) is streamed by proxyRequest in
    // server/api/[...].ts, so the response body in this hook isn't a parsed
    // object. GET the channel to read its `url` — works regardless of
    // content-type or whether the BE echoes the channel on PATCH.
    const config = useRuntimeConfig(event);
    const incoming = getRequestHeaders(event);
    const token = incoming['x-access-token'];
    const headers: Record<string, string> = {
      ...(Object.fromEntries(
        Object.entries(incoming).filter(([, v]) => v !== undefined),
      ) as Record<string, string>),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    };
    delete headers.host;
    delete headers['content-length'];
    delete headers['content-type'];

    const channelUrl = `${config.public.apiUrl}/account/channel/${channelId}`;
    let url: string | undefined;
    try {
      const channel = await $fetch<{ url?: string }>(channelUrl, {
        headers,
        timeout: 5000,
      });
      url = channel?.url;
    } catch (err) {
      geinsLogError(
        `GET ${channelUrl} failed :: ${describeFetchError(err)}`,
      );
      return;
    }
    if (!url) return;

    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      return;
    }

    // Awaited so Preview's window.open fires after the storefront has
    // refreshed its config. refreshSalesPortal swallows its own errors
    // (incl. the 5s timeout) so this never blocks PATCH from returning 200.
    await refreshSalesPortal(hostname);
  });
});
