/** Media CDN: QA serves `cdn-qa.geins.media`, prod `cdn.litium.media`. */
export const MEDIA_CDN_ORIGINS = [
  'https://cdn-qa.geins.media',
  'https://cdn.litium.media',
];

/**
 * Upload plan URLs are Azure Blob SAS URLs: asset bytes are `PUT` there
 * straight from the browser, not through the proxy. Narrow this to the
 * storage accounts before the CSP is enforced — the wildcard admits any
 * Azure account.
 */
export const UPLOAD_ORIGINS = ['https://*.blob.core.windows.net'];

/** Product images: `https://{account}.commerce.services/product/…`. */
export const PRODUCT_IMAGE_ORIGINS = ['https://*.commerce.services'];

/** The storefront font picker loads its previews from Google Fonts. */
const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com';
const GOOGLE_FONTS_FILES = 'https://fonts.gstatic.com';

export const CSP_REPORT_PATH = '/api/csp-report';

/** Sent on every response, static assets included. */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

type Directive =
  | 'default-src'
  | 'script-src'
  | 'style-src'
  | 'font-src'
  | 'img-src'
  | 'connect-src'
  | 'frame-src'
  | 'object-src'
  | 'base-uri'
  | 'form-action';

/** Vercel's toolbar (comments, feedback) on preview deploys. */
const VERCEL_PREVIEW_SOURCES: Partial<Record<Directive, string[]>> = {
  'script-src': ['https://vercel.live'],
  'style-src': ['https://vercel.live'],
  'font-src': ['https://vercel.live', 'https://assets.vercel.com'],
  'img-src': ['https://vercel.live', 'https://vercel.com'],
  'connect-src': ['https://vercel.live', 'wss://ws-us3.pusher.com'],
  'frame-src': ['https://vercel.live'],
};

export interface CspOptions {
  /** Hash sources (`'sha256-…'`) for the document's inline scripts. */
  scriptHashes: string[];
  /** Adds the Vercel toolbar's sources (preview deploys only). */
  vercelPreview?: boolean;
}

/**
 * The report-only policy for an HTML document. Vercel Analytics and Speed
 * Insights load and beacon from the deploy's own `/_vercel/*`, so `'self'`
 * covers them.
 */
export function contentSecurityPolicy({
  scriptHashes,
  vercelPreview = false,
}: CspOptions): string {
  const directives: Record<Directive, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", ...scriptHashes],
    // Vue's :style bindings and reka-ui's positioning write inline styles.
    'style-src': ["'self'", "'unsafe-inline'", GOOGLE_FONTS_CSS],
    'font-src': ["'self'", GOOGLE_FONTS_FILES],
    // blob: is FormInputImage's preview of a picked file.
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      ...MEDIA_CDN_ORIGINS,
      ...PRODUCT_IMAGE_ORIGINS,
    ],
    // The zip download fetches files from the CDN and a replace HEADs it.
    'connect-src': ["'self'", ...MEDIA_CDN_ORIGINS, ...UPLOAD_ORIGINS],
    'frame-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };
  if (vercelPreview) {
    for (const [name, sources] of Object.entries(VERCEL_PREVIEW_SOURCES)) {
      directives[name as Directive].push(...sources);
    }
  }
  return [
    ...Object.entries(directives).map(
      ([name, sources]) => `${name} ${sources.join(' ')}`,
    ),
    // report-uri only: Chrome ignores it once `report-to` is present, and its
    // Reporting API never delivered to this endpoint in testing.
    `report-uri ${CSP_REPORT_PATH}`,
  ].join('; ');
}

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const SRC_ATTR_RE = /(?:^|\s)src\s*=/i;
const TYPE_ATTR_RE = /(?:^|\s)type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
const JS_MIME_RE = /^(?:text|application)\/(?:x-)?(?:java|ecma)script$/;
// Script types the browser runs under script-src. JSON payloads
// (`application/json`, `ld+json`) are data and need no hash.
const EXECUTABLE_TYPES = new Set([
  '',
  'module',
  'importmap',
  'speculationrules',
]);

function isExecutableScript(attrs: string): boolean {
  if (SRC_ATTR_RE.test(attrs)) return false;
  const match = TYPE_ATTR_RE.exec(attrs);
  const type = (match?.[1] ?? match?.[2] ?? match?.[3] ?? '')
    .trim()
    .toLowerCase();
  return EXECUTABLE_TYPES.has(type) || JS_MIME_RE.test(type);
}

async function sha256Source(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  );
  return `'sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}'`;
}

/**
 * Hash sources for every inline script in `html`. Hashed from the HTML that
 * is actually served, so Nuxt's config script, the importmap, the color-mode
 * script and app-skeleton.html can never drift from the policy. The HTML
 * parser turns CRLF into LF before the browser hashes, so this does too.
 */
export async function inlineScriptHashes(html: string): Promise<string[]> {
  const hashes = new Set<string>();
  for (const [, attrs = '', body = ''] of html.matchAll(SCRIPT_RE)) {
    if (!isExecutableScript(attrs)) continue;
    hashes.add(await sha256Source(body.replace(/\r\n?/g, '\n')));
  }
  return [...hashes];
}

/** The header that carries the report-only CSP for one HTML document. */
export async function reportOnlyCspHeaders(
  html: string,
  vercelPreview = false,
): Promise<Record<string, string>> {
  return {
    'Content-Security-Policy-Report-Only': contentSecurityPolicy({
      scriptHashes: await inlineScriptHashes(html),
      vercelPreview,
    }),
  };
}

export interface CspViolation {
  documentUrl: string;
  directive: string;
  blockedUrl: string;
  sourceFile: string;
  line: number | null;
  sample: string;
}

const MAX_REPORTS = 20;
const MAX_FIELD_LENGTH = 300;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

function text(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, MAX_FIELD_LENGTH) : '';
}

/** Drop the query and hash: they can carry search terms or ids. */
function urlPath(value: unknown): string {
  const url = text(value);
  const end = url.search(/[?#]/);
  return end === -1 ? url : url.slice(0, end);
}

function toViolation(report: Record<string, unknown>): CspViolation {
  const pick = (...keys: string[]) => keys.map((k) => report[k]).find(Boolean);
  const line = pick('lineNumber', 'line-number');
  return {
    documentUrl: urlPath(pick('documentURL', 'document-uri')),
    directive: text(
      pick('effectiveDirective', 'effective-directive', 'violated-directive'),
    ),
    blockedUrl: urlPath(pick('blockedURL', 'blocked-uri')),
    sourceFile: urlPath(pick('sourceFile', 'source-file')),
    line: typeof line === 'number' ? line : null,
    sample: text(pick('sample', 'script-sample')),
  };
}

/**
 * Normalize a CSP report body: the `report-uri` shape
 * (`{ "csp-report": {…} }`) or the Reporting API's array of
 * `{ type: 'csp-violation', body }`. Anything else yields `[]`. Capped and
 * truncated, since anyone can post here.
 */
export function parseCspReports(payload: unknown): CspViolation[] {
  if (Array.isArray(payload)) {
    return payload
      .slice(0, MAX_REPORTS)
      .map(asRecord)
      .filter((entry) => entry.type === 'csp-violation')
      .map((entry) => toViolation(asRecord(entry.body)));
  }
  const report = asRecord(payload)['csp-report'];
  return report ? [toViolation(asRecord(report))] : [];
}
