/** Sent by `$geinsApi` on every request; a cross-site form can't set it. */
export const CSRF_HEADER = 'x-geins-csrf';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface CsrfRequest {
  method: string;
  /** Request host as the browser addressed it (honouring x-forwarded-host). */
  host: string;
  secFetchSite?: string;
  origin?: string;
  csrfHeader?: string;
}

/**
 * Why a state-changing request must be refused, or `undefined` to let it
 * through. Requires the custom header (a cross-origin page can only send it
 * after a CORS preflight we never answer) plus a same-origin signal:
 * `Sec-Fetch-Site` from every current browser, `Origin` as the fallback.
 * `same-site` is refused too: a sibling subdomain is another app.
 */
export function csrfRejection(req: CsrfRequest): string | undefined {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return undefined;
  if (req.secFetchSite !== undefined) {
    if (req.secFetchSite !== 'same-origin')
      return `sec-fetch-site ${req.secFetchSite}`;
  } else if (req.origin !== undefined) {
    let originHost: string;
    try {
      originHost = new URL(req.origin).host;
    } catch {
      return 'bad origin';
    }
    if (originHost !== req.host) return `origin ${originHost}`;
  }
  if (req.csrfHeader !== '1') return 'missing csrf header';
  return undefined;
}
