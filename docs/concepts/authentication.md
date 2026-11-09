# Authentication

The Geins Studio uses a JWT-based authentication system that is built upon [
`@sidebase/nuxt-auth`](https://auth.sidebase.io/). The authentication logic is handled in a series of server and application files, which are described below.

## Server Files

The files you will find in the `server` directory that are handling authentication are:

- `server/api/auth/[...].ts` - The catch-all for auth requests containing the [NuxtAuthHandler](https://auth.sidebase.io/guide/authjs/nuxt-auth-handler)
- `server/utils/auth.ts` - A utility file with all Geins-specific authentication logic
- `shared/utils/auth-session.ts` - Pure session decisions used by the `NuxtAuthHandler` callbacks: the one retry of a refresh answered `403`, whether a session update forces a refresh, the token after a refresh succeeds or fails, and the session built from a token
- `server/middleware/csrf.ts` - Refuses a state-changing `/api` call that Studio itself didn't send (see [CSRF](#csrf)); the decision is `csrfRejection` in `shared/utils/csrf.ts`
- `server/api/[...].ts` - The API proxy. It turns the `x-access-token` header into a Bearer `authorization` and forwards only allowlisted headers (`pickUpstreamHeaders` in `shared/utils/proxy-headers.ts`), so the session cookie, which holds the tokens, never reaches the Geins API

## Application Files

The files you will find in the `app` directory that are handling authentication are:

- `app/middleware/auth.global.ts` - A global middleware that protects all routes from being accessed by unauthenticated users, and redirects them to the login page (see [Login redirect](#login-redirect))
- `app/pages/auth/login.vue` - The login page. It runs the login, MFA and account steps, then goes to the page the user asked for
- `app/composables/auth/useGeinsAuth.ts` - A composable that sits on top of the `useAuth` composable from NuxtAuth and adds Geins-specific functionality
- `app/stores/user.ts` - A Pinia store that loads the signed-in user from `user/me`, retries a transient failure, and exposes computed properties related to the user
- `app/plugins/geins-api.ts` - The `$geinsApi` fetch instance. It refreshes a due token before each request, and recovers from a token the API rejects (see [When the API rejects a token](#when-the-api-rejects-a-token))
- `shared/utils/auth-recovery.ts` - Pure decisions for a `401` from the API and for retrying the user load
- `app/plugins/auth-state.ts` - A plugin that keeps tabs in sync (see [Cross-tab sync](#cross-tab-sync)), refreshes the token proactively, and makes the deliberate decision to log out when the session has no usable token

::: tip

Read the full documentation of the `useGeinsAuth` composable here: [useGeinsAuth](/composables/useGeinsAuth.md)

:::

## Authentication Flow

1. The user logs in with their credentials using the `login` method found in `useGeinsAuth.ts`
2. The `login` method calls the `signIn` method from NuxtAuth, which sends the credentials to the `NuxtAuthHandler`
3. The `authorize` method in the `NuxtAuthHandler` calls the `login` method in server utility `auth.ts`, which sends the credentials to the Geins API for validation
4. The Geins API validates the credentials and returns an authentication response containing either access and refresh tokens (skip to step 8) or a login token if MFA is required.
5. Upon successfully receiving a login token, the user is redirected to the MFA page, where they enter their MFA code.
6. On submitting, the login token and MFA code is sent with the `verify` method in `useGeinsAuth.ts`, which calls the `signIn` method from NuxtAuth again but this time with the code and the login token.
7. In the `authorize` method of the `NuxtAuthHandler` The `verify` method from server utility `auth.ts` validates the MFA code and login token, and returns an authentication response containing access and refresh tokens.
8. If the authentication response contains multiple accounts and no account is pre-selected, the login page loads the user (with their accounts) into `useUserStore` and presents an account selection interface where they must choose which account to use.
9. The selected account key is set using the `setAccount` method in `useGeinsAuth.ts`, which updates the session with the chosen account key.
10. In the NuxtAuth `jwt` callback, the access and refresh tokens are stored in the NuxtAuth JWT together with expiration time, which is shorter than the NuxtAuth expiration time.
11. The NuxtAuth `session` callback builds the session from the JWT alone — no API call, and it never throws. The session carries tokens only: the user's name, email and accounts live in `useUserStore`, which loads them from `user/me` through `$geinsApi` (awaited at boot by `geins-global.ts`, and on the login page).
12. The user is now authenticated and lands on the page they asked for (see [Login redirect](#login-redirect)).

## Login redirect

The auth middleware sends an unauthenticated user to `/auth/login?redirect=…`, with the requested path in `redirect` (`loginUrl` in `shared/utils/login-redirect.ts`). The path is encoded whole, so its own query survives: `/orders/quotations?status=sent&page=2` comes back intact. From `/`, the link carries no `redirect`.

After login, the login page goes to `safeRedirect(route.query.redirect)`. It keeps only a path with a single leading `/`, and falls back to `/` for anything else: `//host`, a scheme such as `https:` or `javascript:`, a backslash or whitespace anywhere (browsers read `/\host` and `/<tab>/host` as `//host`), an empty value, or a repeated `redirect` param. Vue Router refuses cross-origin pushes, but the check doesn't rely on it.

## Refresh Flow

The token is refreshed server-side. When `GET /api/auth/session` arrives with an access token that is expired or expires within 5 minutes, the `jwt` callback calls the Geins `auth/refresh` endpoint and stores the new tokens in the session cookie. On the client, the `refresh` method in `useGeinsAuth.ts` triggers this by re-reading the session; it doesn't force a refresh.

`refresh` is single-flight, and locked across tabs (`createSingleFlight` in `shared/utils/single-flight.ts`):

- **One per tab** — every caller (the `$geinsApi` request interceptor, the proactive check, the invalid-session re-check) shares the call in flight.
- **One at a time across tabs** — it runs under the Web Lock `geins-auth-refresh` (`navigator.locks`; without it, only the per-tab guarantee holds). Tabs share the session cookie, so a tab that waited on the lock reads the token the first tab just rotated, and the server doesn't refresh again with the old refresh token.

A refresh is triggered:

1. Before each `$geinsApi` request, when the access token is expired or expires within 5 minutes.
2. Every 60 seconds while authenticated (`auth-state.ts`, via `usePollWhile`), with the same check, so an idle tab refreshes before the token expires.
3. When a tab becomes visible again, since timers don't run while a laptop sleeps.

A `401` despite all this means the API rejected the token itself: see [When the API rejects a token](#when-the-api-rejects-a-token).

nuxt-auth's own session refetches (`sessionRefresh.enableOnWindowFocus` / `enablePeriodically` in `nuxt.config.ts`) stay off: they would read the session outside the lock. The only unlocked read left is nuxt-auth's session fetch on page load.

### When a refresh fails

The `jwt` and `session` callbacks never throw: next-auth 4 clears the session cookie whenever one of them does, so a throw is a logout. A failed refresh is recorded on the token instead, and reaches the client as `session.error` (`sessionError` in `useGeinsAuth`):

| Refresh result                                                      | Token                    | `session.error`       | Effect                                                           |
| ------------------------------------------------------------------- | ------------------------ | --------------------- | ---------------------------------------------------------------- |
| Success, first try or after a `403`                                 | New tokens, same account | —                     | Error cleared                                                    |
| `401`, `403` twice in a row, any other `4xx` but `408` and `429`    | Tokens dropped           | `RefreshTokenInvalid` | `isAuthenticated: false`; the client decides to log out          |
| `5xx`, `408`, `429`, network error, timeout (also on the 403 retry) | Kept as is               | `RefreshFailed`       | User stays logged in; the next session fetch retries the refresh |

Geins answers an expired refresh token with `403`, not `401`, so every `4xx` except "try again later" (`408`, `429`) ends the session. Keeping the token on one would leave a session that looks signed in while every API call fails with the expired access token, and the refresh is retried forever.

A `403` is retried once first (`refreshWithRetry`). Geins also answers `403`, with the same body, when its own check of the token fails (a SQL or Key Vault error), and until the backend answers that with a `5xx` instead, Studio can't tell a short outage from a dead token. Without the retry, a blip logs out everyone who refreshes during it. The `jwt` callback waits a jittered 300–800 ms and refreshes again with the **same** refresh token. A dead token stays dead, so the retry costs one request. Reusing the token is safe: Geins refuses it only once a refresh with it has finished, and two refreshes with one token at the same moment both succeed. The retry's own result decides the row above. Nothing else is retried: other `4xx` are final, and `5xx`, network errors and timeouts already keep the session. The client can't do this retry itself, because the server has already dropped the refresh token by the time the client sees `RefreshTokenInvalid`.

Calls to the Geins auth endpoints time out after 10 seconds, so a hung refresh becomes a retryable `RefreshFailed` instead of running into the function timeout. With the `403` retry, a refresh takes at most about 21 seconds: a `403` just inside the timeout, the 800 ms pause, and a retry that times out. A `403` normally comes back fast, so the usual cost of the retry is the pause.

On `RefreshTokenInvalid`, `auth-state.ts` waits 1.5 seconds and re-reads the session once, under the lock: another tab or server instance may have just rotated the token, and its cookie wins. Only if the session is still invalid does the tab log out.

## When the API rejects a token

The server refreshes only a token that is expired or about to expire. The API can still reject one that hasn't expired: after a signing-key rotation, or when a session started against another environment's API. Refreshing on a timer never catches that token, so every call would fail until it expires. Instead, `$geinsApi` handles a `401` (`createUnauthorizedRecovery` in `shared/utils/auth-recovery.ts`):

1. **Force a refresh.** A `401` to a request that carried the token this tab still holds calls `useGeinsAuth().forceRefresh`. It posts `{ forceRefresh: true, rejectedToken }` to `/api/auth/session`, which runs the `jwt` callback with `trigger: 'update'` (nuxt-auth 1.2's client has no `update()`). The callback refreshes through the same `refreshWithRetry` path as a due token (`shouldForceRefresh` in `shared/utils/auth-session.ts`), so a failed refresh is classified the same way and the callback still never throws.
2. **Retry once.** With a new token, the request is retried once (ofetch's retry; `onRequest` sets the new token). A `401` to a token the tab has already replaced is retried the same way, without another refresh.
3. **Log out.** A `401` to the retry means the API rejects the new token too: `logout()`.

| Forced refresh result                                   | Effect                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| New token                                               | The request is retried; a `401` to the retry logs out                            |
| `RefreshTokenInvalid`                                   | The request fails; `auth-state.ts` re-checks once, then logs out (as above)      |
| `RefreshFailed`, or our session endpoint is unreachable | The request fails and the session is kept; the next `401` forces another refresh |
| No session at all                                       | `logout()`                                                                       |

It never applies to a request that carried no token, to a tab that isn't signed in, or on an auth page: those `401`s can't be fixed by a refresh, and acting on them would loop (the login page loads data before sign-in).

Concurrent `401`s share one forced refresh, which runs under the same Web Lock as `refresh`, and start at most one logout. The server refreshes only while the cookie still holds the rejected token: if another tab already rotated it, it returns that token instead, since refreshing again would revoke it.

Loading the user follows the same rules. A `401` from `user/me` goes through the steps above. A transient failure (no response, `408`, `429`, `5xx`) never signs out: `useUserStore` retries it in the background after 1, 2, 5 and 10 seconds, and the sidebar shows a skeleton until the user loads. Nothing shows a placeholder such as "N/A" for the signed-in user.

## Cross-tab sync

All tabs share the session cookie, so tabs only send each other signals on the `geins-auth` BroadcastChannel — never tokens or sessions (`AuthBroadcastMessage` in `shared/types/Auth.ts`):

| Signal            | Sent by                                                                                                       | Receiving tab                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `session-changed` | `login`, `verify`, `setAccount` (when they leave the tab authenticated), and `refresh` when the token changed | Re-reads its session (`syncSession`). On an auth page it goes home; if the account changed it reloads `/` |
| `signed-out`      | The auth middleware on `/auth/logout`, where every logout lands after the cookie was cleared                  | Re-reads its session and, if it is no longer authenticated, goes to the login page                        |

A receiving tab never re-signals, and only a deliberate logout sends `signed-out` — a tab whose own session fetch fails or comes back unauthenticated decides for itself and tells no one.

## CSRF

A browser attaches Studio's cookies to a request from any site, so every state-changing `/api` call (anything but `GET`, `HEAD` and `OPTIONS`) must prove Studio sent it. `server/middleware/csrf.ts` answers `403` unless both hold:

1. **Same origin.** `Sec-Fetch-Site`, which every current browser sends and a page can't set, must be `same-origin`; `same-site` (a sibling subdomain such as `qa.` calling the main host) is refused too. Without it, the `Origin` host must match the host the browser addressed (`x-forwarded-host` honoured). A request with neither passes this step.
2. **The `x-geins-csrf: 1` header.** `$geinsApi` sets it on every request. A cross-origin page can only send a custom header after a CORS preflight, and Studio never answers one.

The header never reaches Geins: it isn't in `UPSTREAM_HEADERS`. A refusal is logged as method, path and reason, never headers or bodies.

Exempt:

- `/api/csp-report` — the browser posts CSP reports itself, without our header.
- `/api/auth/*`, while next-auth owns it — its client can't send our header, and next-auth guards its own POSTs with a double-submit CSRF token. Marked `cutover:`; it goes with the sealed session.
