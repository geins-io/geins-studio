// HOTFIX STU-216 — remove when BE handles config-refresh natively (STU-217)
import { createHmac, randomUUID } from 'node:crypto';

/**
 * Serialise a thrown $fetch error into a single string so Vercel's log UI
 * renders the relevant fields (it drops the 2nd arg of console.error when it
 * is an object). Exported so the plugin can use the same format for its GET.
 */
export function describeFetchError(err: unknown): string {
  const e = err as {
    name?: string;
    message?: string;
    status?: number;
    statusCode?: number;
    statusText?: string;
    statusMessage?: string;
    data?: unknown;
    cause?: { code?: string; message?: string } | string;
  };
  let cause: unknown;
  if (e && typeof e === 'object' && 'cause' in e) {
    const c = e.cause;
    cause = typeof c === 'string' ? c : { code: c?.code, message: c?.message };
  }
  return JSON.stringify({
    name: e?.name,
    message: e?.message,
    status: e?.status ?? e?.statusCode,
    statusText: e?.statusText ?? e?.statusMessage,
    data: e?.data,
    cause,
  });
}

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
  const target = `https://${hostname}/api/internal/webhook/config-refresh`;

  try {
    await $fetch(target, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-webhook-signature': `t=${timestamp},v1=${signature}`,
        'x-webhook-id': randomUUID(),
      },
      body,
      // 15s to accommodate cold-start on the storefront webhook handler when
      // the request comes from Vercel egress (works fast from localhost, slow
      // from arn1). Vercel Pro function timeout is well above this.
      timeout: 15000,
    });
    geinsLog(`config-refresh sent to ${hostname}`);
  } catch (error) {
    geinsLogError(
      `config-refresh failed POST ${target} :: ${describeFetchError(error)}`,
    );
  }
}
