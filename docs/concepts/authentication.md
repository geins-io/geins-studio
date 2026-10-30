# Authentication

The Geins Studio uses a JWT-based authentication system that is built upon [
`@sidebase/nuxt-auth`](https://auth.sidebase.io/). The authentication logic is handled in a series of server and application files, which are described below.

## Server Files

The files you will find in the `server` directory that are handling authentication are:

- `server/api/auth/[...].ts` - The catch-all for auth requests containing the [NuxtAuthHandler](https://auth.sidebase.io/guide/authjs/nuxt-auth-handler)
- `server/utils/auth.ts` - A utility file with all Geins-specific authentication logic
- `shared/utils/auth-session.ts` - Pure session decisions used by the `NuxtAuthHandler` callbacks: the token after a refresh succeeds or fails, and the session built from a token

## Application Files

The files you will find in the `app` directory that are handling authentication are:

- `app/middleware/auth.global.ts` - A global middleware that protects all routes from being accessed by unauthenticated users, and redirects them to the login page
- `app/composables/useGeinsAuth.ts` - A composable that sits on top of the `useAuth` composable from NuxtAuth and adds Geins-specific functionality
- `app/stores/user.ts` - A Pinia store that loads the signed-in user from `user/me` and exposes computed properties related to the user
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
12. The user is now authenticated and can access the application.

## Refresh Flow

The token is refreshed server-side. When `GET /api/auth/session` arrives with an access token that is expired or expires within 5 minutes, the `jwt` callback calls the Geins `auth/refresh` endpoint and stores the new tokens in the session cookie. On the client, the `refresh` method in `useGeinsAuth.ts` triggers this by re-reading the session; it doesn't force a refresh.

`refresh` is single-flight, and locked across tabs (`createSingleFlight` in `shared/utils/single-flight.ts`):

- **One per tab** — every caller (the `$geinsApi` request interceptor, the proactive check, the invalid-session re-check) shares the call in flight.
- **One at a time across tabs** — it runs under the Web Lock `geins-auth-refresh` (`navigator.locks`; without it, only the per-tab guarantee holds). Tabs share the session cookie, so a tab that waited on the lock reads the token the first tab just rotated, and the server doesn't refresh again with the old refresh token.

A refresh is triggered:

1. Before each `$geinsApi` request, when the access token is expired or expires within 5 minutes.
2. Every 60 seconds while authenticated (`auth-state.ts`, via `usePollWhile`), with the same check, so an idle tab refreshes before the token expires.
3. When a tab becomes visible again, since timers don't run while a laptop sleeps.

A request that still fails with a `401` is retried once; the interceptor re-runs and picks up the refreshed token.

### When a refresh fails

The `jwt` and `session` callbacks never throw: next-auth 4 clears the session cookie whenever one of them does, so a throw is a logout. A failed refresh is recorded on the token instead, and reaches the client as `session.error` (`sessionError` in `useGeinsAuth`):

| Refresh result                              | Token                    | `session.error`       | Effect                                                           |
| ------------------------------------------- | ------------------------ | --------------------- | ---------------------------------------------------------------- |
| Success                                     | New tokens, same account | —                     | Error cleared                                                    |
| `401` / `403`                               | Tokens dropped           | `RefreshTokenInvalid` | `isAuthenticated: false`; the client decides to log out          |
| `5xx`, `404`, `429`, network error, timeout | Kept as is               | `RefreshFailed`       | User stays logged in; the next session fetch retries the refresh |

Calls to the Geins auth endpoints time out after 10 seconds, so a hung refresh becomes a retryable `RefreshFailed` instead of running into the function timeout.

On `RefreshTokenInvalid`, `auth-state.ts` waits 1.5 seconds and re-reads the session once, under the lock: another tab or server instance may have just rotated the token, and its cookie wins. Only if the session is still invalid does the tab log out.

## Cross-tab sync

All tabs share the session cookie, so tabs only send each other signals on the `geins-auth` BroadcastChannel — never tokens or sessions (`AuthBroadcastMessage` in `shared/types/Auth.ts`):

| Signal            | Sent by                                                                                                       | Receiving tab                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `session-changed` | `login`, `verify`, `setAccount` (when they leave the tab authenticated), and `refresh` when the token changed | Re-reads its session (`syncSession`). On an auth page it goes home; if the account changed it reloads `/` |
| `signed-out`      | The auth middleware on `/auth/logout`, where every logout lands after the cookie was cleared                  | Re-reads its session and, if it is no longer authenticated, goes to the login page                        |

A receiving tab never re-signals, and only a deliberate logout sends `signed-out` — a tab whose own session fetch fails or comes back unauthenticated decides for itself and tells no one.
