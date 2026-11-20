# Authentication

Geins Studio keeps the Geins tokens on the server. After login, the access and refresh tokens live only in a sealed, httpOnly session cookie; the API proxy attaches them to every Geins call, and the session the browser reads holds no token. There is no auth library: a few server routes, a sealed-cookie helper, and the `useGeinsAuth` composable.

## Server Files

- `server/api/auth/` - Studio's auth routes: `login.post.ts`, `verify.post.ts`, `account.post.ts`, `logout.post.ts`, `session.get.ts` and `refresh.post.ts` (see [Authentication Flow](#authentication-flow))
- `server/utils/sealed-session.ts` - The session cookie: sealed, split into chunks, read and written per request (see [Session storage](#session-storage))
- `server/utils/geins-session.ts` - The Geins session on top of it: storing a login response, refreshing when due, what the browser may see (`toClientSession`)
- `server/utils/geins-token.ts` - Reads an access token's claims: its expiry, and whether it allows an account (`tokenAllowsAccount`)
- `server/utils/legacy-session.ts` - `cutover:` moves a next-auth session cookie into the sealed session (see [Migrating next-auth sessions](#migrating-next-auth-sessions))
- `server/utils/auth.ts` - Calls the Geins auth endpoints (`auth`, `auth/verify`, `auth/refresh`, `auth/revoke`)
- `server/utils/auth-route-error.ts` - The status an auth route answers for a failed Geins call: `429` passes through, any other `4xx` becomes `401`, the rest `502`
- `shared/utils/auth-session.ts` - Pure refresh decisions: the one retry of a refresh answered `403`, whether a forced refresh runs, the token after a refresh succeeds or fails
- `server/middleware/csrf.ts` - Refuses a state-changing `/api` call that Studio itself didn't send (see [CSRF](#csrf)); the decision is `csrfRejection` in `shared/utils/csrf.ts`
- `server/api/[...].ts` - The API proxy. It takes the token and `x-account-key` from the session, forwards only allowlisted browser headers (`pickUpstreamHeaders` in `shared/utils/proxy-headers.ts`), and never forwards to Geins' own `auth` endpoints, which answer with tokens

## Application Files

The files you will find in the `app` directory that are handling authentication are:

- `app/middleware/auth.global.ts` - A global middleware that protects all routes from being accessed by unauthenticated users, and redirects them to the login page (see [Login redirect](#login-redirect))
- `app/pages/auth/login.vue` - The login page. It runs the login, MFA and account steps, then goes to the page the user asked for
- `app/composables/auth/useGeinsAuth.ts` - Reads the session (`GET /api/auth/session`, no tokens) into `useState('geins-session')` and posts to the auth routes
- `app/stores/user.ts` - A Pinia store that loads the signed-in user from `user/me`, retries a transient failure, and exposes computed properties related to the user
- `app/plugins/geins-api.ts` - The `$geinsApi` fetch instance. It refreshes a due token before each request, and recovers from a `401` to an expired or rejected token (see [When the API rejects a token](#when-the-api-rejects-a-token))
- `shared/utils/auth-recovery.ts` - Pure decisions for a `401` from the API and for retrying the user load
- `app/plugins/auth-state.ts` - Reads the session first (plugins run before the route middleware), keeps tabs in sync (see [Cross-tab sync](#cross-tab-sync)), refreshes the token proactively, and makes the deliberate decision to log out when the session has no usable token

::: tip

Read the full documentation of the `useGeinsAuth` composable here: [useGeinsAuth](/composables/useGeinsAuth.md)

:::

## Authentication Flow

1. The user enters their credentials; `login` in `useGeinsAuth` posts them to `POST /api/auth/login`.
2. The route calls the Geins `auth` endpoint and stores the answer in the sealed session (`storeAuthResponse`). It returns only what the login page does next: `{ mfaRequired, mfaMethod?, accountRequired }`.
3. If MFA is required, the session holds just the Geins login token, for its 5 minutes, and the client session says `mfaActive`. The user enters the code; `verify` posts it alone to `POST /api/auth/verify`, which takes the login token from the sealed session, never from the browser, and stores the tokens Geins returns.
4. With tokens, the session also holds the access token's expiry and, when the user has exactly one account, that account.
5. Otherwise the login page loads the user (with their accounts) into `useUserStore` through `$geinsApi` (the proxy sends the token without an account) and asks which account to use.
6. `setAccount` posts the key to `POST /api/auth/account`. The route answers `403` unless the token allows the account: its `geins:accountkey` claim lists it, or `geins:role` holds the global Super Admin role, whose tokens carry no account claims. Every Geins service checks the same claims, so the proxy can send the stored key without asking again. The sidebar switcher uses the same route.
7. The user is now authenticated and lands on the page they asked for (see [Login redirect](#login-redirect)).

The browser only ever sees the client session from `GET /api/auth/session`: `{ isAuthenticated, accountKey, tokenExpires, mfaActive, mfaMethod, error }`. `isAuthenticated` in `useGeinsAuth` also requires an account. The user's name, email and accounts live in `useUserStore`, which loads them from `user/me`.

`POST /api/auth/logout` revokes the session's refresh token with Geins (`POST auth/revoke`), then drops the session cookies:

- It sends the refresh token the cookie holds now, without refreshing first. A refresh rotates the token, and revoking one that was already exchanged doesn't touch the token it was exchanged for.
- The revoke is best-effort. Logout waits at most 3 s for it (`REVOKE_WAIT_MS`), so a slow Geins can't hold the user. A failure, a timeout or a `404` (where the endpoint isn't deployed yet) is logged with `geinsLogWarn`: the status only, never the token. The cookies are dropped either way, and the route always answers `204`.
- It waits rather than revoking after it has answered: a serverless function may be frozen once it has answered, and the revoke would never be sent.

Geins answers `204` for a valid, unknown, revoked or expired token alike, so a `204` says nothing about the token.

**Residual risk.** Revoking a refresh token doesn't touch access tokens: they have no `jti`, so one already issued stays valid until its `exp` (15 minutes in prod). The access token never leaves the server, so only a stolen session cookie could still use it, and only until then. "Sign out everywhere" (`auth/revoke-all`) isn't built.

## Login redirect

The auth middleware sends an unauthenticated user to `/auth/login?redirect=…`, with the requested path in `redirect` (`loginUrl` in `shared/utils/login-redirect.ts`). The path is encoded whole, so its own query survives: `/orders/quotations?status=sent&page=2` comes back intact. From `/`, the link carries no `redirect`.

After login, the login page goes to `safeRedirect(route.query.redirect)`. It keeps only a path with a single leading `/`, and falls back to `/` for anything else: `//host`, a scheme such as `https:` or `javascript:`, a backslash or whitespace anywhere (browsers read `/\host` and `/<tab>/host` as `//host`), an empty value, or a repeated `redirect` param. Vue Router refuses cross-origin pushes, but the check doesn't rely on it.

## Refresh Flow

The token is refreshed server-side, by the session routes only. `GET /api/auth/session` calls the Geins `auth/refresh` endpoint when the access token is expired or expires within 5 minutes (`refreshSessionIfDue` in `server/utils/geins-session.ts`), and `POST /api/auth/refresh` forces a refresh after a `401` (`forceRefreshSession`). Each writes the outcome into the session cookie on its response. On the client, the `refresh` method in `useGeinsAuth.ts` triggers the first by re-reading the session; it doesn't force a refresh.

`refresh` is single-flight, and locked across tabs (`createSingleFlight` in `shared/utils/single-flight.ts`):

- **One per tab** — every caller (the `$geinsApi` request interceptor, the proactive check, the invalid-session re-check) shares the call in flight.
- **One at a time across tabs** — it runs under the Web Lock `geins-auth-refresh` (`navigator.locks`; without it, only the per-tab guarantee holds). Tabs share the session cookie, so a tab that waited on the lock reads the token the first tab just rotated, and the server doesn't refresh again with the old refresh token.

A refresh is triggered:

1. Before each `$geinsApi` request, when the access token is expired or expires within 5 minutes.
2. Every 60 seconds while authenticated and the tab is visible (`auth-state.ts`, via `usePollWhile`), with the same check, so an idle tab refreshes before the token expires.
3. When a tab becomes visible again, since timers don't run while a laptop sleeps.

A `401` despite all this means the token expired before the tab refreshed it, or the API rejected it: see [When the API rejects a token](#when-the-api-rejects-a-token).

**Never from a hidden tab.** A Geins refresh token is single-use: the refresh revokes it and returns the next one. A sleeping Mac wakes briefly from time to time (Power Nap), and a hidden tab's timers run then. If the machine dozes off again after Geins rotated the token but before the browser stored the response, the cookie keeps the revoked token, and the next refresh gets `403` and logs the user out. So the proactive check does nothing while `document.visibilityState` is `hidden`, and [`usePollWhile`](/composables/usePollWhile) pauses every poll in a hidden tab, since each request from one goes through trigger 1. An access token left to expire in a hidden tab costs nothing: the refresh token lasts 7 days, and the tab refreshes once it is visible again (trigger 3) or before its next request (trigger 1), when the user is back and the machine awake.

A few timers still call the API from a hidden tab, each only while something runs:

- The workflow logs panel (`WorkflowPanelLogs.vue`) polls a running execution, since its pop-out window is meant to be watched while the Studio tab may be hidden.
- [`settleJob`](/concepts/background-jobs) checks a background job for up to 2 minutes of waiting, so its success toast and data refresh land. It counts the delays it scheduled, not wall-clock time, so a sleep stretches it.
- The user store retries a failed `user/me` load at most 4 times, within about 20 seconds.

**The API proxy never refreshes.** It sends the token in the cookie as it is (`readSealedSession`) and never writes the session. Geins refuses a second concurrent refresh with the same refresh token (`403`), and the client's lock can't serialize a refresh on another server instance (Vercel, a scaled-out Azure app). If the proxy refreshed too, it could race a session route, and the loser's `RefreshTokenInvalid` cookie could reach the browser last and log the user out. So only the session routes, which the client calls under its Web Lock, call `auth/refresh`. An expired token comes back `401` from the API, and the client refreshes under the lock and retries.

`POST /api/auth/account` rewrites the cookie it read, so it never refreshes either, and the client calls it under the same lock: otherwise it could write back a refresh token another tab has just spent.

Within one server instance, session reads that arrive together share a single Geins refresh per refresh token (a `Map` of refreshes in flight), for browsers without Web Locks.

After every successful refresh, the stored account is checked against the new token again and cleared if the user was removed from it; the login page then asks for an account.

### When a refresh fails

A session read never throws over a failed refresh: that would turn a Geins hiccup into a logout. The failure is recorded in the session instead, and reaches the client as `session.error` (`sessionError` in `useGeinsAuth`):

| Refresh result                                    | Token                    | `session.error`       | Effect                                                           |
| ------------------------------------------------- | ------------------------ | --------------------- | ---------------------------------------------------------------- |
| Success                                           | New tokens, same account | —                     | Error cleared                                                    |
| `401`, `403`, any other `4xx` but `408` and `429` | Tokens dropped           | `RefreshTokenInvalid` | `isAuthenticated: false`; the client decides to log out          |
| `5xx`, `408`, `429`, network error, timeout       | Kept as is               | `RefreshFailed`       | User stays logged in; the next session fetch retries the refresh |

Geins answers a dead refresh token (expired, revoked, or already redeemed by a concurrent refresh) with `403`, not `401`, so every `4xx` except "try again later" (`408`, `429`) ends the session. Keeping the token on one would leave a session that looks signed in while every API call fails with the expired access token, and the refresh is retried forever.

A `403` is final and never retried. Geins answers a failed check on its own side (a SQL or Key Vault error) with `503`, so a `403` always means a dead token, and a retry would only delay the losing response of a concurrent refresh, which makes it likelier to land last.

Calls to the Geins auth endpoints time out after 10 seconds, so a hung refresh becomes a retryable `RefreshFailed` instead of running into the function timeout.

On `RefreshTokenInvalid`, `auth-state.ts` waits 1.5 seconds and re-reads the session once, under the lock: another tab may have just rotated the token (in a browser without Web Locks), and its cookie wins. Only if the session is still invalid does the tab log out.

## When the API rejects a token

The API proxy never refreshes, so a token that expired before the tab refreshed it reaches the API and comes back `401`: the tab's clock is behind the server's, the tab slept, or the request crossed the 5-minute mark in flight. The API can also reject a token that hasn't expired: after a signing-key rotation, or when a session started against another environment's API, which no expiry check catches. `$geinsApi` handles both the same way (`createUnauthorizedRecovery` in `shared/utils/auth-recovery.ts`):

1. **Force a refresh.** A `401` to a request sent while this tab held a token calls `useGeinsAuth().forceRefresh`. The browser never sees the token, so the session's `tokenExpires` identifies it: `$geinsApi` records it on each request (`sentTokenExpires`). `forceRefresh` posts `{ rejectedTokenExpires }` to `POST /api/auth/refresh`, which refreshes through the same path as a due token (`shouldForceRefresh` in `shared/utils/auth-session.ts`), so a failed refresh is classified the same way and the route never throws over it. A token that is both due and rejected gets one Geins refresh, not two.
2. **Retry once.** With a new token, the request is retried once (ofetch's retry; the proxy sends the new token from the cookie). A `401` to a token the tab has already replaced is retried the same way, without another refresh.
3. **Log out.** A `401` to the retry means the API rejects the new token too: `logout()`.

| Forced refresh result                                   | Effect                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| New token                                               | The request is retried; a `401` to the retry logs out                            |
| `RefreshTokenInvalid`                                   | The request fails; `auth-state.ts` re-checks once, then logs out (as above)      |
| `RefreshFailed`, or our session endpoint is unreachable | The request fails and the session is kept; the next `401` forces another refresh |
| No session at all                                       | `logout()`                                                                       |

It never applies to a request sent while the tab held no token, to a tab that isn't signed in, or on an auth page: those `401`s can't be fixed by a refresh, and acting on them would loop (the login page loads data before sign-in).

Concurrent `401`s share one forced refresh, which runs under the same Web Lock as `refresh`, and start at most one logout. The server refreshes only while the cookie still holds the rejected token: if another tab already rotated it, it returns that token instead, since refreshing again would revoke it.

The orchestrator execution stream (`LiveConsole.vue`) goes through `$geinsApi` too, with `responseType: 'stream'`, so a `401` when it opens refreshes the token and reconnects once. A stream that is already open isn't cut when the token expires.

Loading the user follows the same rules. A `401` from `user/me` goes through the steps above. A transient failure (no response, `408`, `429`, `5xx`) never signs out: `useUserStore` retries it in the background after 1, 2, 5 and 10 seconds, and the sidebar shows a skeleton until the user loads. Nothing shows a placeholder such as "N/A" for the signed-in user.

## Cross-tab sync

All tabs share the session cookie, so tabs only send each other signals on the `geins-auth` BroadcastChannel — never tokens or sessions (`AuthBroadcastMessage` in `shared/types/Auth.ts`):

| Signal            | Sent by                                                                                                       | Receiving tab                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `session-changed` | `login`, `verify`, `setAccount` (when they leave the tab authenticated), and `refresh` when the token changed | Re-reads its session (`syncSession`). On an auth page it goes home; if the account changed it reloads `/` |
| `signed-out`      | The auth middleware on `/auth/logout`, where every logout lands after the cookie was cleared                  | Re-reads its session and, if it is no longer authenticated, goes to the login page                        |

A receiving tab never re-signals, and only a deliberate logout sends `signed-out` — a tab whose own session fetch fails or comes back unauthenticated decides for itself and tells no one.

## CSRF

The proxy authenticates by the session cookie, and a browser attaches Studio's cookies to a request from any site, so every state-changing `/api` call (anything but `GET`, `HEAD` and `OPTIONS`) must prove Studio sent it. `server/middleware/csrf.ts` answers `403` unless both hold:

1. **Same origin.** `Sec-Fetch-Site`, which every current browser sends and a page can't set, must be `same-origin`; `same-site` (a sibling subdomain such as `qa.` calling the main host) is refused too. Without it, the `Origin` host must match the host the browser addressed (`x-forwarded-host` honoured). A request with neither passes this step.
2. **The `x-geins-csrf: 1` header.** `$geinsApi` sets it on every request, and `useGeinsAuth` on every auth `POST`. A cross-origin page can only send a custom header after a CORS preflight, and Studio never answers one.

The header never reaches Geins: it isn't in `UPSTREAM_HEADERS`. A refusal is logged as method, path and reason, never headers or bodies.

Exempt: `/api/csp-report` — the browser posts CSP reports itself, without our header.

The session cookies are `SameSite=Lax`, so a cross-site form post doesn't carry them either.

## Session storage

The session is one value, sealed with `iron-webcrypto` (encrypted and signed) under a key that Nuxt's `deriveSecret('geins-session')` derives from `NUXT_APP_SECRET` (`runtimeConfig.appSecret`, at least 32 characters; builds don't generate one). The seal carries its own expiry. A value that is tampered with, expired or sealed with another secret reads as an empty session, which sends the user to login.

```ts
interface GeinsSession {
  user?: {}; // present once Geins has issued tokens
  accountKey?: string;
  tokenExpires?: number; // the access token's `exp`
  mfa?: { method?: string };
  error?: AuthSessionError;
  secure?: { accessToken?; refreshToken?; loginToken? }; // never leaves the server
}
```

A non-admin's access token grows with every account: it carries `geins:accountkey`, `<accountKey>:<Role>` roles and one `geins:acl:<key>` claim per account. One cookie holds at most 4096 bytes, so the sealed value is split into `geins-session.0` … `geins-session.2`, at most 3,800 bytes each. Every write deletes chunks left over from a longer session, including ones an earlier write in the same response set. At most 3 chunks (about 11.4 KB): Node refuses a request whose headers pass 16 KB in total, before any handler runs, so a fourth chunk plus the other cookies and browser headers could lock a user out of every request, logout included. A session that needs more is refused when it's written, with a `500`, and only its size is logged. That leaves room for about 8 KB of access and refresh token; real tokens today seal to 1.5–3 KB. A server-side session store is the next step if they get close.

The cookies are `httpOnly`, `Secure` outside `pnpm dev`, `SameSite=Lax` and `Path=/`, and live 7 days (Geins refresh tokens slide: each refresh gives 7 more days). The MFA step lives 5 minutes, as the Geins login token does. Reads and writes within one request share the session through `event.context`, so they agree.

## Migrating next-auth sessions

Until Phase 4, sessions lived in next-auth's cookie (`__Secure-next-auth.session-token` on https, `next-auth.session-token` on http, split into `.0`, `.1`, … over 4 KB). So that nobody is logged out by the switch, a request with no sealed session but a next-auth cookie is migrated once (`server/utils/legacy-session.ts`, marked `cutover:`):

1. The chunks are joined and decrypted as next-auth 4 encrypted them: a JWE with `alg: dir` and `enc: A256GCM`, keyed by `HKDF-SHA256(AUTH_SECRET, '', 'NextAuth.js Generated Encryption Key', 32)`.
2. With tokens in it, the access and refresh tokens move into a sealed session. The stored account is kept only if the token allows it. A due token is then refreshed as usual. Only the session routes migrate (the auth-state plugin reads the session before anything else); the API proxy reads the sealed session alone, since a migration writes the cookie too.
3. Every `next-auth.*` cookie is deleted, migrated or not. A cookie that can't be read (tampered, expired, another secret, signed out or mid-MFA) leaves an empty session: login.

`AUTH_SECRET` stays set for this alone. Remove the migration and `AUTH_SECRET` (with `AUTH_PATH` and `AUTH_ORIGIN`) one or two releases after the sealed session ships, once the old cookies have expired (next-auth's 30 days) or been migrated.
