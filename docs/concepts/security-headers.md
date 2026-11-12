# Security headers

Studio sends a fixed set of security headers on every response and a report-only Content Security Policy (CSP) on every HTML document. Both are production-only: `pnpm dev` sends neither, because `X-Frame-Options: DENY` would also block the Nuxt DevTools iframe. They behave the same on Vercel and on the plain Node server Azure runs. Everything lives in `#shared/utils/security-headers` and is unit-tested in node (`shared/utils/__tests__/security-headers.test.ts`).

## Every response

`SECURITY_HEADERS`, set as `routeRules['/**'].headers` under `$production` in `nuxt.config.ts`. Nitro's Vercel preset writes route-rule headers into `.vercel/output/config.json`, so Vercel's edge adds them to static `/_nuxt/` assets as well as function responses. The Node server's route-rules middleware runs before its static handler, so it does the same.

| Header                    | Value                                      | Why                                                                      |
| ------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `X-Frame-Options`         | `DENY`                                     | No site may frame Studio (clickjacking). Studio isn't embedded anywhere. |
| `Content-Security-Policy` | `frame-ancestors 'none'`                   | The modern form of the above. This one is enforced already.              |
| `X-Content-Type-Options`  | `nosniff`                                  | Browsers trust the declared content type.                                |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`          | Other sites (a channel's storefront preview, say) see only the origin.   |
| `Permissions-Policy`      | `camera=(), microphone=(), geolocation=()` | Studio uses none of them.                                                |

## Report-only CSP

`Content-Security-Policy-Report-Only` reports violations without blocking anything. It will be enforced in a later issue, once the reports are clean.

| Directive                 | Sources                                                | For                                                                        |
| ------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| `default-src`             | `'self'`                                               |                                                                            |
| `script-src`              | `'self'` + a hash per inline script                    | the bundle, Vercel Analytics and Speed Insights (served from `/_vercel/*`) |
| `style-src`               | `'self' 'unsafe-inline'`, `fonts.googleapis.com`       | Vue / reka-ui inline styles, the storefront font picker                    |
| `font-src`                | `'self'`, `fonts.gstatic.com`                          | Suisse Intl, the storefront font picker                                    |
| `img-src`                 | `'self' data: blob:`, media CDN, `*.commerce.services` | assets, product images, `FormInputImage`'s preview of a picked file        |
| `connect-src`             | `'self'`, media CDN, `*.blob.core.windows.net`         | the API proxy, the bulk zip download and replace `HEAD`, upload `PUT`s     |
| `frame-src`               | `'self'`                                               |                                                                            |
| `object-src`              | `'none'`                                               |                                                                            |
| `base-uri`, `form-action` | `'self'`                                               |                                                                            |

The media CDN is `cdn-qa.geins.media` (QA) and `cdn.litium.media` (prod), in `MEDIA_CDN_ORIGINS`. Upload plan URLs are Azure Blob SAS URLs that the browser `PUT`s to directly ([Assets › Upload](/domains/assets)). The `*.blob.core.windows.net` wildcard admits any Azure storage account, so narrow `UPLOAD_ORIGINS` to Geins' accounts before enforcing. On Vercel preview deploys (`VERCEL_ENV=preview`) the policy also allows the Vercel toolbar (`vercel.live`).

A new external host goes into the constants at the top of `security-headers.ts`, never into a hand-edited header string. Prefer serving a library's files from Studio over allowing its host: Blockly's media (sprites, cursors) default to `blockly-demo.appspot.com`, so `nuxt.config.ts` serves `node_modules/blockly/media` at `/_blockly/` (`nitro.publicAssets`) and `BlocklyWorkspace.vue` points `media` there.

### Inline script hashes

The SPA shell has five inline scripts: the importmap, Nuxt's `window.__NUXT__.config`, the color-mode script and the two in `app/app-skeleton.html`. The importmap and the config script change on every build, and the config also changes with runtime env vars (Azure sets them per slot), so hard-coded hashes would go stale. The hashes are computed from the HTML that is actually served: `server/plugins/csp.ts` hooks Nitro's `render:response`, hashes the inline scripts of the outgoing HTML with `inlineScriptHashes` and sets the header.

No page is prerendered. A prerendered page would carry the build's runtime config, and the Azure image only gets `NUXT_PUBLIC_BASE_URL` at runtime: v0.7.0 prerendered `/auth/*`, so litium.studio sent forgot password links to `localhost`.

`inlineScriptHashes` hashes classic, `module`, `importmap` and `speculationrules` scripts. It skips external (`src`) scripts and JSON blocks (`__NUXT_DATA__`), and turns CRLF into LF before hashing, as the HTML parser does.

### Reports

The policy has `report-uri /api/csp-report` and no `report-to`: Chrome ignores `report-uri` once `report-to` is present, and its Reporting API never delivered to this endpoint in testing. `server/api/csp-report.post.ts` logs one warning per violation under the `csp-report` scope: in Vercel's runtime logs, or in App Service's log stream on Azure. It also accepts the Reporting API's format (`parseCspReports`), in case `report-to` comes back. The endpoint is unauthenticated, as browsers post reports without credentials. So it reads at most 64 KB, logs up to 20 trimmed reports per request, strips query strings and fragments from URLs, and always answers `204`.

Code typed into the DevTools console is exempt from the page's CSP, so it can't trigger a test report. A violation from the page itself, such as an `<img>` from a host outside `img-src`, lands as a `csp-report` line in the server log within a second or two.

### No `eval`

`script-src` has no `'unsafe-eval'`, so nothing may compile strings into code. Zod would by default: it probes `new Function` and compiles object validators with it. `app/plugins/zod.ts` sets `z.config({ jitless: true })`, so Zod interprets instead. `vuedraggable`'s dist is a webpack UMD bundle whose global lookup calls `Function('return this')`, which reported on every page load. A `nuxt.config.ts` alias imports its ESM source (`src/vuedraggable.js`, shipped in the package) instead. Its types already point there.

### Documents that inherit the policy

- **Workflow logs pop-out.** `WorkflowPanelLogs.vue` writes into an `about:blank` window, which inherits the opener's CSP. It copies the page's styles in as `<style>` elements, which `'unsafe-inline'` allows.
- **Channel mail preview.** `ChannelMailConfigSheet.vue` renders the preview HTML in a sandboxed `srcdoc` iframe, which inherits the CSP too. Images in a mail template from hosts outside `img-src` show up as reports.

## Why not `nuxt-security`

The module was evaluated and not used:

- With `ssr: false`, its script hashing covers prerendered pages only. Its nonces are for SSR.
- It switches on runtime features by default that break Studio's proxy: a 150-requests-per-5-minutes rate limiter, an XSS validator that rejects HTML request bodies (mail templates), a 2 MB request-size limit and COEP/CORP headers.
- It adds a dependency to the auth and security path for what amounts to five headers and a hash function.
