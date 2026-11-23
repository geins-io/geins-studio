# Security headers

Studio sends a fixed set of security headers on every response and an enforced Content Security Policy (CSP) on every HTML document. Both are production-only: `pnpm dev` sends neither, because `X-Frame-Options: DENY` would also block the Nuxt DevTools iframe. So a host missing from the policy works in dev and breaks in production. They behave the same on Vercel and on the plain Node server Azure runs. Everything lives in `#shared/utils/security-headers` and is unit-tested in node (`shared/utils/__tests__/security-headers.test.ts`).

## Every response

`SECURITY_HEADERS`, set as `routeRules['/**'].headers` under `$production` in `nuxt.config.ts`. Nitro's Vercel preset writes route-rule headers into `.vercel/output/config.json`, so Vercel's edge adds them to static `/_nuxt/` assets as well as function responses. The Node server's route-rules middleware runs before its static handler, so it does the same.

| Header                   | Value                                      | Why                                                                      |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------------------ |
| `X-Frame-Options`        | `DENY`                                     | No site may frame Studio (clickjacking). Studio isn't embedded anywhere. |
| `X-Content-Type-Options` | `nosniff`                                  | Browsers trust the declared content type.                                |
| `Referrer-Policy`        | `strict-origin-when-cross-origin`          | Other sites (a channel's storefront preview, say) see only the origin.   |
| `Permissions-Policy`     | `camera=(), microphone=(), geolocation=()` | Studio uses none of them.                                                |

`frame-ancestors 'none'`, the modern form of `X-Frame-Options`, is in the document's CSP below, not here. A route-rule `Content-Security-Policy` would share its name with the document's header, and the two could clash on Vercel's edge. Non-HTML responses still carry `X-Frame-Options`.

## Content Security Policy

`Content-Security-Policy` is enforced: the browser blocks anything outside it and reports the violation. It ran report-only from v0.7.0 (2026-11-09) until the reports were reviewed.

| Directive                 | Sources                                          | For                                                                                       |
| ------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `default-src`             | `'self'`                                         |                                                                                           |
| `script-src`              | `'self'` + a hash per inline script              | the bundle, Vercel Analytics and Speed Insights (served from `/_vercel/*`)                |
| `style-src`               | `'self' 'unsafe-inline'`, `fonts.googleapis.com` | Vue / reka-ui inline styles, the storefront font picker                                   |
| `font-src`                | `'self'`, `fonts.gstatic.com`                    | Suisse Intl, the storefront font picker                                                   |
| `img-src`                 | `'self' data: blob: https:`                      | assets, product images, channel and mail preview images, `FormInputImage`'s local preview |
| `connect-src`             | `'self'`, media CDN, Geins' storage accounts     | the API proxy, the bulk zip download and replace `HEAD`, upload `PUT`s                    |
| `frame-src`               | `'self'`                                         |                                                                                           |
| `object-src`              | `'none'`                                         |                                                                                           |
| `base-uri`, `form-action` | `'self'`                                         |                                                                                           |
| `frame-ancestors`         | `'none'`                                         | no site may frame Studio                                                                  |

`img-src` allows any `https:` image. The mail preview shows images from each channel's storefront host (`{store}.litium.store` today, customers' own domains later), and stored channel images can point anywhere. Images can't run code, and `script-src` stays locked to hashes.

The media CDN is `cdn-qa.geins.media` (QA) and `cdn.litium.media` (prod), in `MEDIA_CDN_ORIGINS`. Upload plan URLs are Azure Blob SAS URLs that the browser `PUT`s to directly ([Assets › Upload](/domains/assets)). `UPLOAD_ORIGINS` names Geins' two storage accounts, `gestmediaprod` and `gestmediaqa` (`*.blob.core.windows.net`), never a wildcard: any other Azure account would be somewhere to send data. A new account (a new region, say) must be added there, or uploads fail. Read the host from an upload ticket's plan URL, and keep the SAS token out of the code. On Vercel preview deploys (`VERCEL_ENV=preview`) the policy also allows the Vercel toolbar (`vercel.live`).

A new external host goes into the constants at the top of `security-headers.ts`, never into a hand-edited header string. Prefer serving a library's files from Studio over allowing its host: Blockly's media (sprites, cursors) default to `blockly-demo.appspot.com`, so `nuxt.config.ts` serves `node_modules/blockly/media` at `/_blockly/` (`nitro.publicAssets`) and `BlocklyWorkspace.vue` points `media` there.

### Inline script hashes

The SPA shell has five inline scripts: the importmap, Nuxt's `window.__NUXT__.config`, the color-mode script and the two in `app/app-skeleton.html`. The importmap and the config script change on every build, and the config also changes with runtime env vars (Azure sets them per slot), so hard-coded hashes would go stale. The hashes are computed from the HTML that is actually served: `server/plugins/csp.ts` hooks Nitro's `render:response`, hashes the inline scripts of the outgoing HTML with `inlineScriptHashes` and sets the header.

No page is prerendered. A prerendered page would carry the build's runtime config, and the Azure image only gets `NUXT_PUBLIC_BASE_URL` at runtime: v0.7.0 prerendered `/auth/*`, so litium.studio sent forgot password links to `localhost`.

`inlineScriptHashes` hashes classic, `module`, `importmap` and `speculationrules` scripts. It skips external (`src`) scripts and JSON blocks (`__NUXT_DATA__`), and turns CRLF into LF before hashing, as the HTML parser does.

### Reports

The policy has `report-uri /api/csp-report` and no `report-to`: Chrome ignores `report-uri` once `report-to` is present, and its Reporting API never delivered to this endpoint in testing. `server/api/csp-report.post.ts` logs one `CSP violation: …` warning per violation under the `csp-report` scope. It also accepts the Reporting API's format (`parseCspReports`), in case `report-to` comes back. The endpoint is unauthenticated, as browsers post reports without credentials. So it reads at most 64 KB, logs up to 20 trimmed reports per request, strips query strings and fragments from URLs, and always answers `204`.

Code typed into the DevTools console is exempt from the page's CSP, so it can't trigger a test report. A violation from the page itself, such as a `fetch` to a host outside `connect-src`, lands as a `csp-report` line in the server log within a second or two.

Where to read them:

- **Azure (litium.studio, where almost all users are).** App Service `studio-prod-app` (resource group `rg-studio-prod`) keeps container output for 7 days (App Service logs → Application logging: File System). Download it with `az webapp log download -n studio-prod-app -g rg-studio-prod --log-file logs.zip` and search the `*_docker.log` files and `LogFiles/StartupLogs/.sources/*_containerStream.log` for `csp-report`. The log stream (Monitoring → Log stream) is live only.
- **Vercel (geins.studio, qa.geins.studio).** `vercel logs -p <project> --since 23h -q 'csp-report'`. The Pro plan keeps runtime logs for about a day.

Reports that need no change:

- **Inline scripts on `/auth/login` and `/auth/reset-password`** whose line number is past the end of the shell (the 2026-11 review saw `about:1029` in a ~500-line page). A password manager or another extension injects them on pages with a password field. Studio's own inline scripts all carry a hash.
- **`eval` with no source file.** Studio's bundle has a single `eval`: Zod's `Function('')` probe, which is in a `try`. When the CSP blocks it, the probe returns `false` and Zod interprets. A report without a source file comes from an extension.

### No `eval`

`script-src` has no `'unsafe-eval'`, so nothing may compile strings into code. Zod would by default: it probes `new Function` and compiles object validators with it. `app/plugins/zod.ts` sets `z.config({ jitless: true })`, so Zod interprets instead. `vuedraggable`'s dist is a webpack UMD bundle whose global lookup calls `Function('return this')`, which reported on every page load. A `nuxt.config.ts` alias imports its ESM source (`src/vuedraggable.js`, shipped in the package) instead. Its types already point there.

### Documents that inherit the policy

- **Workflow logs pop-out.** `WorkflowPanelLogs.vue` writes into an `about:blank` window, which inherits the opener's CSP. It copies the page's styles in as `<style>` elements, which `'unsafe-inline'` allows.
- **Channel mail preview.** `ChannelMailConfigSheet.vue` renders the preview HTML in a sandboxed `srcdoc` iframe (`sandbox=""`, so no script runs), which inherits the CSP too. Its images come from the channel's storefront host, such as `https://{store}.litium.store/mail/logo.png`. That's why `img-src` takes any `https:` image.

## CSV import relay

A CSV import names files on third-party hosts. The browser can't fetch them: most hosts send no CORS headers, and `connect-src` allows only the media CDN and the storage accounts. So the server fetches each file and streams it into the upload ticket's SAS URL. The bytes never reach the browser, which means the CSP stays as it is. `server/api/media-import/probe.post.ts` answers a file's size and MIME type for the ticket claim. `transfer.post.ts` streams `GET source` → `PUT` plan URL.

Both routes fetch user-supplied URLs, which makes them an SSRF surface. The pure checks live in `#shared/utils/media-import` (unit-tested in node). The network side, an undici `Agent`, lives in `server/utils/media-import.ts`.

- **Session.** A request without a signed-in session (`readSealedSession`) gets `401`; otherwise the relay would be an open proxy. The CSRF middleware covers both routes like every other `/api` POST.
- **Source URL.** `https:` only, no credentials, no `localhost` names.
- **Address checks.** IP literals are checked as they are. A hostname is resolved by a custom `connect.lookup`, which refuses the host when any address is loopback, private, CGNAT, link-local (`169.254.169.254`), unique-local, multicast, reserved or unspecified, including IPv4-mapped, NAT64 and 6to4 forms of those. The socket connects to the address that was checked, so DNS rebinding can't swap it after the check.
- **Redirects.** Followed by hand, at most 5. Every hop is checked again, and `https:` → `http:` is refused.
- **Upload URL.** It must be on `UPLOAD_ORIGINS` (imported, not copied), or the route answers `400`. Without that check, the relay could push data to any host.
- **Headers.** Nothing from the browser is forwarded to the source. The relay sends a fixed `User-Agent` and `Accept-Encoding: identity`, so the probed length is the length that streams.
- **Size.** The declared size must be ≤ `MAX_FILE_BYTES` (1 GB). A source that sends more bytes, or ends short, fails with `SOURCE_SIZE_MISMATCH` before the blob is written. A source with no length at all gets `SOURCE_SIZE_UNKNOWN`.
- **Timeouts.** 10 s to connect, 30 s idle.
- **Logging.** Logs name the host and never the full URL, because a signed URL's query is a credential.

The routes answer a failed row as `{ error: MediaImportErrorCode }` with `200`, not as an HTTP error: one bad row is a row result, and it mustn't fire the global API error toast. `mediaImportErrorMessageKey` maps each code to its message.

Hosting limits:

- **Azure (App Service).** It drops a request that sends nothing for ~240 s. So `transfer` writes a space every 20 s, then the JSON. `JSON.parse` skips leading whitespace.
- **Vercel.** The function's max duration bounds a transfer. It was 15 s, without Fluid compute, when the relay was added (STU-546).

## Why not `nuxt-security`

The module was evaluated and not used:

- With `ssr: false`, its script hashing covers prerendered pages only. Its nonces are for SSR.
- It switches on runtime features by default that break Studio's proxy: a 150-requests-per-5-minutes rate limiter, an XSS validator that rejects HTML request bodies (mail templates), a 2 MB request-size limit and COEP/CORP headers.
- It adds a dependency to the auth and security path for what amounts to five headers and a hash function.
