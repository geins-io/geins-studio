// HOTFIX STU-216 — remove when BE handles config-refresh natively (STU-217)
import { createHmac, randomUUID } from 'node:crypto';

export async function refreshSalesPortal(hostname: string): Promise<void> {
  const { geinsLog, geinsLogError } = log(
    'server/utils/refresh-sales-portal.ts',
  );
  const secret = useRuntimeConfig().private.salesPortalWebhookSecret;
  if (!secret) {
    geinsLog('SALES_PORTAL_WEBHOOK_SECRET not set, skipping refresh');
    return;
  }

  const body = JSON.stringify({ hostname });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  try {
    await $fetch(`https://${hostname}/api/internal/webhook/config-refresh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-webhook-signature': `t=${timestamp},v1=${signature}`,
        'x-webhook-id': randomUUID(),
      },
      body,
      timeout: 5000,
    });
    geinsLog(`config-refresh sent to ${hostname}`);
  } catch (error) {
    geinsLogError(`config-refresh failed for ${hostname}`, error);
  }
}
