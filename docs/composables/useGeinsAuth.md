# `useGeinsAuth`

The `useGeinsAuth` composable provides Geins specific authentication and session management: login (password, MFA, account), logout, session reads and token refresh. The browser never holds a Geins token: the tokens live in a sealed, httpOnly session cookie, and the API proxy attaches them. This composable reads the session the server lets the browser see (`GET /api/auth/session`) and posts to Studio's auth routes.

::: tip
Read more about the full authentication flow in Geins MC here: [Authentication](/concepts/authentication)
:::

## Features

- Read the current session (no tokens) and whether the user is signed in.
- Log in with password, MFA code and account, and log out.
- Refresh the token, one refresh at a time across tabs.
- Tell when the access token expires.
- Keep tabs in sync with signals on a BroadcastChannel.

## Usage

```ts
const {
  session,
  isAuthenticated,
  sessionError,
  authStateDiffers,
  accountKey,
  authSignal,
  broadcastAuthSignal,
  login,
  verify,
  setAccount,
  logout,
  refresh,
  forceRefresh,
  syncSession,
  isExpired,
  expiresSoon,
} = useGeinsAuth();
```

## Properties and Methods

### `session`

A `useState('geins-session')` ref holding the client session: whether Geins issued tokens, the account, the access token's expiry, the MFA step and the last refresh error. Never a token. `null` until the first read; the `auth-state` plugin reads it before the route middleware runs.

### `isAuthenticated`

`true` once the session has tokens **and** an account is picked.

### `sessionError`

Why the last token refresh failed, if it did: `RefreshTokenInvalid` (Geins rejected the refresh token) or `RefreshFailed` (transient; the token is kept). See [When a refresh fails](/concepts/authentication#when-a-refresh-fails).

### `authStateDiffers`

`true` when `sessionError` is `RefreshTokenInvalid`: the server dropped the tokens. The `auth-state` plugin re-checks once, then logs out.

### `accountKey`

The account picked for this session.

### `authSignal`

The last auth signal another tab posted on the `geins-auth` BroadcastChannel (`session-changed` or `signed-out`).

### `broadcastAuthSignal`

```ts
broadcastAuthSignal(message: AuthBroadcastMessage): void
```

Posts an auth signal to the other tabs (a tab never receives its own). `login`, `verify`, `setAccount` and `refresh` post `session-changed` themselves when they leave the tab authenticated with a new session; the auth middleware posts `signed-out` on `/auth/logout`, where every logout lands after the cookie was cleared.

### `login`

```ts
login(credentials: LoginCredentials): Promise<SignInResponse>
```

Posts the username and password to `POST /api/auth/login`, then reads the session the route wrote: either the MFA step (`session.mfaActive`) or tokens, with the account picked if the user has only one.

- **Returns:** `{ ok, status }`. `status` is `401` for wrong credentials, `429` for too many attempts, `502` when Geins can't be reached.

### `verify`

```ts
verify(mfaCode: string): Promise<SignInResponse>
```

Posts the MFA code to `POST /api/auth/verify`. The login token stays in the sealed session on the server; the browser never sees it.

- **Returns:** `{ ok, status }`, as `login`. A wrong code keeps the MFA step; after 5 minutes the login token expires and the session is empty again.

### `setAccount`

```ts
setAccount(accountKey: string): Promise<SignInResponse>
```

Picks the account through `POST /api/auth/account`, at login and from the sidebar switcher. The server checks the key against the token's own account claims and answers `403` for an account the user isn't a member of (a Super Admin may use any account).

- **Returns:** `{ ok, status }`

### `logout`

```ts
logout(): Promise<void>
```

Drops the session cookies (`POST /api/auth/logout`), then does a full load of `/auth/logout`, where the auth middleware signals the other tabs (`signed-out`) to go to the login page. Throws if the logout request fails, so a caller can try again. Geins has no endpoint to revoke a refresh token yet: it stays valid until it expires.

### `refresh`

```ts
refresh(): Promise<Session>
```

Re-reads the session from the server, which refreshes the access token if it is expired or expires within 5 minutes. Concurrent calls in a tab share one request, and calls across tabs run one at a time under the Web Lock `geins-auth-refresh` — so after one tab rotates the token, the others read it from the shared cookie instead of refreshing again. See [Refresh Flow](/concepts/authentication#refresh-flow).

A failed read throws and keeps the last session: a failed read is never a logout. When the access token changed, `refresh` signals the other tabs (`session-changed`).

- **Returns:** A promise that resolves to the updated session

### `forceRefresh`

```ts
forceRefresh(rejectedTokenExpires: number | undefined): Promise<Session>
```

Refreshes the access token now, even though it hasn't expired, and resolves with the session after it. The browser never sees the token, so `rejectedTokenExpires` identifies it: the `tokenExpires` of the session the tab held when the API answered `401`. `$geinsApi` calls it when the API answers `401` to the token this tab holds (see [When the API rejects a token](/concepts/authentication#when-the-api-rejects-a-token)). It posts `{ rejectedTokenExpires }` to `POST /api/auth/refresh`, which refreshes only while the cookie still holds that token, so a token another tab already rotated isn't revoked again.

Single-flight like `refresh`: concurrent calls in a tab share one call (the first caller's argument counts), and calls across tabs run one at a time under the same Web Lock. A failed refresh comes back as `sessionError`, as with `refresh`. When the access token changed, it signals the other tabs (`session-changed`).

- **Returns:** A promise that resolves to the updated session

### `syncSession`

```ts
syncSession(): Promise<Session>
```

Re-reads the session like `refresh` (same lock), but never signals the other tabs. Used by signal receivers, so a change doesn't echo back to every tab.

- **Returns:** A promise that resolves to the updated session

### `isExpired`

```ts
isExpired(): boolean
```

Whether the access token has expired, from `session.tokenExpires`.

### `expiresSoon`

```ts
expiresSoon(threshold?: number): boolean
```

Whether the access token expires within `threshold` milliseconds (default 5 minutes).

## Example

```vue
<script setup lang="ts">
const { login, verify, setAccount, session, logout } = useGeinsAuth();

const signIn = async () => {
  const { ok, status } = await login({
    username: 'user@example.com',
    password: 'password',
  });
  if (!ok) {
    // 401: wrong credentials, 429: too many attempts
    return;
  }
  if (session.value?.mfaActive) {
    await verify('123456');
  }
  if (!session.value?.accountKey) {
    await setAccount('account-key');
  }
};
</script>
```

## Type Definitions

```ts
interface UseGeinsAuthReturnType {
  session: Ref<Session | null>;
  isAuthenticated: ComputedRef<boolean>;
  sessionError: ComputedRef<AuthSessionError | undefined>;
  authStateDiffers: ComputedRef<boolean>;
  accountKey: ComputedRef<string | undefined>;
  authSignal: ComputedRef<AuthBroadcastMessage | undefined>;
  broadcastAuthSignal: (message: AuthBroadcastMessage) => void;
  login: (credentials: LoginCredentials) => Promise<SignInResponse>;
  verify: (mfaCode: string) => Promise<SignInResponse>;
  setAccount: (accountKey: string) => Promise<SignInResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<Session>;
  forceRefresh: (rejectedTokenExpires: number | undefined) => Promise<Session>;
  syncSession: () => Promise<Session>;
  isExpired: () => boolean;
  expiresSoon: (threshold?: number) => boolean;
}

// What GET /api/auth/session returns: never a token.
interface Session {
  isAuthenticated: boolean;
  accountKey?: string;
  tokenExpires?: number;
  mfaActive?: boolean;
  mfaMethod?: string;
  error?: AuthSessionError;
}

interface SignInResponse {
  ok: boolean;
  status: number;
}

interface LoginCredentials {
  username: string;
  password?: string;
  rememberMe?: boolean;
}
```

## Dependencies

This composable depends on:

1. **Studio's auth routes** in `server/api/auth/` (`login`, `verify`, `account`, `logout`, `session`, `refresh`), which keep the tokens in the sealed session.
2. **`createSingleFlight`** (`shared/utils/single-flight.ts`) and the Web Locks API for the cross-tab refresh lock.
3. **`CSRF_HEADER`** (`shared/utils/csrf.ts`): every auth `POST` sends it, or the CSRF guard answers `403`.
